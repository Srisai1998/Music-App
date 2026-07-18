import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Song {
  id: string;
  title: string;
  audio_url: string;
  cover_url?: string;
  duration_seconds: number;
  artist_name?: string;
  artist_id?: string;
  album_title?: string;
  is_favorited?: boolean;
}

export type RepeatMode = 'none' | 'one' | 'all';

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  volume: number;
  position: number;
  duration: number;
  isLoading: boolean;
}

const initialState: PlayerState = {
  currentSong: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  isShuffle: false,
  repeatMode: 'none',
  volume: 1,
  position: 0,
  duration: 0,
  isLoading: false,
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    playSong: (state, action: PayloadAction<{ song: Song; queue?: Song[] }>) => {
      const { song, queue } = action.payload;
      const q = queue || [song];
      state.queue = state.isShuffle ? [...q].sort(() => Math.random() - 0.5) : q;
      state.currentIndex = state.queue.findIndex((s) => s.id === song.id);
      state.currentSong = song;
      state.isPlaying = true;
      state.isLoading = true;
      state.position = 0;
    },
    pauseSong: (state) => { state.isPlaying = false; },
    resumeSong: (state) => { state.isPlaying = true; },
    nextSong: (state) => {
      if (state.repeatMode === 'one') { state.position = 0; return; }
      const next = state.currentIndex + 1;
      if (next < state.queue.length) {
        state.currentIndex = next;
        state.currentSong = state.queue[next];
        state.position = 0;
        state.isLoading = true;
      } else if (state.repeatMode === 'all' && state.queue.length > 0) {
        state.currentIndex = 0;
        state.currentSong = state.queue[0];
        state.position = 0;
        state.isLoading = true;
      } else {
        state.isPlaying = false;
      }
    },
    prevSong: (state) => {
      if (state.position > 3) { state.position = 0; return; }
      const prev = state.currentIndex - 1;
      if (prev >= 0) {
        state.currentIndex = prev;
        state.currentSong = state.queue[prev];
        state.position = 0;
        state.isLoading = true;
      }
    },
    setPosition: (state, action: PayloadAction<number>) => { state.position = action.payload; },
    setDuration: (state, action: PayloadAction<number>) => { state.duration = action.payload; },
    setLoading: (state, action: PayloadAction<boolean>) => { state.isLoading = action.payload; },
    setVolume: (state, action: PayloadAction<number>) => { state.volume = action.payload; },
    toggleShuffle: (state) => { state.isShuffle = !state.isShuffle; },
    cycleRepeat: (state) => {
      const modes: RepeatMode[] = ['none', 'all', 'one'];
      const idx = modes.indexOf(state.repeatMode);
      state.repeatMode = modes[(idx + 1) % modes.length];
    },
    addToQueue: (state, action: PayloadAction<Song>) => {
      if (!state.queue.find((s) => s.id === action.payload.id)) state.queue.push(action.payload);
    },
    clearQueue: (state) => { state.queue = []; state.currentIndex = -1; },
    updateFavorite: (state, action: PayloadAction<{ songId: string; isFav: boolean }>) => {
      if (state.currentSong?.id === action.payload.songId) state.currentSong.is_favorited = action.payload.isFav;
    },
  },
});

export const {
  playSong, pauseSong, resumeSong, nextSong, prevSong, setPosition,
  setDuration, setLoading, setVolume, toggleShuffle, cycleRepeat,
  addToQueue, clearQueue, updateFavorite,
} = playerSlice.actions;
export default playerSlice.reducer;
