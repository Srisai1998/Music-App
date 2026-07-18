import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import { useAppDispatch } from '../hooks/useRedux';
import { playSong } from '../store/slices/playerSlice';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const search = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/songs/search?q=${encodeURIComponent(q)}`);
      setResults(data.data);
    } catch {} finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Search</Text>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#535353" />
        <TextInput
          style={styles.input}
          placeholder="Songs, artists, albums..."
          placeholderTextColor="#535353"
          value={query}
          onChangeText={search}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults(null); }}>
            <Ionicons name="close" size={18} color="#535353" />
          </TouchableOpacity>
        )}
      </View>

      {results?.songs?.length > 0 && (
        <FlatList
          data={results.songs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => dispatch(playSong({ song: item, queue: results.songs }))}>
              {item.cover_url ? (
                <Image source={{ uri: item.cover_url }} style={styles.cover} />
              ) : (
                <View style={[styles.cover, { backgroundColor: '#282828', alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="musical-notes" size={18} color="#535353" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.artist} numberOfLines={1}>{item.artist_name}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {loading && <Text style={styles.hint}>Searching...</Text>}
      {!loading && !results && (
        <Text style={styles.hint}>Search for songs, artists, or albums</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 60 },
  header: { color: '#fff', fontSize: 24, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 8, paddingHorizontal: 12, gap: 8, marginBottom: 16 },
  input: { flex: 1, color: '#000', paddingVertical: 12, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  cover: { width: 44, height: 44, borderRadius: 4 },
  title: { color: '#fff', fontSize: 14, fontWeight: '600' },
  artist: { color: '#b3b3b3', fontSize: 12, marginTop: 2 },
  hint: { color: '#535353', textAlign: 'center', paddingTop: 40, fontSize: 15 },
});
