'use client';
import { useQuery } from '@tanstack/react-query';
import { artistsAPI } from '../../../services/api';
import { useAppDispatch, useAppSelector } from '../../../hooks/useRedux';
import { playSong } from '../../../store/slices/playerSlice';
import SongCard from '../../../components/ui/SongCard';
import MediaCard from '../../../components/ui/MediaCard';
import { Play, UserCheck, Users } from 'lucide-react';
import Image from 'next/image';
import { use } from 'react';
import toast from 'react-hot-toast';

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => artistsAPI.get(id).then((r) => r.data.data),
  });

  const { data: albums } = useQuery({
    queryKey: ['artistAlbums', id],
    queryFn: () => artistsAPI.albums(id).then((r) => r.data.data),
    enabled: !!artist,
  });

  const handleFollow = async () => {
    if (!isAuthenticated) { toast.error('Login to follow artists'); return; }
    try {
      await artistsAPI.follow(id);
      toast.success('Following!');
    } catch {
      toast.error('Failed to follow');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!artist) {
    return <div className="p-6 text-muted-foreground">Artist not found.</div>;
  }

  const songs: any[] = artist.songs || [];

  return (
    <div>
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {artist.avatar_url ? (
          <Image src={artist.avatar_url} alt={artist.name} fill className="object-cover object-top" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-purple-700 to-blue-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-6 left-6">
          {artist.is_verified && (
            <div className="flex items-center gap-1 mb-2">
              <UserCheck className="h-4 w-4 text-blue-400" />
              <span className="text-blue-400 text-xs font-medium">Verified Artist</span>
            </div>
          )}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">{artist.name}</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            <Users className="h-4 w-4" />
            {artist.monthly_listeners
              ? `${(artist.monthly_listeners / 1_000_000).toFixed(1)}M monthly listeners`
              : 'Artist'}
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-6 py-4 flex items-center gap-4">
        {songs.length > 0 && (
          <button
            onClick={() => dispatch(playSong({ song: songs[0], queue: songs }))}
            className="h-14 w-14 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
          >
            <Play className="h-6 w-6 text-black fill-black ml-1" />
          </button>
        )}
        <button
          onClick={handleFollow}
          className="px-6 py-2 rounded-full border border-muted text-white text-sm font-medium hover:border-white transition-colors"
        >
          Follow
        </button>
      </div>

      <div className="px-6 space-y-10 pb-8">
        {/* Popular Songs */}
        {songs.length > 0 && (
          <section>
            <h2 className="text-white font-bold text-xl mb-4">Popular</h2>
            <div className="space-y-1">
              {songs.slice(0, 10).map((song: any, i: number) => (
                <SongCard key={song.id} song={song} queue={songs} showIndex={i + 1} />
              ))}
            </div>
          </section>
        )}

        {/* Albums */}
        {albums && albums.length > 0 && (
          <section>
            <h2 className="text-white font-bold text-xl mb-4">Albums</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {albums.map((album: any) => (
                <MediaCard
                  key={album.id}
                  title={album.title}
                  subtitle={new Date(album.release_date).getFullYear().toString()}
                  imageUrl={album.cover_url}
                  href={`/albums/${album.id}`}
                />
              ))}
            </div>
          </section>
        )}

        {/* Bio */}
        {artist.bio && (
          <section>
            <h2 className="text-white font-bold text-xl mb-4">About</h2>
            <div className="relative rounded-xl overflow-hidden max-w-2xl">
              {artist.avatar_url && (
                <div className="relative h-48 w-full">
                  <Image src={artist.avatar_url} alt={artist.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
              )}
              <div className="bg-secondary/50 p-6">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{artist.bio}</p>
                {artist.monthly_listeners && (
                  <p className="text-white font-bold mt-4">
                    {artist.monthly_listeners.toLocaleString()} monthly listeners
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
