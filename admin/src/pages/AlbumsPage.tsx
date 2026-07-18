import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Disc3, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';

const PAGE_SIZE = 15;

export default function AlbumsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminAlbums', page, search],
    queryFn: () =>
      api
        .get('/albums', { params: { page, limit: PAGE_SIZE, search: search || undefined } })
        .then((r) => r.data),
  });

  const albums: any[] = data?.data || [];
  const total: number = data?.pagination?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Albums</h1>
          <p className="text-gray-400 text-sm mt-1">{total} total albums</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search albums..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50 border-b border-gray-800">
            <tr>
              <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase">#</th>
              <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase">Album</th>
              <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase">Artist</th>
              <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase">Type</th>
              <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase">Release</th>
              <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase">Songs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">Loading...</td>
              </tr>
            )}
            {!isLoading && albums.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Disc3 className="h-12 w-12 mx-auto text-gray-700 mb-3" />
                  <p className="text-gray-500">No albums found</p>
                </td>
              </tr>
            )}
            {albums.map((album: any, i: number) => (
              <tr key={album.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-500 text-sm">{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {album.cover_url ? (
                        <img src={album.cover_url} alt={album.title} className="h-10 w-10 object-cover" />
                      ) : (
                        <Disc3 className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{album.title}</p>
                      {album.description && (
                        <p className="text-gray-500 text-xs truncate max-w-xs">{album.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300 text-sm">{album.artist_name || '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 text-xs capitalize">
                    {album.album_type || 'album'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {album.release_date ? new Date(album.release_date).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">{album.total_songs ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-gray-500 text-sm">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
