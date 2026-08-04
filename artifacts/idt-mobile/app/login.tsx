import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) return;
    setError('');
    setBusy(true);
    try {
      await login(username.trim(), password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setBusy(false);
    }
  };

  const styles = makeStyles(colors, insets);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>IDT</Text>
          </View>
          <Text style={styles.brandName}>INDO DUTA TECH</Text>
          <Text style={styles.brandSub}>PREMIUM RESELLER</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Selamat Datang</Text>
          <Text style={styles.subtitle}>Login ke sistem management</Text>

          {/* Username */}
          <Text style={styles.label}>Username</Text>
          <View style={styles.inputWrap}>
            <Feather name="user" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />
          </View>

          {/* Password */}
          <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
          <View style={styles.inputWrap}>
            <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              editable={!busy}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
            <TouchableOpacity onPress={() => setShowPw(v => !v)} style={styles.eyeBtn}>
              <Feather name={showPw ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={13} color={colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Button */}
          <TouchableOpacity
            style={[styles.btn, (busy || !username.trim() || !password) && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={busy || !username.trim() || !password}
            activeOpacity={0.8}
          >
            {busy
              ? <ActivityIndicator color={colors.primaryForeground} size="small" />
              : <Feather name="log-in" size={18} color={colors.primaryForeground} />
            }
            <Text style={styles.btnText}>{busy ? 'Masuk...' : 'Login'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>INDO DUTA TECH · Sistem Internal</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  const webTop = Platform.OS === 'web' ? 67 : insets.top;
  return StyleSheet.create({
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingTop: webTop + 24,
      paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 24,
      paddingHorizontal: 24,
    },
    logoArea: { alignItems: 'center', marginBottom: 32 },
    logoBox: {
      width: 72, height: 72, borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 14,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    },
    logoText: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.primaryForeground },
    brandName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.foreground },
    brandSub: { fontSize: 10, fontFamily: 'Inter_500Medium', color: colors.mutedForeground, letterSpacing: 2, marginTop: 2 },
    card: {
      backgroundColor: colors.card, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border, padding: 24,
    },
    title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.foreground, textAlign: 'center' },
    subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, textAlign: 'center', marginTop: 4, marginBottom: 24 },
    label: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.mutedForeground, marginBottom: 6 },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.secondary, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12,
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 46, fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.foreground },
    eyeBtn: { padding: 8 },
    errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: '#EF44441A', borderWidth: 1, borderColor: '#EF444433',
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12,
    },
    errorText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.destructive, flex: 1 },
    btn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, borderRadius: 14, height: 52, marginTop: 20,
    },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.primaryForeground },
    footer: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, textAlign: 'center', marginTop: 24 },
  });
}
