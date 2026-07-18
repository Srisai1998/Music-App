'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { playlistsAPI } from '../../../services/api';
import { useAppSelector } from '../../../hooks/useRedux';
import { Music2, Lock, Globe, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewPlaylistPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Music2 className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold text-white">Log in to create playlists</h2>
        <Link href="/login" className="bg-white text-black font-bold px-8 py-2 rounded-full hover:scale-105 transition-transform">
          Log in
        </Link>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Playlist name is required'); return; }
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append('name', name.trim());
      form.append('description', description);
      form.append('visibility', visibility);
      const { data } = await playlistsAPI.create(form);
      toast.success('Playlist created!');
      router.push(`/playlists/${data.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create playlist');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Link href="/library" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to library
      </Link>

      <h1 className="text-3xl font-bold text-white mb-8">Create playlist</h1>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Playlist cover placeholder */}
        <div className="flex justify-center mb-2">
          <div className="h-40 w-40 rounded-md bg-secondary flex items-center justify-center text-6xl shadow-xl">
            🎵
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My playlist #1"
            maxLength={100}
            required
            className="w-full px-4 py-3 bg-secondary border border-secondary rounded-md text-white placeholder-muted-foreground focus:outline-none focus:border-primary text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add an optional description..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 bg-secondary border border-secondary rounded-md text-white placeholder-muted-foreground focus:outline-none focus:border-primary text-sm resize-none"
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-white text-sm font-medium mb-3">Visibility</label>
          <div className="flex gap-3">
            {(['public', 'private'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  visibility === v
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-secondary text-muted-foreground hover:border-muted hover:text-white'
                }`}
              >
                {v === 'public' ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="w-full bg-primary text-black font-bold py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
        >
          {isLoading ? 'Creating...' : 'Create playlist'}
        </button>
      </form>
    </div>
  );
}
