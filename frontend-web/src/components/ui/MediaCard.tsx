'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { useAppDispatch } from '../../hooks/useRedux';
import { playSong } from '../../store/slices/playerSlice';
import { clsx } from 'clsx';

interface CardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href: string;
  songs?: any[];
  onPlay?: () => void;
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  badge?: string;
}

export default function MediaCard({
  title, subtitle, imageUrl, href, songs, onPlay, size = 'md', rounded = false, badge
}: CardProps) {
  const dispatch = useAppDispatch();

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onPlay) { onPlay(); return; }
    if (songs && songs.length > 0) {
      dispatch(playSong({ song: songs[0], queue: songs }));
    }
  };

  const sizeClasses = { sm: 'w-32', md: 'w-44', lg: 'w-56' };

  return (
    <Link href={href} className={clsx('group block', sizeClasses[size])}>
      <div className="relative mb-3">
        <div className={clsx(
          'relative overflow-hidden bg-secondary aspect-square',
          rounded ? 'rounded-full' : 'rounded-md'
        )}>
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-4xl bg-gradient-to-br from-purple-600 to-blue-500">
              🎵
            </div>
          )}
          {badge && (
            <span className="absolute top-2 left-2 bg-primary text-black text-xs font-bold px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <button
          onClick={handlePlay}
          className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-primary shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200"
        >
          <Play className="h-5 w-5 text-black fill-black ml-0.5" />
        </button>
      </div>
      <h3 className="text-white font-medium text-sm truncate">{title}</h3>
      {subtitle && <p className="text-muted-foreground text-xs truncate mt-0.5">{subtitle}</p>}
    </Link>
  );
}
