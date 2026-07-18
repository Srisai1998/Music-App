'use client';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { songsAPI } from '../../services/api';
import SongCard from '../../components/ui/SongCard';
import MediaCard from '../../components/ui/MediaCard';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

const GENRES = [
  { name: 'Pop', color: '#e8115b', cover: null },
  { name: 'Hip-Hop', color: '#ba5d07', cover: null },
  { name: 'Rock', color: '#e91429', cover: null },
  { name: 'Electronic', color: '#0d73ec', cover: null },
  { name: 'R&B', color: '#8400e7', cover: null },
  { name: 'Jazz', color: '#1e3264', cover: null },
  { name: 'Classical', color: '#1db954', cover: null },
  { name: 'Country', color: '#dc148c', cover: null },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => songsAPI.search(debouncedQuery).then((r) => r.data.data),
    enabled: debouncedQuery.length >= 2,
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Search</h1>

      {/* Search Input */}
      <div className="relative max-w-xl mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="What do you want to listen to?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-10 py-3 rounded-full bg-white text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {debouncedQuery.length >= 2 ? (
        <div className="space-y-8">
          {isLoading && <div className="text-muted-foreground">Searching...</div>}
          {data?.songs?.length > 0 && (
            <section>
              <h2 className="text-white font-bold text-lg mb-3">Songs</h2>
              <div className="space-y-1">
                {data.songs.map((song: any, i: number) => (
                  <SongCard key={song.id} song={song} queue={data.songs} showIndex={i + 1} />
                ))}
              </div>
            </section>
          )}
          {data?.artists?.length > 0 && (
            <section>
              <h2 className="text-white font-bold text-lg mb-3">Artists</h2>
              <div className="flex gap-4 overflow-x-auto">
                {data.artists.map((artist: any) => (
                  <MediaCard key={artist.id} title={artist.name} imageUrl={artist.avatar_url} href={`/artists/${artist.id}`} rounded size="sm" />
                ))}
              </div>
            </section>
          )}
          {data?.albums?.length > 0 && (
            <section>
              <h2 className="text-white font-bold text-lg mb-3">Albums</h2>
              <div className="flex gap-4 overflow-x-auto">
                {data.albums.map((album: any) => (
                  <MediaCard key={album.id} title={album.title} subtitle={album.artist_name} imageUrl={album.cover_url} href={`/albums/${album.id}`} size="sm" />
                ))}
              </div>
            </section>
          )}
          {!isLoading && !data?.songs?.length && !data?.artists?.length && (
            <p className="text-muted-foreground">No results found for "{debouncedQuery}"</p>
          )}
        </div>
      ) : (
        /* Genre cards */
        <div>
          <h2 className="text-white font-bold text-lg mb-4">Browse all</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {GENRES.map((genre) => (
              <div
                key={genre.name}
                className="relative h-28 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: genre.color }}
              >
                <span className="absolute top-4 left-4 text-white font-bold text-lg">{genre.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
