'use client';
import { useQuery } from '@tanstack/react-query';
import { historyAPI } from '../../services/api';
import SongCard from '../../components/ui/SongCard';
import { Clock, Lock } from 'lucide-react';
import { useAppSelector } from '../../hooks/useRedux';
import Link from 'next/link';

export default function HistoryPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const { data, isLoading } = useQuery({
    queryKey: ['listeningHistory'],
    queryFn: () => historyAPI.list({ limit: 100 }).then((r) => r.data.data),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold text-white">See what you've been listening to</h2>
        <Link href="/login" className="bg-white text-black font-bold px-8 py-2 rounded-full hover:scale-105 transition-transform">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-b from-[#1e1b4b] to-background p-8">
        <div className="flex items-end gap-6">
          <div className="h-48 w-48 bg-gradient-to-br from-indigo-600 to-purple-900 rounded-md flex items-center justify-center shadow-2xl">
            <Clock className="h-20 w-20 text-white" />
          </div>
          <div>
            <p className="text-white text-sm uppercase font-bold mb-1">History</p>
            <h1 className="text-5xl font-bold text-white mb-3">Recently Played</h1>
            <p className="text-muted-foreground">{data?.length ?? 0} songs</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading && <div className="text-muted-foreground">Loading...</div>}
        {data?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Songs you play will appear here</p>
          </div>
        )}
        <div className="space-y-1">
          {data?.map((song: any, i: number) => (
            <SongCard key={`${song.id}-${i}`} song={song} queue={data} showIndex={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
