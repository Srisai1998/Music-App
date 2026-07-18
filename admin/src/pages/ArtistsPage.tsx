import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { artistsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Plus, CheckCircle } from 'lucide-react';

export default function ArtistsPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', country: '' });
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminArtists'],
    queryFn: () => artistsAPI.list({ limit: 50 }).then((r: any) => r.data.data),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await artistsAPI.create(fd);
      toast.success('Artist created!');
      setForm({ name: '', bio: '', country: '' });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['adminArtists'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Artists</h1>
          <p className="text-gray-400 text-sm mt-1">Manage music artists</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus className="h-4 w-4" /> Add Artist
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-6">
          <h2 className="text-white font-bold mb-4">New Artist</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-3 gap-4">
            <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              placeholder="Artist Name *" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500" />
            <input value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))}
              placeholder="Country" className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500" />
            <button type="submit" disabled={saving}
              className="bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Create Artist'}
            </button>
            <input value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))}
              placeholder="Bio" className="col-span-3 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500" />
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading && Array(8).fill(0).map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 animate-pulse">
            <div className="h-20 w-20 rounded-full bg-gray-700 mx-auto mb-3" />
            <div className="h-4 bg-gray-700 rounded mb-2" />
            <div className="h-3 bg-gray-800 rounded w-2/3 mx-auto" />
          </div>
        ))}
        {data?.map((artist: any) => (
          <div key={artist.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center hover:border-green-600 transition-colors">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3">
              {artist.name[0].toUpperCase()}
            </div>
            <h3 className="text-white font-bold text-sm truncate">{artist.name}</h3>
            <p className="text-gray-400 text-xs mt-1">{artist.country || 'Unknown'}</p>
            <p className="text-green-400 text-xs mt-1">{(artist.monthly_listeners / 1000).toFixed(1)}K listeners</p>
            {artist.is_verified && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <CheckCircle className="h-3 w-3 text-blue-400" />
                <span className="text-blue-400 text-xs">Verified</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
