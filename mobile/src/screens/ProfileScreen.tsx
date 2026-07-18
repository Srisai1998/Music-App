import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { logoutUser } from '../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Log in to your account</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnText}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.btnText, { color: '#fff' }]}>Sign Up Free</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = [
    { icon: 'musical-notes-outline', label: 'Liked Songs', onPress: () => {} },
    { icon: 'time-outline', label: 'Recently Played', onPress: () => {} },
    { icon: 'download-outline', label: 'Downloads', onPress: () => {} },
    { icon: 'settings-outline', label: 'Settings', onPress: () => {} },
    { icon: 'star-outline', label: 'Upgrade to Premium', onPress: () => {}, accent: true },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.display_name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.display_name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.subscription_type !== 'free' && (
          <Text style={styles.premium}>✨ Premium</Text>
        )}
      </View>

      <View style={styles.menu}>
        {items.map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress}>
            <Ionicons name={item.icon as any} size={22} color={item.accent ? '#1db954' : '#b3b3b3'} />
            <Text style={[styles.menuLabel, item.accent && { color: '#1db954' }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#535353" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.menuItem, { marginTop: 24 }]}
          onPress={() => dispatch(logoutUser())}
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={[styles.menuLabel, { color: '#ef4444' }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1db954', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#000', fontSize: 32, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  email: { color: '#b3b3b3', fontSize: 14, marginTop: 4 },
  premium: { color: '#1db954', fontSize: 14, fontWeight: '600', marginTop: 8 },
  menu: { paddingHorizontal: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#282828' },
  menuLabel: { flex: 1, color: '#fff', fontSize: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  btn: { width: '100%', backgroundColor: '#1db954', borderRadius: 30, paddingVertical: 14, alignItems: 'center' },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#fff' },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});
