import { useEffect } from 'react';
import TrackPlayer, { Capability, Event, useTrackPlayerEvents } from 'react-native-track-player';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { nextSong, prevSong, setPosition, setDuration, setLoading, pauseSong, resumeSong } from '../store/slices/playerSlice';

export const setupPlayer = async () => {
  await TrackPlayer.setupPlayer({
    maxCacheSize: 1024 * 100, // 100 MB
  });
  await TrackPlayer.updateOptions({
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.Stop,
      Capability.SeekTo,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
    notificationCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext, Capability.SkipToPrevious],
  });
};

export const useTrackPlayerSync = () => {
  const dispatch = useAppDispatch();
  const { currentSong, isPlaying } = useAppSelector((s) => s.player);

  // Sync playback state from store → TrackPlayer
  useEffect(() => {
    const sync = async () => {
      if (!currentSong) return;
      dispatch(setLoading(true));
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: currentSong.id,
        url: currentSong.audio_url,
        title: currentSong.title,
        artist: currentSong.artist_name || 'Unknown',
        artwork: currentSong.cover_url || undefined,
        duration: currentSong.duration_seconds,
      });
      await TrackPlayer.play();
      dispatch(setLoading(false));
    };
    sync();
  }, [currentSong?.id]);

  useEffect(() => {
    if (!currentSong) return;
    if (isPlaying) {
      TrackPlayer.play();
    } else {
      TrackPlayer.pause();
    }
  }, [isPlaying]);

  // Events from TrackPlayer → store
  useTrackPlayerEvents([Event.PlaybackTrackChanged, Event.PlaybackState, Event.PlaybackProgressUpdated], (event) => {
    if (event.type === Event.PlaybackTrackChanged && event.nextTrack !== undefined) {
      dispatch(nextSong());
    }
    if (event.type === Event.PlaybackProgressUpdated) {
      dispatch(setPosition(event.position));
      dispatch(setDuration(event.duration));
    }
  });
};
