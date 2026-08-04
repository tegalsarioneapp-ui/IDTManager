import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function ProfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [pwModal, setPwModal] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 84 + 34 : 84 + insets.bottom;
  const s = makeStyles(colors);

  const handleLogout = () => {
    Alert.alert('Logout', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          setLogoutBusy(true);
          await logout();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: botPad, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={s.avatarArea}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.displayName?.charAt(0).toUpperCase() ?? 'A'}</Text>
        </View>
        <Text style={s.displayName}>{user?.displayName}</Text>
        <Text style={s.username}>@{user?.username}</Text>
      </View>

      {/* Info card */}
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <InfoRow icon="user" label="Username" value={user?.username ?? ''} colors={colors} />
        <Divider colors={colors} />
        <InfoRow icon="tag" label="Tampilan" value={user?.displayName ?? ''} colors={colors} />
        <Divider colors={colors} />
        <InfoRow icon="shield" label="Status" value="Administrator" colors={colors} accent={colors.statusReady} />
      </View>

      {/* Actions */}
      <Text style={s.sectionTitle}>Keamanan</Text>
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActionRow icon="lock" label="Ganti Password" colors={colors} onPress={() => setPwModal(true)} />
      </View>

      {/* Logout */}
      <TouchableOpacity style={[s.logoutBtn, { borderColor: colors.destructive + '44', backgroundColor: `${colors.destructive}11` }]} onPress={handleLogout} disabled={logoutBusy}>
        {logoutBusy
          ? <ActivityIndicator color={colors.destructive} size="small" />
          : <Feather name="log-out" size={18} color={colors.destructive} />
        }
        <Text style={[s.logoutText, { color: colors.destructive }]}>Logout</Text>
      </TouchableOpacity>

      <Text style={s.footer}>INDO DUTA TECH · v1.0.0</Text>

      {pwModal && <ChangePasswordModal colors={colors} onClose={() => setPwModal(false)} />}
    </ScrollView>
  );
}

function ChangePasswordModal({ colors, onClose }: { colors: any; onClose: () => void }) {
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (newPw.length < 6) { setErr('Password minimal 6 karakter'); return; }
    if (newPw !== confirm) { setErr('Konfirmasi tidak cocok'); return; }
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPw }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) { setErr(e.message ?? 'Gagal'); }
    finally { setBusy(false); }
  };

  return (
    <Modal transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
          <Text style={{ fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.foreground, marginBottom: 20 }}>
            {done ? 'Password Diubah!' : 'Ganti Password'}
          </Text>
          {done ? (
            <>
              <Feather name="check-circle" size={36} color={colors.statusReady} style={{ alignSelf: 'center', marginVertical: 16 }} />
              <TouchableOpacity style={{ height: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }} onPress={onClose}>
                <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }}>Selesai</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {['Password Baru', 'Konfirmasi'].map((lbl, i) => (
                <View key={lbl} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginBottom: 6 }}>{lbl}</Text>
                  <TextInput
                    secureTextEntry value={i === 0 ? newPw : confirm}
                    onChangeText={i === 0 ? setNewPw : setConfirm}
                    placeholder={`Masukkan ${lbl.toLowerCase()}`}
                    placeholderTextColor={colors.mutedForeground}
                    style={{ backgroundColor: colors.secondary, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 46, color: colors.foreground, fontFamily: 'Inter_400Regular', fontSize: 15 }}
                  />
                </View>
              ))}
              {err ? <Text style={{ color: colors.destructive, fontSize: 12, marginBottom: 8 }}>{err}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <TouchableOpacity style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }} onPress={onClose}>
                  <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }} onPress={submit} disabled={busy}>
                  {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }}>Simpan</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({ icon, label, value, colors, accent }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={icon} size={16} color={accent ?? colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>{label}</Text>
        <Text style={{ fontSize: 15, fontFamily: 'Inter_500Medium', color: accent ?? colors.foreground, marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({ icon, label, colors, onPress }: any) {
  return (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 }} onPress={onPress}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={icon} size={16} color={colors.mutedForeground} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.foreground }}>{label}</Text>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 50 }} />;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    avatarArea: { alignItems: 'center', marginBottom: 28 },
    avatar: {
      width: 80, height: 80, borderRadius: 24,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
      marginBottom: 12,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    avatarText: { fontSize: 32, fontFamily: 'Inter_700Bold', color: colors.primaryForeground },
    displayName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.foreground },
    username: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginTop: 4 },
    card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground, marginBottom: 10, letterSpacing: 0.5 },
    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      height: 52, borderRadius: 14, borderWidth: 1, marginBottom: 24,
    },
    logoutText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
    footer: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, textAlign: 'center' },
  });
}
