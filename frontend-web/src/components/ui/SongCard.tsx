'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Heart, MoreHorizontal, Download } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { playSong } from '../../store/slices/playerSlice';
import { favoritesAPI } from '../../services/api';
import { updateSongFavorite } from '../../store/slices/playerSlice';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { Song } from '../../store/slices/playerSlice';
import { useState } from 'react';

interface SongCardProps {
  song: Song & { artist_name?: string; play_count?: number; duration_seconds: number };
  queue?: Song[];
  showIndex?: number;
  compact?: boolean;
}

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function SongCard({ song, queue, showIndex, compact = false }: SongCardProps) {
  const dispatch = useAppDispatch();
  const { currentSong, isPlaying } = useAppSelector((s) => s.player);
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [isFav, setIsFav] = useState(song.is_favorited || false);
  const isCurrentlyPlaying = currentSong?.id === song.id && isPlaying;

  const handlePlay = () => {
    dispatch(playSong({ song, queue: queue || [song] }));
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Login to like songs'); return; }
    try {
      const { data } = await favoritesAPI.toggle(song.id);
      setIsFav(data.data?.liked);
      dispatch(updateSongFavorite({ songId: song.id, is_favorited: data.data?.liked }));
    } catch {
      toast.error('Failed to update favorites');
    }
  };

  return (
    <div
      className={clsx(
        'group flex items-center gap-4 px-4 py-2 rounded-md hover:bg-secondary/60 transition-colors cursor-pointer',
        isCurrentlyPlaying && 'bg-secondary/40'
      )}
      onClick={handlePlay}
    >
      {showIndex !== undefined && (
        <div className="w-6 text-center flex-shrink-0">
          {isCurrentlyPlaying ? (
            <div className="flex items-end gap-0.5 justify-center h-4">
              <span className="music-bar" />
              <span className="music-bar" />
              <span className="music-bar" />
              <span className="music-bar" />
            </div>
          ) : (
            <span className="text-muted-foreground text-sm group-hover:hidden">{showIndex}</span>
          )}
          <Play className="h-4 w-4 text-white hidden group-hover:block mx-auto" />
        </div>
      )}

      {!compact && (
        <div className="relative h-10 w-10 rounded overflow-hidden flex-shrink-0 bg-secondary">
          {song.cover_url ? (
            <Image src={song.cover_url} alt={song.title} fill className="object-cover" />
          ) : (
            <div className="h-10 w-10 bg-secondary/80 flex items-center justify-center text-muted-foreground text-xs">♪</div>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className={clsx('truncate text-sm font-medium', isCurrentlyPlaying ? 'text-primary' : 'text-white')}>
          {song.title}
        </p>
        {song.artist_name && (
          <Link
            href={`/artists/${song.artist_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground text-xs truncate hover:text-white hover:underline"
          >
            {song.artist_name}
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleFavorite}>
          <Heart className={clsx('h-4 w-4 transition-colors', isFav ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-white')} />
        </button>
      </div>

      <span className="text-muted-foreground text-xs w-10 text-right flex-shrink-0">
        {formatTime(song.duration_seconds)}
      </span>
    </div>
  );
}
