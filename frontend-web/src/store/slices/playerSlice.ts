import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Song {
  id: string;
  title: string;
  audio_url: string;
  audio_url_hq?: string;
  cover_url?: string;
  duration_seconds: number;
  artist_name?: string;
  artist_id?: string;
  album_title?: string;
  album_id?: string;
  is_premium?: boolean;
  is_favorited?: boolean;
}

export type RepeatMode = 'none' | 'one' | 'all';

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  originalQueue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  volume: number;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  isMuted: boolean;
}

const initialState: PlayerState = {
  currentSong: null,
  queue: [],
  originalQueue: [],
  currentIndex: -1,
  isPlaying: false,
  isShuffle: false,
  repeatMode: 'none',
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  isLoading: false,
  isMuted: false,
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    playSong: (state, action: PayloadAction<{ song: Song; queue?: Song[] }>) => {
      const { song, queue } = action.payload;
      const newQueue = queue || (state.queue.length > 0 ? state.queue : [song]);
      const idx = newQueue.findIndex((s) => s.id === song.id);
      state.currentSong = song;
      state.queue = state.isShuffle ? [...newQueue].sort(() => Math.random() - 0.5) : newQueue;
      state.originalQueue = newQueue;
      state.currentIndex = state.isShuffle ? state.queue.findIndex((s) => s.id === song.id) : (idx !== -1 ? idx : 0);
      state.isPlaying = true;
      state.currentTime = 0;
      state.isLoading = true;
    },
    pauseSong: (state) => { state.isPlaying = false; },
    resumeSong: (state) => { state.isPlaying = true; },
    nextSong: (state) => {
      if (state.repeatMode === 'one') {
        state.currentTime = 0;
        state.isPlaying = true;
        return;
      }
      const next = state.currentIndex + 1;
      if (next < state.queue.length) {
        state.currentIndex = next;
        state.currentSong = state.queue[next];
        state.currentTime = 0;
        state.isPlaying = true;
        state.isLoading = true;
      } else if (state.repeatMode === 'all') {
        state.currentIndex = 0;
        state.currentSong = state.queue[0];
        state.currentTime = 0;
        state.isPlaying = true;
        state.isLoading = true;
      } else {
        state.isPlaying = false;
      }
    },
    prevSong: (state) => {
      if (state.currentTime > 3) {
        state.currentTime = 0;
        return;
      }
      const prev = state.currentIndex - 1;
      if (prev >= 0) {
        state.currentIndex = prev;
        state.currentSong = state.queue[prev];
        state.currentTime = 0;
        state.isPlaying = true;
        state.isLoading = true;
      }
    },
    setCurrentTime: (state, action: PayloadAction<number>) => { state.currentTime = action.payload; },
    setDuration: (state, action: PayloadAction<number>) => { state.duration = action.payload; },
    setVolume: (state, action: PayloadAction<number>) => { state.volume = action.payload; state.isMuted = action.payload === 0; },
    toggleMute: (state) => { state.isMuted = !state.isMuted; },
    setLoading: (state, action: PayloadAction<boolean>) => { state.isLoading = action.payload; },
    toggleShuffle: (state) => {
      state.isShuffle = !state.isShuffle;
      if (state.isShuffle) {
        const currentSong = state.queue[state.currentIndex];
        const shuffled = [...state.queue].sort(() => Math.random() - 0.5);
        state.queue = shuffled;
        state.currentIndex = shuffled.findIndex((s) => s.id === currentSong?.id) || 0;
      } else {
        const currentSong = state.queue[state.currentIndex];
        state.queue = [...state.originalQueue];
        state.currentIndex = state.queue.findIndex((s) => s.id === currentSong?.id) || 0;
      }
    },
    setRepeatMode: (state, action: PayloadAction<RepeatMode>) => { state.repeatMode = action.payload; },
    cycleRepeat: (state) => {
      const modes: RepeatMode[] = ['none', 'all', 'one'];
      const idx = modes.indexOf(state.repeatMode);
      state.repeatMode = modes[(idx + 1) % modes.length];
    },
    addToQueue: (state, action: PayloadAction<Song>) => {
      const exists = state.queue.find((s) => s.id === action.payload.id);
      if (!exists) {
        state.queue.push(action.payload);
        state.originalQueue.push(action.payload);
      }
    },
    removeFromQueue: (state, action: PayloadAction<string>) => {
      const idx = state.queue.findIndex((s) => s.id === action.payload);
      if (idx !== -1) {
        state.queue.splice(idx, 1);
        if (idx < state.currentIndex) state.currentIndex--;
        else if (idx === state.currentIndex) {
          if (state.queue.length === 0) { state.currentSong = null; state.isPlaying = false; }
          else { state.currentSong = state.queue[Math.min(state.currentIndex, state.queue.length - 1)]; }
        }
      }
    },
    clearQueue: (state) => {
      state.queue = [];
      state.originalQueue = [];
      state.currentIndex = -1;
    },
    updateSongFavorite: (state, action: PayloadAction<{ songId: string; is_favorited: boolean }>) => {
      if (state.currentSong?.id === action.payload.songId) {
        state.currentSong.is_favorited = action.payload.is_favorited;
      }
      state.queue = state.queue.map((s) =>
        s.id === action.payload.songId ? { ...s, is_favorited: action.payload.is_favorited } : s
      );
    },
  },
});

export const {
  playSong, pauseSong, resumeSong, nextSong, prevSong,
  setCurrentTime, setDuration, setVolume, toggleMute, setLoading,
  toggleShuffle, setRepeatMode, cycleRepeat, addToQueue,
  removeFromQueue, clearQueue, updateSongFavorite,
} = playerSlice.actions;

export default playerSlice.reducer;
