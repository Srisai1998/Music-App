import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const { data: songStats } = useQuery({
    queryKey: ['songAnalytics'],
    queryFn: () => adminAPI.songAnalytics(30).then((r: any) => r.data.data),
  });
  const { data: revenueStats } = useQuery({
    queryKey: ['revenueAnalytics'],
    queryFn: () => adminAPI.revenueAnalytics(30).then((r: any) => r.data.data),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Last 30 days</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-white font-semibold mb-4">Play Trends</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={songStats?.play_trends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
              <Area type="monotone" dataKey="plays" stroke="#1db954" fill="rgba(29,185,84,.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-white font-semibold mb-4">Revenue Trends</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueStats?.revenue_trends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-white font-semibold mb-4">Top Genres</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={songStats?.top_genres || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="total_plays" fill="#8400e7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-white font-semibold mb-4">Subscription Plans</h2>
          <div className="space-y-3 mt-4">
            {(revenueStats?.plan_breakdown || []).map((p: any) => (
              <div key={p.plan} className="flex items-center justify-between">
                <span className="text-white capitalize font-medium">{p.plan}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">{p.count} users</span>
                  <span className="text-green-400 font-bold">${parseFloat(p.revenue || 0).toFixed(0)}</span>
                </div>
              </div>
            ))}
            {(!revenueStats?.plan_breakdown || revenueStats.plan_breakdown.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">No subscription data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
