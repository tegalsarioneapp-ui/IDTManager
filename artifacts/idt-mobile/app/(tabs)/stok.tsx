import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Platform, Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListUnits, useCompleteQc, useMarkSold, useDeleteUnit,
  getListUnitsQueryKey, type Unit,
} from '@workspace/api-client-react';

const TABS = ['Semua', 'PROSES', 'READY', 'TERJUAL'] as const;
type Filter = typeof TABS[number];

function formatRupiah(v?: number | null) {
  if (!v) return 'Rp 0';
  return 'Rp ' + Math.round(v).toLocaleString('id-ID');
}

function StatusBadge({ status, colors }: { status: string; colors: any }) {
  const cfg = {
    PROSES: { bg: `${colors.statusProses}22`, text: colors.statusProses },
    READY: { bg: `${colors.statusReady}22`, text: colors.statusReady },
    TERJUAL: { bg: `${colors.statusTerjual}22`, text: colors.statusTerjual },
  }[status] ?? { bg: colors.accent, text: colors.foreground };
  return (
    <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
      <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: cfg.text, letterSpacing: 0.5 }}>{status}</Text>
    </View>
  );
}

export default function StokScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('Semua');
  const [qcModal, setQcModal] = useState<Unit | null>(null);
  const [jualModal, setJualModal] = useState<Unit | null>(null);

  const params = filter === 'Semua' ? undefined : { status: filter as 'PROSES' | 'READY' | 'TERJUAL' };
  const { data, isLoading, refetch } = useListUnits(params);

  const completQc = useCompleteQc();
  const markSold = useMarkSold();
  const deleteUnit = useDeleteUnit();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 84 + 34 : 84 + insets.bottom;
  const s = makeStyles(colors);

  const handleDelete = (unit: Unit) => {
    Alert.alert('Hapus Unit', `Hapus ${unit.tipe}?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await deleteUnit.mutateAsync({ id: unit.id });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          qc.invalidateQueries({ queryKey: getListUnitsQueryKey() });
        },
      },
    ]);
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 16 }]}>
        <Text style={s.title}>Stok Unit</Text>
        {/* Filter tabs */}
        <View style={s.filterRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.filterChip, filter === tab && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[s.filterText, filter === tab && { color: colors.primaryForeground }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={u => String(u.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botPad, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        scrollEnabled={!!(data?.length)}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <Feather name="inbox" size={40} color={colors.mutedForeground} />
              <Text style={s.emptyText}>Tidak ada unit</Text>
            </View>
          ) : null
        }
        renderItem={({ item: unit }) => (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.unitType}>{unit.tipe}</Text>
                <Text style={s.unitSpek} numberOfLines={2}>{unit.spek}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <StatusBadge status={unit.status} colors={colors} />
                <TouchableOpacity onPress={() => handleDelete(unit)}>
                  <Feather name="trash-2" size={15} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={s.cardMeta}>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>Modal Beli</Text>
                <Text style={s.metaValue}>{formatRupiah(unit.hargaBeli)}</Text>
              </View>
              {unit.biayaQc > 0 && (
                <View style={s.metaItem}>
                  <Text style={s.metaLabel}>Biaya QC</Text>
                  <Text style={s.metaValue}>{formatRupiah(unit.biayaQc)}</Text>
                </View>
              )}
              {unit.hargaJual && (
                <View style={s.metaItem}>
                  <Text style={s.metaLabel}>Harga Jual</Text>
                  <Text style={[s.metaValue, { color: colors.statusReady }]}>{formatRupiah(unit.hargaJual)}</Text>
                </View>
              )}
            </View>
            {unit.status === 'PROSES' && (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: `${colors.statusProses}22`, borderColor: `${colors.statusProses}44` }]} onPress={() => setQcModal(unit)}>
                <Feather name="check-square" size={14} color={colors.statusProses} />
                <Text style={[s.actionText, { color: colors.statusProses }]}>Selesaikan QC</Text>
              </TouchableOpacity>
            )}
            {unit.status === 'READY' && (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: `${colors.statusReady}22`, borderColor: `${colors.statusReady}44` }]} onPress={() => setJualModal(unit)}>
                <Feather name="tag" size={14} color={colors.statusReady} />
                <Text style={[s.actionText, { color: colors.statusReady }]}>Jual Unit</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* QC Modal */}
      {qcModal && (
        <QcModal
          unit={qcModal}
          colors={colors}
          onClose={() => setQcModal(null)}
          onSuccess={() => {
            setQcModal(null);
            qc.invalidateQueries({ queryKey: getListUnitsQueryKey() });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
          completeQc={completQc}
        />
      )}

      {/* Jual Modal */}
      {jualModal && (
        <JualModal
          unit={jualModal}
          colors={colors}
          onClose={() => setJualModal(null)}
          onSuccess={() => {
            setJualModal(null);
            qc.invalidateQueries({ queryKey: getListUnitsQueryKey() });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
          markSold={markSold}
        />
      )}
    </View>
  );
}

function QcModal({ unit, colors, onClose, onSuccess, completeQc }: any) {
  const [biaya, setBiaya] = useState('');
  const [fisik, setFisik] = useState('Normal');
  const [baterai, setBaterai] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!biaya || !baterai) { setErr('Isi semua field'); return; }
    setBusy(true);
    try {
      await completeQc.mutateAsync({ id: unit.id, data: { biayaQc: Number(biaya), fisik, baterai: Number(baterai) } });
      onSuccess();
    } catch (e: any) { setErr(e?.error ?? 'Gagal'); }
    finally { setBusy(false); }
  };

  return (
    <Modal transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
          <Text style={{ fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.foreground, marginBottom: 4 }}>Selesaikan QC</Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 20 }}>{unit.tipe}</Text>
          <ModalInput label="Biaya QC (Rp)" value={biaya} onChange={setBiaya} keyboardType="numeric" colors={colors} />
          <ModalInput label="Kondisi Fisik" value={fisik} onChange={setFisik} colors={colors} />
          <ModalInput label="Kapasitas Baterai (%)" value={baterai} onChange={setBaterai} keyboardType="numeric" colors={colors} />
          {err ? <Text style={{ color: colors.destructive, fontSize: 12, marginTop: 8 }}>{err}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <TouchableOpacity style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }} onPress={onClose}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }}>Selesai</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function JualModal({ unit, colors, onClose, onSuccess, markSold }: any) {
  const [harga, setHarga] = useState('');
  const [nama, setNama] = useState('');
  const [nomor, setNomor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!harga || !nama || !nomor) { setErr('Isi semua field'); return; }
    setBusy(true);
    try {
      await markSold.mutateAsync({ id: unit.id, data: { hargaJual: Number(harga), namaPembeli: nama, nomorPembeli: nomor } });
      onSuccess();
    } catch (e: any) { setErr(e?.error ?? 'Gagal'); }
    finally { setBusy(false); }
  };

  return (
    <Modal transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
          <Text style={{ fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.foreground, marginBottom: 4 }}>Jual Unit</Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 20 }}>{unit.tipe}</Text>
          <ModalInput label="Harga Jual (Rp)" value={harga} onChange={setHarga} keyboardType="numeric" colors={colors} />
          <ModalInput label="Nama Pembeli" value={nama} onChange={setNama} colors={colors} />
          <ModalInput label="Nomor HP Pembeli" value={nomor} onChange={setNomor} keyboardType="phone-pad" colors={colors} />
          {err ? <Text style={{ color: colors.destructive, fontSize: 12, marginTop: 8 }}>{err}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <TouchableOpacity style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }} onPress={onClose}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: colors.statusReady, alignItems: 'center', justifyContent: 'center' }} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold' }}>Jual</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ModalInput({ label, value, onChange, keyboardType, colors }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} keyboardType={keyboardType}
        style={{ backgroundColor: colors.secondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 46, color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 15 }}
        placeholderTextColor={colors.mutedForeground}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.foreground, marginBottom: 12 },
    filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    filterChip: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
    },
    filterText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.mutedForeground },
    card: {
      borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10,
    },
    cardTop: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    unitType: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    unitSpek: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginTop: 2 },
    cardMeta: { flexDirection: 'row', gap: 16, marginBottom: 10 },
    metaItem: {},
    metaLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.mutedForeground },
    metaValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    actionBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, height: 38, borderRadius: 10, borderWidth: 1,
    },
    actionText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    empty: { paddingVertical: 60, alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.mutedForeground },
  });
}
