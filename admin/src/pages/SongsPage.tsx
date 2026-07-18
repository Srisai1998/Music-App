import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { songsAPI, adminAPI } from '../services/api';
import { Search, ChevronLeft, ChevronRight, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function SongsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminSongs', page, search],
    queryFn: () => songsAPI.list({ page, limit: 20, search: search || undefined }).then((r: any) => r.data),
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this song?')) return;
    try {
      await songsAPI.delete(id);
      toast.success('Song deleted');
      qc.invalidateQueries({ queryKey: ['adminSongs'] });
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Songs</h1>
          <p className="text-gray-400 text-sm mt-1">Manage music library</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search songs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500 w-52"
            />
          </div>
          <a href="/songs/upload" className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
            + Upload Song
          </a>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-gray-400">
              <th className="px-4 py-3 text-left font-medium">#</th>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Artist</th>
              <th className="px-4 py-3 text-left font-medium">Genre</th>
              <th className="px-4 py-3 text-left font-medium">Plays</th>
              <th className="px-4 py-3 text-left font-medium">Duration</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading && <tr><td colSpan={8} className="text-center py-8 text-gray-500">Loading...</td></tr>}
            {data?.data?.map((song: any, i: number) => (
              <tr key={song.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * 20 + i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded bg-gray-700 flex items-center justify-center text-base flex-shrink-0">
                      🎵
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{song.title}</p>
                      <p className="text-gray-500 text-xs">{song.audio_quality || 'standard'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300">{song.artist_name}</td>
                <td className="px-4 py-3 text-gray-400">{song.genre_name || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{(song.play_count / 1000).toFixed(1)}K</td>
                <td className="px-4 py-3 text-gray-400">
                  {Math.floor(song.duration_seconds / 60)}:{String(song.duration_seconds % 60).padStart(2, '0')}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${song.is_published ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>
                    {song.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(song.id)} className="p-1.5 rounded text-red-400 hover:bg-red-900/20 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={8} className="text-center py-12 text-gray-500">No songs found</td></tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <p className="text-gray-400 text-sm">Total: {data?.pagination?.total?.toLocaleString() || 0} songs</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1.5 bg-gray-800 rounded text-gray-300 text-sm">{page} / {data?.pagination?.totalPages || 1}</span>
            <button onClick={() => setPage(Math.min(data?.pagination?.totalPages || 1, page + 1))} disabled={page >= (data?.pagination?.totalPages || 1)}
              className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
