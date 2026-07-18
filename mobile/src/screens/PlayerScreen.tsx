import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Dimensions,
  StatusBar
} from 'react-native';
import TrackPlayer, { useProgress } from 'react-native-track-player';
import Slider from '@react-native-community/slider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
  pauseSong, resumeSong, nextSong, prevSong, toggleShuffle, cycleRepeat,
} from '../store/slices/playerSlice';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { updateFavorite } from '../store/slices/playerSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function PlayerScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { currentSong, isPlaying, isShuffle, repeatMode } = useAppSelector((s) => s.player);
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const progress = useProgress();

  const handleSeek = async (val: number) => {
    await TrackPlayer.seekTo(val);
  };

  const handleFavorite = async () => {
    if (!currentSong || !isAuthenticated) return;
    try {
      const { data } = await api.post(`/favorites/${currentSong.id}`);
      dispatch(updateFavorite({ songId: currentSong.id, isFav: data.data?.liked }));
    } catch {}
  };

  if (!currentSong) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1e3264', '#121212', '#121212']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-down" size={28} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerLabel}>Now Playing</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Album Art */}
      <View style={styles.artContainer}>
        {currentSong.cover_url ? (
          <Image source={{ uri: currentSong.cover_url }} style={styles.art} resizeMode="cover" />
        ) : (
          <View style={[styles.art, styles.artPlaceholder]}>
            <Ionicons name="musical-notes" size={80} color="#535353" />
          </View>
        )}
      </View>

      {/* Song Info & Like */}
      <View style={styles.infoRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.songTitle} numberOfLines={1}>{currentSong.title}</Text>
          <Text style={styles.artistName} numberOfLines={1}>{currentSong.artist_name}</Text>
        </View>
        <TouchableOpacity onPress={handleFavorite}>
          <Ionicons
            name={currentSong.is_favorited ? 'heart' : 'heart-outline'}
            size={26}
            color={currentSong.is_favorited ? '#1db954' : '#b3b3b3'}
          />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={progress.duration || 1}
          value={progress.position}
          minimumTrackTintColor="#1db954"
          maximumTrackTintColor="#535353"
          thumbTintColor="#fff"
          onSlidingComplete={handleSeek}
        />
        <View style={styles.timesRow}>
          <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
          <Text style={styles.timeText}>{formatTime(progress.duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => dispatch(toggleShuffle())}>
          <Ionicons name="shuffle" size={26} color={isShuffle ? '#1db954' : '#b3b3b3'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => dispatch(prevSong())}>
          <Ionicons name="play-skip-back" size={36} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.playBtn}
          onPress={() => isPlaying ? dispatch(pauseSong()) : dispatch(resumeSong())}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={40} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => dispatch(nextSong())}>
          <Ionicons name="play-skip-forward" size={36} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => dispatch(cycleRepeat())}>
          <Ionicons
            name={repeatMode === 'one' ? 'repeat-outline' : 'repeat'}
            size={26}
            color={repeatMode !== 'none' ? '#1db954' : '#b3b3b3'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, marginBottom: 20 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerLabel: { color: '#b3b3b3', fontSize: 12, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  artContainer: { alignItems: 'center', marginBottom: 32 },
  art: { width: SCREEN_WIDTH - 80, height: SCREEN_WIDTH - 80, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.5, shadowOffset: { width: 0, height: 10 }, shadowRadius: 20 },
  artPlaceholder: { backgroundColor: '#282828', alignItems: 'center', justifyContent: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  songTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  artistName: { color: '#b3b3b3', fontSize: 16, marginTop: 4 },
  progressSection: { marginBottom: 8 },
  timesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 },
  timeText: { color: '#b3b3b3', fontSize: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  playBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
