'use client';
import { useQuery } from '@tanstack/react-query';
import { songsAPI, artistsAPI, playlistsAPI, recommendationsAPI } from '../services/api';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { playSong } from '../store/slices/playerSlice';
import SongCard from '../components/ui/SongCard';
import MediaCard from '../components/ui/MediaCard';
import { ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-white font-bold text-xl">{title}</h2>
      {href && (
        <Link href={href} className="text-muted-foreground hover:text-white text-sm flex items-center gap-1 transition-colors">
          Show all <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => songsAPI.trending(20).then((r) => r.data.data),
  });

  const { data: featuredArtists } = useQuery({
    queryKey: ['featuredArtists'],
    queryFn: () => artistsAPI.list({ featured: 'true', limit: 10 }).then((r) => r.data.data),
  });

  const { data: publicPlaylists } = useQuery({
    queryKey: ['publicPlaylists'],
    queryFn: () => playlistsAPI.list({ limit: 8 }).then((r) => r.data.data),
  });

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => recommendationsAPI.get().then((r) => r.data.data),
    enabled: isAuthenticated,
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          {isAuthenticated ? `${greeting()}, ${user?.display_name?.split(' ')[0]}` : greeting()}
        </h1>
      </div>

      {/* Trending Songs */}
      {trending && trending.length > 0 && (
        <section>
          <SectionHeader title="Trending Now" href="/songs" />
          <div className="space-y-1">
            {trending.slice(0, 8).map((song: any, i: number) => (
              <SongCard key={song.id} song={song} queue={trending} showIndex={i + 1} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Artists */}
      {featuredArtists && featuredArtists.length > 0 && (
        <section>
          <SectionHeader title="Featured Artists" href="/artists" />
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {featuredArtists.map((artist: any) => (
              <MediaCard
                key={artist.id}
                title={artist.name}
                subtitle={`${(artist.monthly_listeners / 1000).toFixed(0)}K listeners`}
                imageUrl={artist.avatar_url}
                href={`/artists/${artist.id}`}
                rounded
              />
            ))}
          </div>
        </section>
      )}

      {/* Playlists */}
      {publicPlaylists && publicPlaylists.length > 0 && (
        <section>
          <SectionHeader title="Featured Playlists" href="/playlists" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {publicPlaylists.map((playlist: any) => (
              <MediaCard
                key={playlist.id}
                title={playlist.name}
                subtitle={`${playlist.total_songs} songs`}
                imageUrl={playlist.cover_url}
                href={`/playlists/${playlist.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Personalised Recommendations */}
      {isAuthenticated && recommendations && recommendations.length > 0 && (
        <section>
          <SectionHeader title="Recommended For You" />
          <div className="space-y-1">
            {recommendations.slice(0, 10).map((song: any) => (
              <SongCard key={song.id} song={song} queue={recommendations} />
            ))}
          </div>
        </section>
      )}

      {/* CTA for non-authenticated */}
      {!isAuthenticated && (
        <section className="rounded-2xl bg-gradient-to-r from-purple-900 to-blue-900 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Listen to millions of songs</h2>
          <p className="text-blue-100 mb-6">Create your free account to get personalized recommendations.</p>
          <Link href="/register" className="inline-block bg-white text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform">
            Get started free
          </Link>
        </section>
      )}
    </div>
  );
}
