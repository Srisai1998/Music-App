'use client';
import { useQuery } from '@tanstack/react-query';
import { albumsAPI } from '../../../services/api';
import { useAppDispatch } from '../../../hooks/useRedux';
import { playSong } from '../../../store/slices/playerSlice';
import SongCard from '../../../components/ui/SongCard';
import { Play, Disc3 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { use } from 'react';

const formatDuration = (totalSecs: number) => {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h > 0) return `${h} hr ${m} min`;
  return `${m} min`;
};

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const dispatch = useAppDispatch();

  const { data: album, isLoading } = useQuery({
    queryKey: ['album', id],
    queryFn: () => albumsAPI.get(id).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!album) {
    return <div className="p-6 text-muted-foreground">Album not found.</div>;
  }

  const songs: any[] = album.songs || [];
  const totalDuration = songs.reduce((acc: number, s: any) => acc + (s.duration_seconds || 0), 0);

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-b from-indigo-900 to-background p-8">
        <div className="flex items-end gap-6">
          <div className="relative h-52 w-52 rounded-md overflow-hidden shadow-2xl flex-shrink-0 bg-secondary">
            {album.cover_url ? (
              <Image src={album.cover_url} alt={album.title} fill className="object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-indigo-600 to-purple-900 flex items-center justify-center">
                <Disc3 className="h-20 w-20 text-white/50" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm uppercase font-bold mb-1">{album.album_type || 'Album'}</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">{album.title}</h1>
            <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
              {album.artist_name && (
                <Link href={`/artists/${album.artist_id}`} className="text-white font-medium hover:underline">
                  {album.artist_name}
                </Link>
              )}
              {album.release_date && (
                <>
                  <span>•</span>
                  <span>{new Date(album.release_date).getFullYear()}</span>
                </>
              )}
              {songs.length > 0 && (
                <>
                  <span>•</span>
                  <span>{songs.length} songs,</span>
                  <span>{formatDuration(totalDuration)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-8 py-4 flex items-center gap-4">
        {songs.length > 0 && (
          <button
            onClick={() => dispatch(playSong({ song: songs[0], queue: songs }))}
            className="h-14 w-14 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
          >
            <Play className="h-6 w-6 text-black fill-black ml-1" />
          </button>
        )}
      </div>

      {/* Song list */}
      <div className="px-6 pb-8">
        {songs.length === 0 && (
          <p className="text-muted-foreground text-center py-12">No songs in this album yet.</p>
        )}
        <div className="space-y-1">
          {songs.map((song: any, i: number) => (
            <SongCard key={song.id} song={song} queue={songs} showIndex={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
