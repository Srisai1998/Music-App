'use client';
import React, { useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Heart, ListMusic, Maximize2
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import {
  pauseSong, resumeSong, nextSong, prevSong,
  setVolume, toggleMute, toggleShuffle, cycleRepeat,
  setCurrentTime,
} from '../../store/slices/playerSlice';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { favoritesAPI } from '../../services/api';
import { updateSongFavorite } from '../../store/slices/playerSlice';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function MusicPlayer() {
  const dispatch = useAppDispatch();
  const { seek } = useAudioPlayer();
  const {
    currentSong, isPlaying, isShuffle, repeatMode,
    volume, isMuted, currentTime, duration, isLoading,
  } = useAppSelector((s) => s.player);
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  }, [seek]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setVolume(parseFloat(e.target.value)));
  };

  const handleFavorite = async () => {
    if (!currentSong || !isAuthenticated) return;
    try {
      const { data } = await favoritesAPI.toggle(currentSong.id);
      dispatch(updateSongFavorite({ songId: currentSong.id, is_favorited: data.data?.liked }));
      toast.success(data.data?.liked ? 'Added to Liked Songs' : 'Removed from Liked Songs');
    } catch {
      toast.error('Failed to update favorites');
    }
  };

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#181818] border-t border-secondary flex items-center px-4 gap-4 z-50">
      {/* Song Info */}
      <div className="flex items-center gap-3 w-72 min-w-0">
        <div className="relative h-14 w-14 rounded overflow-hidden flex-shrink-0 bg-secondary">
          {currentSong.cover_url ? (
            <Image src={currentSong.cover_url} alt={currentSong.title} fill className="object-cover" />
          ) : (
            <div className="h-14 w-14 bg-secondary flex items-center justify-center">
              <ListMusic className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <Link href={`/songs/${currentSong.id}`} className="text-white text-sm font-medium truncate block hover:underline">
            {currentSong.title}
          </Link>
          <Link href={`/artists/${currentSong.artist_id}`} className="text-muted-foreground text-xs truncate block hover:text-white hover:underline">
            {currentSong.artist_name}
          </Link>
        </div>
        {isAuthenticated && (
          <button onClick={handleFavorite} className="ml-2 flex-shrink-0">
            <Heart
              className={clsx('h-4 w-4 transition-colors', currentSong.is_favorited ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-white')}
            />
          </button>
        )}
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center flex-1 max-w-xl mx-auto">
        <div className="flex items-center gap-5 mb-2">
          <button onClick={() => dispatch(toggleShuffle())} className={clsx('transition-colors', isShuffle ? 'text-primary' : 'text-muted-foreground hover:text-white')}>
            <Shuffle className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              dispatch(prevSong());
              // If repeat-to-start (currentTime>3), also physically seek Howler to 0
              if (currentTime > 3) seek(0);
            }}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            onClick={() => isPlaying ? dispatch(pauseSong()) : dispatch(resumeSong())}
            disabled={isLoading}
            className="h-8 w-8 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 text-black fill-black" />
            ) : (
              <Play className="h-4 w-4 text-black fill-black ml-0.5" />
            )}
          </button>
          <button onClick={() => dispatch(nextSong())} className="text-muted-foreground hover:text-white transition-colors">
            <SkipForward className="h-5 w-5" />
          </button>
          <button onClick={() => dispatch(cycleRepeat())} className={clsx('transition-colors', repeatMode !== 'none' ? 'text-primary' : 'text-muted-foreground hover:text-white')}>
            {repeatMode === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
          </button>
        </div>

        {/* Seek bar */}
        <div className="flex items-center gap-2 w-full">
          <span className="text-muted-foreground text-xs w-8 text-right">{formatTime(currentTime)}</span>
          <div className="flex-1 relative group">
            <input
              type="range"
              min={0}
              max={duration || 1}
              value={currentTime}
              step={0.1}
              onChange={handleSeek}
              className="w-full h-1 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100"
              style={{
                background: `linear-gradient(to right, #1db954 ${progress}%, #535353 ${progress}%)`,
              }}
            />
          </div>
          <span className="text-muted-foreground text-xs w-8">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume Controls */}
      <div className="flex items-center gap-2 w-44 justify-end">
        <button onClick={() => dispatch(toggleMute())} className="text-muted-foreground hover:text-white transition-colors">
          {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-24 h-1 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          style={{
            background: `linear-gradient(to right, #1db954 ${(isMuted ? 0 : volume) * 100}%, #535353 ${(isMuted ? 0 : volume) * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}
