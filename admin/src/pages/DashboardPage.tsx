import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Users, Music, Mic2, DollarSign, TrendingUp, Eye, Megaphone } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, sub }: any) => (
  <div className={`bg-gray-900 rounded-xl p-5 border border-gray-800`}>
    <div className="flex items-center justify-between mb-3">
      <p className="text-gray-400 text-sm">{title}</p>
      <div className={`h-9 w-9 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

const COLORS = ['#1db954', '#3b82f6', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminAPI.dashboard().then((r) => r.data.data),
  });

  const { data: revenue } = useQuery({
    queryKey: ['revenueAnalytics'],
    queryFn: () => adminAPI.revenueAnalytics(30).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center text-gray-400">
        Loading dashboard...
      </div>
    );
  }

  const ov = data?.overview || {};

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Music App admin overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={ov.total_users?.toLocaleString()} icon={Users} color="bg-blue-600" sub={`${ov.premium_users} premium`} />
        <StatCard title="Total Songs" value={ov.total_songs?.toLocaleString()} icon={Music} color="bg-green-600" />
        <StatCard title="Artists" value={ov.total_artists?.toLocaleString()} icon={Mic2} color="bg-purple-600" />
        <StatCard title="Revenue" value={`$${(ov.total_revenue || 0).toLocaleString('en', { minimumFractionDigits: 2 })}`} icon={DollarSign} color="bg-yellow-600" sub="All time" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-white font-semibold mb-4">Revenue (30 days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenue?.revenue_trends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
              <Area type="monotone" dataKey="revenue" stroke="#1db954" fill="rgba(29,185,84,0.2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Songs */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-white font-semibold mb-4">Top Songs</h2>
          <div className="space-y-3">
            {(data?.top_songs || []).slice(0, 6).map((song: any, i: number) => (
              <div key={song.id} className="flex items-center gap-3">
                <span className="text-gray-500 text-sm w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{song.title}</p>
                  <p className="text-gray-500 text-xs truncate">{song.artist_name}</p>
                </div>
                <span className="text-gray-400 text-xs">{(song.play_count / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-white font-semibold mb-4">Subscription Plans</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={revenue?.plan_breakdown || []} dataKey="count" nameKey="plan" cx="50%" cy="50%" innerRadius={40} outerRadius={60}>
                  {(revenue?.plan_breakdown || []).map((_: any, idx: number) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {(revenue?.plan_breakdown || []).map((p: any, idx: number) => (
                <div key={p.plan} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="text-white text-sm capitalize">{p.plan}</span>
                  <span className="text-gray-400 text-sm ml-1">({p.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ad Performance */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-white font-semibold mb-4">Ad Performance</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Ads', value: data?.ad_stats?.total_ads || 0, icon: Megaphone },
              { label: 'Impressions', value: (data?.ad_stats?.total_impressions / 1000 || 0).toFixed(1) + 'K', icon: Eye },
              { label: 'Clicks', value: data?.ad_stats?.total_clicks || 0, icon: TrendingUp },
              { label: 'CTR', value: `${((data?.ad_stats?.total_clicks / data?.ad_stats?.total_impressions) * 100 || 0).toFixed(1)}%`, icon: TrendingUp },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">{label}</p>
                <p className="text-white font-bold text-lg mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h2 className="text-white font-semibold mb-4">Recent Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="pb-3 text-left font-medium">User</th>
                <th className="pb-3 text-left font-medium">Email</th>
                <th className="pb-3 text-left font-medium">Plan</th>
                <th className="pb-3 text-left font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {(data?.recent_users || []).map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 text-white font-medium">{u.display_name}</td>
                  <td className="py-3 text-gray-400">{u.email}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.subscription_type === 'free' ? 'bg-gray-700 text-gray-300' : 'bg-green-900 text-green-400'}`}>
                      {u.subscription_type}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

