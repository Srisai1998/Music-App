import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../../services/api';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
    } catch {
      // Always show success to prevent email enumeration
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.successIcon}>
          <Ionicons name="mail-outline" size={48} color="#1db954" />
        </View>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          If an account exists for{' '}
          <Text style={{ color: '#1db954', fontWeight: '700' }}>{email}</Text>
          , you'll receive a reset link shortly.
        </Text>
        <Text style={styles.hint}>Check your spam folder if you don't see it.</Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.btnText}>Back to Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => { setSubmitted(false); setEmail(''); }}
        >
          <Text style={styles.link}>Try a different email</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-open-outline" size={48} color="#1db954" />
        </View>

        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color="#535353" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#535353"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={16} color="#b3b3b3" />
          <Text style={styles.link}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1, backgroundColor: '#121212' },
  container: {
    flex: 1, backgroundColor: '#121212',
    paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center',
  },
  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(29,185,84,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(29,185,84,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: {
    color: '#fff', fontSize: 26, fontWeight: '800',
    textAlign: 'center', marginBottom: 12,
  },
  subtitle: {
    color: '#b3b3b3', fontSize: 15, textAlign: 'center',
    lineHeight: 22, marginBottom: 8,
  },
  hint: {
    color: '#535353', fontSize: 12, textAlign: 'center',
    marginBottom: 32,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#282828', borderRadius: 10,
    backgroundColor: '#1e1e1e', paddingHorizontal: 14,
    marginBottom: 16, width: '100%',
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1, color: '#fff', paddingVertical: 14, fontSize: 15,
  },
  btn: {
    width: '100%', backgroundColor: '#1db954',
    borderRadius: 30, paddingVertical: 16, alignItems: 'center',
    marginTop: 8, marginBottom: 16,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#000', fontWeight: '800', fontSize: 16 },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8,
  },
  link: { color: '#b3b3b3', fontSize: 14 },
});
