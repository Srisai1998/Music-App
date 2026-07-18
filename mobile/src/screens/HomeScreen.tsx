import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { playSong } from '../store/slices/playerSlice';
import { Play } from 'lucide-react-native';

const SongListItem = ({ song, queue, index }: any) => {
  const dispatch = useAppDispatch();
  const { currentSong, isPlaying } = useAppSelector((s) => s.player);
  const isCurrent = currentSong?.id === song.id;

  return (
    <TouchableOpacity
      style={[styles.songRow, isCurrent && styles.songRowActive]}
      onPress={() => dispatch(playSong({ song, queue }))}
    >
      {song.cover_url ? (
        <Image source={{ uri: song.cover_url }} style={styles.songCover} />
      ) : (
        <View style={[styles.songCover, styles.songCoverPlaceholder]}>
          <Text style={{ color: '#535353' }}>♪</Text>
        </View>
      )}
      <View style={styles.songInfo}>
        <Text style={[styles.songTitle, isCurrent && { color: '#1db954' }]} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{song.artist_name}</Text>
      </View>
      <Text style={styles.duration}>
        {Math.floor(song.duration_seconds / 60)}:{String(song.duration_seconds % 60).padStart(2, '0')}
      </Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen({ navigation }: any) {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const { data: trending = [] } = useQuery({
    queryKey: ['trending'],
    queryFn: () => api.get('/songs/trending?limit=20').then((r) => r.data.data),
  });

  const { data: artists = [] } = useQuery({
    queryKey: ['featured-artists'],
    queryFn: () => api.get('/artists?featured=true&limit=10').then((r) => r.data.data),
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting()}</Text>
        {isAuthenticated && <Text style={styles.username}>{user?.display_name}</Text>}
      </View>

      {/* Trending Songs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
        {trending.slice(0, 10).map((song: any, i: number) => (
          <SongListItem key={song.id} song={song} queue={trending} index={i + 1} />
        ))}
      </View>

      {/* Featured Artists */}
      {artists.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Artists</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {artists.map((artist: any) => (
              <TouchableOpacity
                key={artist.id}
                style={styles.artistCard}
                onPress={() => navigation.navigate('Artist', { artistId: artist.id })}
              >
                {artist.avatar_url ? (
                  <Image source={{ uri: artist.avatar_url }} style={styles.artistAvatar} />
                ) : (
                  <View style={[styles.artistAvatar, { backgroundColor: '#282828', alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: '#535353', fontSize: 24 }}>🎤</Text>
                  </View>
                )}
                <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 20, paddingTop: 60 },
  greeting: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  username: { color: '#b3b3b3', fontSize: 16, marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  songRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  songRowActive: { backgroundColor: 'rgba(29,185,84,0.1)', borderRadius: 8, paddingHorizontal: 8, marginHorizontal: -8 },
  songCover: { width: 44, height: 44, borderRadius: 4 },
  songCoverPlaceholder: { backgroundColor: '#282828', alignItems: 'center', justifyContent: 'center' },
  songInfo: { flex: 1 },
  songTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  songArtist: { color: '#b3b3b3', fontSize: 12, marginTop: 2 },
  duration: { color: '#b3b3b3', fontSize: 12 },
  artistCard: { alignItems: 'center', marginRight: 16, width: 80 },
  artistAvatar: { width: 80, height: 80, borderRadius: 40 },
  artistName: { color: '#fff', fontSize: 12, marginTop: 6, textAlign: 'center' },
});
