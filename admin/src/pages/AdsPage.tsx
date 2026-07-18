import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminAds'],
    queryFn: () => adminAPI.ads().then((r: any) => r.data),
  });

  const handleToggle = async (id: string) => {
    try {
      await adminAPI.toggleAd(id);
      toast.success('Ad status updated');
      qc.invalidateQueries({ queryKey: ['adminAds'] });
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Advertisements</h1>
          <p className="text-gray-400 text-sm mt-1">Manage ad campaigns</p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus className="h-4 w-4" /> Create Ad
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading && <div className="text-gray-500 text-center py-8">Loading ads...</div>}
        {data?.data?.map((ad: any) => (
          <div key={ad.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-gray-800 flex items-center justify-center text-2xl">
                {ad.ad_type === 'banner' ? '🖼' : ad.ad_type === 'audio' ? '🔊' : ad.ad_type === 'rewarded' ? '🎁' : '📺'}
              </div>
              <div>
                <h3 className="text-white font-bold">{ad.title}</h3>
                <div className="flex gap-3 mt-1">
                  <span className="text-gray-400 text-xs capitalize">{ad.ad_type}</span>
                  <span className="text-gray-400 text-xs">•</span>
                  <span className="text-gray-400 text-xs capitalize">{ad.placement}</span>
                  <span className="text-gray-400 text-xs">•</span>
                  <span className="text-gray-400 text-xs">{ad.impression_count} impressions</span>
                  <span className="text-gray-400 text-xs">•</span>
                  <span className="text-gray-400 text-xs">{ad.click_count} clicks</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded text-xs font-bold ${ad.is_active ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                {ad.is_active ? 'Active' : 'Paused'}
              </span>
              <button onClick={() => handleToggle(ad.id)} className="text-gray-400 hover:text-white transition-colors">
                {ad.is_active ? <ToggleRight className="h-6 w-6 text-green-400" /> : <ToggleLeft className="h-6 w-6" />}
              </button>
            </div>
          </div>
        ))}
        {!isLoading && !data?.data?.length && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">📢</div>
            <p>No advertisements yet. Create your first ad campaign.</p>
          </div>
        )}
      </div>
    </div>
  );
}
