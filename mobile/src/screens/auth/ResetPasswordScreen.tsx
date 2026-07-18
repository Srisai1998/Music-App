import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../services/api';

interface PasswordCheck {
  label: string;
  pass: boolean;
}

function StrengthBar({ password }: { password: string }) {
  const checks: PasswordCheck[] = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special character', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const color = score <= 1 ? '#ef4444' : score === 2 ? '#f59e0b' : score === 3 ? '#3b82f6' : '#1db954';
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <View style={sbStyles.wrap}>
      {/* Bar */}
      <View style={sbStyles.barRow}>
        {[1, 2, 3, 4].map((n) => (
          <View
            key={n}
            style={[sbStyles.barSegment, { backgroundColor: n <= score ? color : '#535353' }]}
          />
        ))}
        <Text style={[sbStyles.label, { color }]}>{labels[score]}</Text>
      </View>
      {/* Checklist */}
      {checks.map((c) => (
        <View key={c.label} style={sbStyles.checkRow}>
          <Ionicons
            name={c.pass ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={c.pass ? '#1db954' : '#535353'}
          />
          <Text style={[sbStyles.checkText, { color: c.pass ? '#fff' : '#535353' }]}>
            {c.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const sbStyles = StyleSheet.create({
  wrap: { marginTop: 10, marginBottom: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  barSegment: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: '700', marginLeft: 6, width: 40 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  checkText: { fontSize: 12 },
});

export default function ResetPasswordScreen({ route, navigation }: any) {
  const { token } = route.params || {};
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!password || !confirm) {
      Alert.alert('Error', 'Please fill in all fields'); return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters'); return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match'); return;
    }
    if (!token) {
      Alert.alert('Error', 'Reset token is missing. Please request a new link.'); return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Reset link has expired. Please request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Success ── */
  if (done) {
    return (
      <View style={styles.container}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={56} color="#1db954" />
        </View>
        <Text style={styles.title}>Password Changed!</Text>
        <Text style={styles.subtitle}>
          Your password has been reset successfully. You can now log in with your new password.
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.btnText}>Log In Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ── Invalid token ── */
  if (!token) {
    return (
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={56} color="#ef4444" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Invalid Link</Text>
        <Text style={styles.subtitle}>
          This reset link is invalid or has expired. Please request a new one.
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.btnText}>Request New Link</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ── Form ── */
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed-outline" size={40} color="#1db954" />
        </View>

        <Text style={styles.title}>Set new password</Text>
        <Text style={styles.subtitle}>
          Choose a strong password you haven't used before.
        </Text>

        {/* New password */}
        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            placeholderTextColor="#535353"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={styles.eyeBtn}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#535353" />
          </TouchableOpacity>
        </View>
        <StrengthBar password={password} />

        {/* Confirm password */}
        <Text style={[styles.label, { marginTop: 16 }]}>Confirm Password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Re-enter new password"
            placeholderTextColor="#535353"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
            <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#535353" />
          </TouchableOpacity>
        </View>
        {confirm.length > 0 && password !== confirm && (
          <Text style={styles.errorText}>Passwords do not match</Text>
        )}
        {confirm.length > 0 && password === confirm && (
          <View style={styles.matchRow}>
            <Ionicons name="checkmark-circle" size={14} color="#1db954" />
            <Text style={styles.matchText}>Passwords match</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, (loading || password !== confirm) && styles.btnDisabled]}
          onPress={handleReset}
          disabled={loading || password !== confirm}
        >
          <Text style={styles.btnText}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 24, paddingTop: 32 },
  container: {
    flex: 1, backgroundColor: '#121212',
    paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center',
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(29,185,84,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, alignSelf: 'center',
  },
  successIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(29,185,84,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: {
    color: '#fff', fontSize: 26, fontWeight: '800',
    marginBottom: 10, textAlign: 'center',
  },
  subtitle: {
    color: '#b3b3b3', fontSize: 14, lineHeight: 21,
    marginBottom: 28, textAlign: 'center',
  },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#282828', borderRadius: 10,
    backgroundColor: '#1e1e1e', paddingHorizontal: 14, marginBottom: 4,
  },
  input: { flex: 1, color: '#fff', paddingVertical: 14, fontSize: 15 },
  eyeBtn: { padding: 4 },
  btn: {
    width: '100%', backgroundColor: '#1db954',
    borderRadius: 30, paddingVertical: 16, alignItems: 'center',
    marginTop: 24, marginBottom: 16,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4, marginBottom: 4 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  matchText: { color: '#1db954', fontSize: 12 },
});
