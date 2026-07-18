'use client';
import { useQuery } from '@tanstack/react-query';
import { playlistsAPI, favoritesAPI, historyAPI } from '../../services/api';
import { useAppSelector } from '../../hooks/useRedux';
import { useAppDispatch } from '../../hooks/useRedux';
import { playSong } from '../../store/slices/playerSlice';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Clock, PlusCircle, Music2, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';

function LibraryCard({
  title, subtitle, imageUrl, emoji, href, onClick,
}: {
  title: string; subtitle: string; imageUrl?: string;
  emoji?: string; href?: string; onClick?: () => void;
}) {
  const inner = (
    <div className="flex items-center gap-3 p-3 rounded-md hover:bg-secondary/60 transition-colors cursor-pointer group">
      <div className="relative h-12 w-12 rounded overflow-hidden flex-shrink-0 bg-secondary flex items-center justify-center text-xl">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill className="object-cover" />
        ) : (
          <span>{emoji}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-white font-medium text-sm truncate">{title}</p>
        <p className="text-muted-foreground text-xs truncate">{subtitle}</p>
      </div>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return <div onClick={onClick}>{inner}</div>;
}

export default function LibraryPage() {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { data: playlists } = useQuery({
    queryKey: ['myPlaylists'],
    queryFn: () => playlistsAPI.my().then((r) => r.data.data),
    enabled: isAuthenticated,
  });

  const { data: favorites } = useQuery({
    queryKey: ['favoritesCount'],
    queryFn: () => favoritesAPI.list({ limit: 1 }).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const { data: recentSongs } = useQuery({
    queryKey: ['recentSongs'],
    queryFn: () => historyAPI.recent().then((r) => r.data.data),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
          <Lock className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Enjoy your Library</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Log in to see your playlists, liked songs, and recently played tracks.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-6 py-2 rounded-full bg-white text-black font-bold text-sm hover:scale-105 transition-transform"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-6 py-2 rounded-full border border-muted text-white font-bold text-sm hover:border-white transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Your Library</h1>
        <Link
          href="/playlists/new"
          className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm"
        >
          <PlusCircle className="h-5 w-5" />
          <span>Create playlist</span>
        </Link>
      </div>

      {/* Pinned items */}
      <section>
        <div className="space-y-1">
          {/* Liked Songs */}
          <LibraryCard
            href="/liked"
            title="Liked Songs"
            subtitle={`${favorites?.pagination?.total ?? 0} songs`}
            emoji="💚"
          />
          {/* Recently Played */}
          <LibraryCard
            href="/history"
            title="Recently Played"
            subtitle={`${recentSongs?.length ?? 0} songs`}
            emoji="🕐"
          />
        </div>
      </section>

      {/* Playlists */}
      <section>
        <h2 className="text-white font-bold text-base mb-2">Playlists</h2>
        {playlists?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Music2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>You haven't created any playlists yet.</p>
            <Link href="/playlists/new" className="text-primary hover:underline text-sm mt-2 inline-block">
              Create your first playlist
            </Link>
          </div>
        )}
        <div className="space-y-1">
          {playlists?.map((p: any) => (
            <LibraryCard
              key={p.id}
              href={`/playlists/${p.id}`}
              title={p.name}
              subtitle={`${p.total_songs} songs • ${p.visibility}`}
              imageUrl={p.cover_url}
              emoji="🎵"
            />
          ))}
        </div>
      </section>

      {/* Recent songs quick-play */}
      {recentSongs && recentSongs.length > 0 && (
        <section>
          <h2 className="text-white font-bold text-base mb-2">Jump back in</h2>
          <div className="space-y-1">
            {recentSongs.slice(0, 5).map((song: any) => (
              <LibraryCard
                key={song.id}
                title={song.title}
                subtitle={song.artist_name ?? ''}
                imageUrl={song.cover_url || song.album_cover}
                emoji="♪"
                onClick={() => dispatch(playSong({ song, queue: recentSongs }))}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
