import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useCreateUnit, getListUnitsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

export default function BeliScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const createUnit = useCreateUnit();

  const [tipe, setTipe] = useState('');
  const [spek, setSpek] = useState('');
  const [minus, setMinus] = useState('');
  const [kelengkapan, setKelengkapan] = useState('');
  const [hargaBeli, setHargaBeli] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 84 + 34 : 84 + insets.bottom;
  const s = makeStyles(colors);

  const reset = () => {
    setTipe(''); setSpek(''); setMinus(''); setKelengkapan(''); setHargaBeli(''); setError(''); setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!tipe.trim() || !spek.trim() || !hargaBeli) { setError('Tipe, spek, dan harga beli wajib diisi'); return; }
    setError('');
    try {
      await createUnit.mutateAsync({
        data: {
          tipe: tipe.trim(),
          spek: spek.trim(),
          minus: minus.trim() || '-',
          kelengkapan: kelengkapan.trim() || '-',
          hargaBeli: Number(hargaBeli.replace(/\D/g, '')),
        },
      });
      await qc.invalidateQueries({ queryKey: getListUnitsQueryKey() });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch (e: any) {
      setError(e?.error ?? 'Gagal menyimpan unit');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad, paddingHorizontal: 16 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>Tambah Unit</Text>
      <Text style={s.subtitle}>Catat pembelian unit baru</Text>

      {success ? (
        <View style={s.successBox}>
          <Feather name="check-circle" size={40} color={colors.statusReady} />
          <Text style={s.successTitle}>Unit Tersimpan!</Text>
          <Text style={s.successSub}>Unit berhasil ditambahkan ke inventaris</Text>
          <TouchableOpacity style={[s.btn, { marginTop: 20, backgroundColor: colors.primary }]} onPress={reset}>
            <Text style={s.btnText}>Tambah Unit Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field label="Tipe / Model *" value={tipe} onChange={setTipe} placeholder="Contoh: iPhone 13 Pro Max 256GB" colors={colors} />
          <Field label="Spesifikasi *" value={spek} onChange={setSpek} placeholder="RAM, storage, warna, kondisi..." multiline colors={colors} />
          <Field label="Minus / Cacat" value={minus} onChange={setMinus} placeholder="Kosongkan jika mulus" colors={colors} />
          <Field label="Kelengkapan" value={kelengkapan} onChange={setKelengkapan} placeholder="Dus, charger, cable..." colors={colors} />
          <Field
            label="Harga Beli (Rp) *"
            value={hargaBeli}
            onChange={v => setHargaBeli(v.replace(/\D/g, ''))}
            placeholder="0"
            keyboardType="numeric"
            colors={colors}
          />

          {error ? (
            <View style={s.errBox}>
              <Feather name="alert-circle" size={13} color={colors.destructive} />
              <Text style={s.errText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.btn, createUnit.isPending && s.btnDisabled]}
            onPress={handleSubmit}
            disabled={createUnit.isPending}
            activeOpacity={0.8}
          >
            {createUnit.isPending
              ? <ActivityIndicator color={colors.primaryForeground} size="small" />
              : <Feather name="save" size={18} color={colors.primaryForeground} />
            }
            <Text style={s.btnText}>{createUnit.isPending ? 'Menyimpan...' : 'Simpan Unit'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType, multiline, colors }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.mutedForeground, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        style={{
          backgroundColor: colors.secondary, borderRadius: 12,
          borderWidth: 1, borderColor: colors.border,
          paddingHorizontal: 14, paddingVertical: 12,
          color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 15,
          textAlignVertical: multiline ? 'top' : 'center',
          minHeight: multiline ? 80 : 46,
        }}
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.foreground },
    subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginTop: 2, marginBottom: 20 },
    card: { borderRadius: 20, borderWidth: 1, padding: 20 },
    errBox: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: '#EF44441A', borderWidth: 1, borderColor: '#EF444433',
      borderRadius: 10, padding: 12, marginBottom: 12,
    },
    errText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.destructive, flex: 1 },
    btn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, borderRadius: 14, height: 52, marginTop: 8,
    },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.primaryForeground },
    successBox: { alignItems: 'center', paddingVertical: 40 },
    successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.foreground, marginTop: 16 },
    successSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginTop: 6 },
  });
}
