'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { artistsAPI } from '../../services/api';
import MediaCard from '../../components/ui/MediaCard';

const LIMIT = 30;

export default function ArtistsPage() {
  const [page, setPage] = useState(1);
  const [artists, setArtists] = useState<any[]>([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['allArtists', page],
    queryFn: () => artistsAPI.list({ page, limit: LIMIT }).then((r) => r.data),
  });

  useEffect(() => {
    if (!data) return;
    setArtists((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
  }, [data, page]);

  const hasNext = data?.pagination?.hasNext;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">All Artists</h1>

      {isLoading && artists.length === 0 && (
        <div className="text-muted-foreground">Loading artists...</div>
      )}

      {!isLoading && artists.length === 0 && (
        <div className="text-muted-foreground">No artists found.</div>
      )}

      <div className="flex flex-wrap gap-6">
        {artists.map((artist) => (
          <MediaCard
            key={artist.id}
            title={artist.name}
            subtitle="Artist"
            imageUrl={artist.avatar_url}
            href={`/artists/${artist.id}`}
            rounded
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
