'use client';
import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { useAppDispatch, useAppSelector } from './useRedux';
import {
  nextSong, setCurrentTime, setDuration, setLoading,
} from '../store/slices/playerSlice';
import { historyAPI } from '../services/api';

// Module-level Howl instance — shared across all hook usages
let howl: Howl | null = null;

export const useAudioPlayer = () => {
  const dispatch = useAppDispatch();
  const { currentSong, isPlaying, volume, isMuted } = useAppSelector((s) => s.player);

  // Keep a ref to the latest state values so Howler callbacks never capture stale closures
  const repeatModeRef = useRef<string>('none');
  const animFrameRef = useRef<number>(0);

  const repeatMode = useAppSelector((s) => s.player.repeatMode);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);

  // RAf-based progress ticker
  const updateTime = useCallback(() => {
    if (howl && howl.playing()) {
      dispatch(setCurrentTime(howl.seek() as number));
      animFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [dispatch]);

  // ── Load + play when currentSong changes ──────────────────────────────────
  useEffect(() => {
    if (!currentSong) return;

    if (howl) {
      howl.stop();
      howl.unload();
      cancelAnimationFrame(animFrameRef.current);
    }

    // Always stream via our backend proxy → eliminates CORS issues on any audio source
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const audioUrl = `${API_URL}/stream/${currentSong.id}`;
    const songId = currentSong.id;
    dispatch(setLoading(true));

    howl = new Howl({
      src: [audioUrl],
      html5: true,
      volume: isMuted ? 0 : volume,
      onload: () => {
        dispatch(setDuration(howl!.duration()));
        dispatch(setLoading(false));
      },
      onplay: () => {
        animFrameRef.current = requestAnimationFrame(updateTime);
        // Record play in history (fire-and-forget, non-fatal)
        historyAPI.record(songId).catch(() => {});
      },
      onpause: () => {
        cancelAnimationFrame(animFrameRef.current);
      },
      onstop: () => {
        cancelAnimationFrame(animFrameRef.current);
      },
      onend: () => {
        cancelAnimationFrame(animFrameRef.current);
        // Use the ref so we always read current repeatMode, not stale closure
        if (repeatModeRef.current === 'one') {
          // Replay from the start
          howl?.seek(0);
          howl?.play();
          dispatch(setCurrentTime(0));
        } else {
          dispatch(nextSong());
        }
      },
      onloaderror: (_id, err) => {
        console.error('Howl load error:', err);
        dispatch(setLoading(false));
      },
    });

    if (isPlaying) howl.play();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
    // Only re-create Howl when the actual song changes (id is sufficient)
  }, [currentSong?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Play / Pause ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!howl) return;
    if (isPlaying) {
      if (!howl.playing()) howl.play();
    } else {
      howl.pause();
    }
  }, [isPlaying]);

  // ── Volume / Mute ─────────────────────────────────────────────────────────
  useEffect(() => {
    howl?.volume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  // ── Seek (called from MusicPlayer seek bar) ───────────────────────────────
  const seek = useCallback((time: number) => {
    if (howl) {
      howl.seek(time);
      dispatch(setCurrentTime(time));
    }
  }, [dispatch]);

  return { seek };
};
