import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { pauseSong, resumeSong, nextSong } from '../store/slices/playerSlice';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function MiniPlayer() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { currentSong, isPlaying } = useAppSelector((s) => s.player);

  if (!currentSong) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Player')}
      activeOpacity={0.9}
    >
      {currentSong.cover_url ? (
        <Image source={{ uri: currentSong.cover_url }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, { backgroundColor: '#282828', alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="musical-notes" size={18} color="#535353" />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentSong.artist_name}</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={(e) => { e.stopPropagation(); isPlaying ? dispatch(pauseSong()) : dispatch(resumeSong()); }}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={(e) => { e.stopPropagation(); dispatch(nextSong()); }}>
        <Ionicons name="play-skip-forward" size={24} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 8,
    right: 8,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#282828',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 10,
  },
  cover: { width: 44, height: 44, borderRadius: 4 },
  info: { flex: 1 },
  title: { color: '#fff', fontSize: 14, fontWeight: '600' },
  artist: { color: '#b3b3b3', fontSize: 12 },
  btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
