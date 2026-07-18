import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { loginUser } from '../../store/slices/authSlice';

export default function LoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Text style={styles.title}>Log In</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#535353"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#535353"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.btn, isLoading && { opacity: 0.6 }]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.btnText}>{isLoading ? 'Logging in...' : 'Log In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.forgotWrap}
      >
        <Text style={styles.forgot}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 8 }}>
        <Text style={styles.link}>Don't have an account? <Text style={{ color: '#1db954' }}>Sign up</Text></Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 24, justifyContent: 'center', gap: 12 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#282828', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, backgroundColor: '#1e1e1e' },
  btn: { backgroundColor: '#1db954', borderRadius: 30, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  error: { color: '#ef4444', fontSize: 14 },
  link: { color: '#b3b3b3', textAlign: 'center' },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 8 },
  forgot: { color: '#b3b3b3', fontSize: 13, textDecorationLine: 'underline' },
});
