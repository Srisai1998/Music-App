'use client';
import { useQuery } from '@tanstack/react-query';
import { songsAPI, favoritesAPI, playlistsAPI } from '../../../services/api';
import { useAppDispatch, useAppSelector } from '../../../hooks/useRedux';
import { playSong, updateSongFavorite } from '../../../store/slices/playerSlice';
import { Play, Heart, Plus, Music2, Disc3, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { use, useState } from 'react';
import toast from 'react-hot-toast';

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function SongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { currentSong } = useAppSelector((s) => s.player);
  const [isFav, setIsFav] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  const { data: song, isLoading } = useQuery({
    queryKey: ['song', id],
    queryFn: () => songsAPI.get(id).then((r) => {
      setIsFav(r.data.data?.is_favorited || false);
      return r.data.data;
    }),
  });

  const { data: playlists } = useQuery({
    queryKey: ['myPlaylists'],
    queryFn: () => playlistsAPI.my().then((r) => r.data.data),
    enabled: isAuthenticated && showAddToPlaylist,
  });

  const handlePlay = () => {
    if (song) dispatch(playSong({ song, queue: [song] }));
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) { toast.error('Login to like songs'); return; }
    try {
      const { data } = await favoritesAPI.toggle(id);
      setIsFav(data.data?.liked);
      if (song) dispatch(updateSongFavorite({ songId: id, is_favorited: data.data?.liked }));
      toast.success(data.data?.liked ? 'Added to Liked Songs' : 'Removed from Liked Songs');
    } catch {
      toast.error('Failed to update favorites');
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      await playlistsAPI.addSong(playlistId, id);
      toast.success('Added to playlist');
      setShowAddToPlaylist(false);
    } catch {
      toast.error('Already in playlist or error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!song) return <div className="p-6 text-muted-foreground">Song not found.</div>;

  const isCurrentlyPlaying = currentSong?.id === song.id;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Card */}
      <div className="flex flex-col sm:flex-row gap-8 mb-8">
        {/* Cover */}
        <div className="relative h-52 w-52 mx-auto sm:mx-0 flex-shrink-0 rounded-md overflow-hidden shadow-2xl bg-secondary">
          {song.cover_url ? (
            <Image src={song.cover_url} alt={song.title} fill className="object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-purple-600 to-blue-900 flex items-center justify-center">
              <Music2 className="h-20 w-20 text-white/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-end min-w-0">
          <p className="text-muted-foreground text-sm uppercase font-medium mb-1">Song</p>
          <h1 className={`text-3xl font-bold mb-2 leading-tight ${isCurrentlyPlaying ? 'text-primary' : 'text-white'}`}>
            {song.title}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            {song.artist_name && (
              <Link href={`/artists/${song.artist_id}`} className="text-white hover:underline font-medium">
                {song.artist_name}
              </Link>
            )}
            {song.album_title && (
              <>
                <span>•</span>
                <Link href={`/albums/${song.album_id}`} className="hover:text-white hover:underline">
                  {song.album_title}
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Clock className="h-3 w-3" />
            <span>{formatTime(song.duration_seconds)}</span>
            {song.genre_name && <><span>•</span><span>{song.genre_name}</span></>}
            {song.play_count != null && <><span>•</span><span>{song.play_count.toLocaleString()} plays</span></>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlay}
              className="h-12 w-12 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
              <Play className="h-5 w-5 text-black fill-black ml-0.5" />
            </button>
            <button onClick={handleFavorite}>
              <Heart className={`h-6 w-6 transition-colors ${isFav ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-white'}`} />
            </button>
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setShowAddToPlaylist(!showAddToPlaylist)}
                  className="text-muted-foreground hover:text-white transition-colors"
                >
                  <Plus className="h-6 w-6" />
                </button>
                {showAddToPlaylist && playlists && playlists.length > 0 && (
                  <div className="absolute left-0 top-8 z-50 bg-[#282828] rounded-md shadow-xl py-1 min-w-48 border border-secondary">
                    <p className="text-muted-foreground text-xs px-3 py-1">Add to playlist</p>
                    {playlists.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => handleAddToPlaylist(p.id)}
                        className="w-full text-left px-3 py-2 text-white text-sm hover:bg-secondary/60 transition-colors"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-4">
        {song.lyrics && (
          <section>
            <h2 className="text-white font-bold text-lg mb-3">Lyrics</h2>
            <div className="bg-secondary/30 rounded-xl p-6">
              <pre className="text-muted-foreground text-sm whitespace-pre-wrap font-sans leading-relaxed">{song.lyrics}</pre>
            </div>
          </section>
        )}

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {song.language && (
            <span className="px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs">{song.language}</span>
          )}
          {song.audio_quality && (
            <span className="px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs uppercase">{song.audio_quality}</span>
          )}
          {song.is_premium && (
            <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">Premium</span>
          )}
          {song.is_downloadable && (
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">Downloadable</span>
          )}
        </div>
      </div>
    </div>
  );
}
