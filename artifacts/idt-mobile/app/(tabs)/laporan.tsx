import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useGetDashboard } from '@workspace/api-client-react';

function formatRupiah(v?: number | null) {
  if (!v) return 'Rp 0';
  return 'Rp ' + Math.round(v).toLocaleString('id-ID');
}

function formatPct(val?: number | null) {
  if (!val) return '0%';
  return val.toFixed(1) + '%';
}

export default function LaporanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useGetDashboard();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 84 + 34 : 84 + insets.bottom;
  const s = makeStyles(colors);

  const roa = data?.totalModalTerjual
    ? (data.realisasiProfit / data.totalModalTerjual) * 100
    : null;

  const margin = data?.totalUnitTerjual && data?.realisasiProfit
    ? (data.realisasiProfit / (data.estimasiNilaiJual ?? 1)) * 100
    : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad, paddingHorizontal: 16 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>Laporan Keuangan</Text>
      <Text style={s.subtitle}>Ringkasan finansial terkini</Text>

      {error ? (
        <View style={s.errBox}>
          <Feather name="alert-triangle" size={20} color={colors.destructive} />
          <Text style={s.errText}>Gagal memuat laporan</Text>
        </View>
      ) : (
        <>
          {/* Profit highlight */}
          <View style={[s.highlight, { backgroundColor: colors.primary }]}>
            <Text style={[s.hlLabel, { color: `${colors.primaryForeground}99` }]}>Realisasi Profit</Text>
            <Text style={[s.hlValue, { color: colors.primaryForeground }]}>
              {isLoading ? '...' : formatRupiah(data?.realisasiProfit)}
            </Text>
            <Text style={[s.hlSub, { color: `${colors.primaryForeground}88` }]}>
              ROA: {isLoading ? '...' : roa !== null ? formatPct(roa) : '—'}
            </Text>
          </View>

          {/* Grid */}
          <View style={s.grid}>
            <MetricCard label="Total Modal (READY)" value={formatRupiah(data?.totalModal)} icon="dollar-sign" color={colors.statusProses} colors={colors} loading={isLoading} />
            <MetricCard label="Modal Terjual" value={formatRupiah(data?.totalModalTerjual)} icon="shopping-bag" color={colors.statusTerjual} colors={colors} loading={isLoading} />
            <MetricCard label="Est. Nilai Jual" value={formatRupiah(data?.estimasiNilaiJual)} icon="trending-up" color="#8B5CF6" colors={colors} loading={isLoading} />
            <MetricCard label="Potensi Profit" value={formatRupiah(data?.potensiProfit)} icon="activity" color={colors.statusReady} colors={colors} loading={isLoading} />
          </View>

          {/* Ratios */}
          <Text style={s.sectionTitle}>Rasio Keuangan</Text>
          <View style={[s.ratioCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <RatioRow label="Return on Asset (ROA)" value={roa !== null ? formatPct(roa) : '—'} note="Profit / Modal Terjual" colors={colors} loading={isLoading} />
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
            <RatioRow label="Unit Terjual" value={String(data?.totalUnitTerjual ?? 0)} note="Total unit berhasil dijual" colors={colors} loading={isLoading} />
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
            <RatioRow label="Unit Aktif" value={String((data?.totalUnitProses ?? 0) + (data?.totalUnitReady ?? 0))} note="PROSES + READY" colors={colors} loading={isLoading} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function MetricCard({ label, value, icon, color, colors, loading }: any) {
  return (
    <View style={{ width: '48%', backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 }}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Feather name={icon} size={15} color={color} />
      </View>
      <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.mutedForeground, marginBottom: 2 }}>{label}</Text>
      {loading
        ? <View style={{ height: 14, borderRadius: 6, backgroundColor: colors.border, width: '80%', marginTop: 4 }} />
        : <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.foreground }}>{value}</Text>
      }
    </View>
  );
}

function RatioRow({ label, value, note, colors, loading }: any) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.foreground }}>{label}</Text>
        <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginTop: 2 }}>{note}</Text>
      </View>
      {loading
        ? <View style={{ height: 20, width: 50, borderRadius: 6, backgroundColor: colors.border }} />
        : <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.primary }}>{value}</Text>
      }
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.foreground },
    subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginTop: 2, marginBottom: 20 },
    highlight: { borderRadius: 20, padding: 24, marginBottom: 16 },
    hlLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
    hlValue: { fontSize: 32, fontFamily: 'Inter_700Bold', marginTop: 4 },
    hlSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.foreground, marginBottom: 12 },
    ratioCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
    errBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20, justifyContent: 'center' },
    errText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.destructive },
  });
}
