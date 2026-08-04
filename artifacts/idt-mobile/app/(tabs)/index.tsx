import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGetDashboard } from '@workspace/api-client-react';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

function formatRupiah(val?: number | null) {
  if (!val) return 'Rp 0';
  return 'Rp ' + Math.round(val).toLocaleString('id-ID');
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useGetDashboard();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 84 + 34 : 84 + insets.bottom;

  const s = makeStyles(colors);

  return (
    <ScrollView
      style={[s.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad, paddingHorizontal: 16 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Halo, {user?.displayName?.split(' ')[0]} 👋</Text>
          <Text style={s.subGreeting}>Overview operasional hari ini</Text>
        </View>
        <View style={s.logoBadge}>
          <Text style={s.logoText}>IDT</Text>
        </View>
      </View>

      {error ? (
        <View style={s.errBox}>
          <Feather name="alert-triangle" size={20} color={colors.destructive} />
          <Text style={s.errText}>Gagal memuat dashboard</Text>
        </View>
      ) : (
        <>
          {/* KPI Cards */}
          <View style={s.kpiGrid}>
            <KpiCard label="Total Modal" value={formatRupiah(data?.totalModal)} icon="dollar-sign" colors={colors} loading={isLoading} accent={colors.statusProses} />
            <KpiCard label="Est. Nilai Jual" value={formatRupiah(data?.estimasiNilaiJual)} icon="trending-up" colors={colors} loading={isLoading} accent="#8B5CF6" />
            <KpiCard label="Potensi Profit" value={formatRupiah(data?.potensiProfit)} icon="activity" colors={colors} loading={isLoading} accent={colors.statusReady} />
            <KpiCard label="Realisasi Profit" value={formatRupiah(data?.realisasiProfit)} icon="check-circle" colors={colors} loading={isLoading} accent={colors.primary} solid />
          </View>

          {/* Status Pills */}
          <Text style={s.sectionTitle}>Status Unit</Text>
          <View style={s.statusRow}>
            <StatusPill label="PROSES" count={data?.totalUnitProses} color={colors.statusProses} colors={colors} loading={isLoading} />
            <StatusPill label="READY" count={data?.totalUnitReady} color={colors.statusReady} colors={colors} loading={isLoading} />
            <StatusPill label="TERJUAL" count={data?.totalUnitTerjual} color={colors.statusTerjual} colors={colors} loading={isLoading} />
          </View>

          {/* Recent Units */}
          <Text style={s.sectionTitle}>Unit Terbaru</Text>
          {isLoading
            ? [1, 2, 3].map(i => <View key={i} style={[s.unitSkeleton, { backgroundColor: colors.card }]} />)
            : (data?.recentUnits ?? []).map(unit => (
              <View key={unit.id} style={[s.unitRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.unitType}>{unit.tipe}</Text>
                  <Text style={s.unitSpek} numberOfLines={1}>{unit.spek}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[s.badge, { backgroundColor: unit.status === 'PROSES' ? `${colors.statusProses}22` : unit.status === 'READY' ? `${colors.statusReady}22` : `${colors.statusTerjual}22` }]}>
                    <Text style={[s.badgeText, { color: unit.status === 'PROSES' ? colors.statusProses : unit.status === 'READY' ? colors.statusReady : colors.statusTerjual }]}>{unit.status}</Text>
                  </View>
                  <Text style={s.unitPrice}>{formatRupiah(unit.hargaBeli)}</Text>
                </View>
              </View>
            ))
          }
        </>
      )}
    </ScrollView>
  );
}

function KpiCard({ label, value, icon, colors, loading, accent, solid }: any) {
  const s = StyleSheet.create({
    card: {
      width: '48%', borderRadius: 16, padding: 14, marginBottom: 10,
      backgroundColor: solid ? accent : colors.card,
      borderWidth: 1, borderColor: solid ? 'transparent' : colors.border,
    },
    iconWrap: {
      width: 32, height: 32, borderRadius: 10,
      backgroundColor: solid ? 'rgba(255,255,255,0.2)' : `${accent}22`,
      alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    },
    label: { fontSize: 11, fontFamily: 'Inter_500Medium', color: solid ? 'rgba(255,255,255,0.75)' : colors.mutedForeground, marginBottom: 2 },
    value: { fontSize: 15, fontFamily: 'Inter_700Bold', color: solid ? colors.primaryForeground : colors.foreground },
    skeleton: { height: 14, borderRadius: 6, backgroundColor: colors.border, marginTop: 4, width: '80%' },
  });
  return (
    <View style={s.card}>
      <View style={s.iconWrap}>
        <Feather name={icon} size={15} color={solid ? 'rgba(255,255,255,0.9)' : accent} />
      </View>
      <Text style={s.label}>{label}</Text>
      {loading ? <View style={s.skeleton} /> : <Text style={s.value}>{value}</Text>}
    </View>
  );
}

function StatusPill({ label, count, color, colors, loading }: any) {
  const s = StyleSheet.create({
    pill: {
      flex: 1, borderRadius: 14, padding: 14, alignItems: 'center',
      backgroundColor: `${color}15`, borderWidth: 1, borderColor: `${color}30`,
    },
    count: { fontSize: 28, fontFamily: 'Inter_700Bold', color },
    label: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color, letterSpacing: 1, marginTop: 2 },
    skeleton: { height: 28, width: 36, borderRadius: 6, backgroundColor: colors.border },
  });
  return (
    <View style={s.pill}>
      {loading ? <View style={s.skeleton} /> : <Text style={s.count}>{count ?? 0}</Text>}
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    greeting: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.foreground },
    subGreeting: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginTop: 2 },
    logoBadge: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    logoText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.primaryForeground },
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.foreground, marginTop: 8, marginBottom: 12 },
    statusRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    unitSkeleton: { height: 68, borderRadius: 14, marginBottom: 8 },
    unitRow: {
      flexDirection: 'row', alignItems: 'center',
      borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, gap: 12,
    },
    unitType: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    unitSpek: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 4 },
    badgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
    unitPrice: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.mutedForeground },
    errBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20, justifyContent: 'center' },
    errText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.destructive },
  });
}
