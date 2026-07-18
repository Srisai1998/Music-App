'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, Library, Heart, Clock, Music2,
  PlusSquare, LogOut, Settings, Crown
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';
import { useQuery } from '@tanstack/react-query';
import { playlistsAPI } from '../../services/api';
import Image from 'next/image';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/library', label: 'Your Library', icon: Library },
];

const LIBRARY_ITEMS = [
  { href: '/liked', label: 'Liked Songs', icon: Heart },
  { href: '/history', label: 'Recently Played', icon: Clock },
];

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const isPremium = user?.subscription_type !== 'free';

  const { data: playlists } = useQuery({
    queryKey: ['myPlaylists'],
    queryFn: () => playlistsAPI.my().then((r) => r.data.data),
    enabled: isAuthenticated,
  });

  const handleLogout = () => {
    dispatch(logout());
    router.push('/');
  };

  return (
    <aside className="w-64 bg-black flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <Music2 className="h-8 w-8 text-primary" />
          <span className="text-white font-bold text-xl">MusicApp</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-4 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1',
              pathname === href
                ? 'bg-secondary text-white'
                : 'text-muted-foreground hover:text-white hover:bg-secondary/50'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mx-3 my-4 border-t border-secondary" />

      {/* Library shortcuts */}
      <div className="px-3 space-y-1">
        {LIBRARY_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-4 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-secondary text-white'
                : 'text-muted-foreground hover:text-white'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
        {isAuthenticated && (
          <Link
            href="/playlists/new"
            className="flex items-center gap-4 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <PlusSquare className="h-5 w-5" />
            Create Playlist
          </Link>
        )}
      </div>

      {/* Playlists list */}
      {isAuthenticated && playlists && playlists.length > 0 && (
        <>
          <div className="mx-3 my-3 border-t border-secondary" />
          <div className="flex-1 overflow-y-auto px-6 space-y-3">
            {playlists.map((p: any) => (
              <Link
                key={p.id}
                href={`/playlists/${p.id}`}
                className={clsx(
                  'block text-sm truncate transition-colors',
                  pathname === `/playlists/${p.id}` ? 'text-white' : 'text-muted-foreground hover:text-white'
                )}
              >
                {p.name}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Bottom section */}
      <div className="mt-auto p-4 space-y-3">
        {!isPremium && isAuthenticated && (
          <Link
            href="/premium"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
          >
            <Crown className="h-4 w-4 text-yellow-400" />
            Upgrade to Premium
          </Link>
        )}

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 rounded-full overflow-hidden bg-secondary flex-shrink-0">
              {user?.avatar_url ? (
                <Image src={user.avatar_url} alt={user.display_name} fill className="object-cover" />
              ) : (
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-black">
                  {user?.display_name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.display_name}</p>
              {isPremium && <p className="text-primary text-xs">Premium</p>}
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-white transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/login" className="flex-1 text-center py-2 rounded-full border border-muted text-white text-sm hover:border-white transition-colors">
              Log in
            </Link>
            <Link href="/register" className="flex-1 text-center py-2 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-transform">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
