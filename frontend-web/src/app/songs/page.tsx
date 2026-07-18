'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { songsAPI } from '../../services/api';
import SongCard from '../../components/ui/SongCard';
import { clsx } from 'clsx';

const LIMIT = 30;

export default function SongsPage() {
  const [language, setLanguage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [songs, setSongs] = useState<any[]>([]);

  const { data: languages } = useQuery({
    queryKey: ['songLanguages'],
    queryFn: () => songsAPI.languages().then((r) => r.data.data),
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['allSongs', page, language],
    queryFn: () =>
      songsAPI.list({ page, limit: LIMIT, ...(language ? { language } : {}) }).then((r) => r.data),
  });

  useEffect(() => {
    if (!data) return;
    setSongs((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
  }, [data, page]);

  const handleSelectLanguage = (lang: string | null) => {
    setLanguage(lang);
    setPage(1);
    setSongs([]);
  };

  const hasNext = data?.pagination?.hasNext;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">All Songs</h1>

      {languages && languages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => handleSelectLanguage(null)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              language === null ? 'bg-white text-black' : 'bg-secondary text-white hover:bg-secondary/70'
            )}
          >
            All
          </button>
          {languages.map((l: { language: string; count: string }) => (
            <button
              key={l.language}
              onClick={() => handleSelectLanguage(l.language)}
              className={clsx(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                language === l.language ? 'bg-white text-black' : 'bg-secondary text-white hover:bg-secondary/70'
              )}
            >
              {l.language} <span className="opacity-60">({l.count})</span>
            </button>
          ))}
        </div>
      )}

      {isLoading && songs.length === 0 && (
        <div className="text-muted-foreground">Loading songs...</div>
      )}

      {!isLoading && songs.length === 0 && (
        <div className="text-muted-foreground">No songs found.</div>
      )}

      <div className="space-y-1">
        {songs.map((song, i) => (
          <SongCard key={song.id} song={song} queue={songs} showIndex={i + 1} />
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
