'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { playlistsAPI } from '../../services/api';
import MediaCard from '../../components/ui/MediaCard';

const LIMIT = 30;

export default function PlaylistsPage() {
  const [page, setPage] = useState(1);
  const [playlists, setPlaylists] = useState<any[]>([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['allPlaylists', page],
    queryFn: () => playlistsAPI.list({ page, limit: LIMIT }).then((r) => r.data),
  });

  useEffect(() => {
    if (!data) return;
    setPlaylists((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
  }, [data, page]);

  const hasNext = data?.pagination?.hasNext;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Featured Playlists</h1>

      {isLoading && playlists.length === 0 && (
        <div className="text-muted-foreground">Loading playlists...</div>
      )}

      {!isLoading && playlists.length === 0 && (
        <div className="text-muted-foreground">No playlists found.</div>
      )}

      <div className="flex flex-wrap gap-6">
        {playlists.map((playlist) => (
          <MediaCard
            key={playlist.id}
            title={playlist.name}
            subtitle={playlist.owner_name ? `By ${playlist.owner_name}` : 'Playlist'}
            imageUrl={playlist.cover_url}
            href={`/playlists/${playlist.id}`}
          />
        ))}
      </div>

      {hasNext && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching}
            className="px-6 py-2 rounded-full bg-secondary text-white text-sm font-medium hover:bg-secondary/70 transition-colors disabled:opacity-50"
          >
            {isFetching ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
