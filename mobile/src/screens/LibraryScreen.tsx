import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppSelector } from '../hooks/useRedux';
import { useNavigation } from '@react-navigation/native';

export default function LibraryScreen() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const navigation = useNavigation<any>();

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Create your first playlist</Text>
        <Text style={styles.sub}>Log in to manage your library</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = [
    { id: '1', name: 'Liked Songs', type: 'playlist', icon: '💚' },
    { id: '2', name: 'Recently Played', type: 'playlist', icon: '🕐' },
    { id: '3', name: 'Downloads', type: 'playlist', icon: '⬇️' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Library</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item}>
            <Text style={styles.icon}>{item.icon}</Text>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.type}>{item.type}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 60 },
  center: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  header: { color: '#fff', fontSize: 24, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#282828' },
  icon: { fontSize: 32, width: 48 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  type: { color: '#b3b3b3', fontSize: 13, marginTop: 2 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  sub: { color: '#b3b3b3', textAlign: 'center' },
  btn: { backgroundColor: '#1db954', borderRadius: 30, paddingVertical: 14, paddingHorizontal: 32 },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});
