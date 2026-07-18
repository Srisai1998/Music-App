import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import api from '../../services/api';
import { useAppDispatch } from '../../hooks/useRedux';
import { loginUser } from '../../store/slices/authSlice';

export default function RegisterScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({ email: '', username: '', display_name: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.email || !form.username || !form.display_name || !form.password) {
      Alert.alert('Error', 'Please fill all fields'); return;
    }
    if (form.password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      await dispatch(loginUser({ email: form.email, password: form.password }));
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.title}>Create Account</Text>
        {['display_name', 'email', 'username', 'password'].map((key) => (
          <TextInput
            key={key}
            style={styles.input}
            placeholder={key === 'display_name' ? 'Display Name' : key.charAt(0).toUpperCase() + key.slice(1)}
            placeholderTextColor="#535353"
            value={(form as any)[key]}
            onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
            autoCapitalize="none"
            secureTextEntry={key === 'password'}
            keyboardType={key === 'email' ? 'email-address' : 'default'}
          />
        ))}
        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Creating...' : 'Sign Up Free'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 16 }}>
          <Text style={styles.link}>Already have an account? <Text style={{ color: '#1db954' }}>Log in</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#282828', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, backgroundColor: '#1e1e1e', marginBottom: 12 },
  btn: { backgroundColor: '#1db954', borderRadius: 30, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#b3b3b3', textAlign: 'center' },
});
