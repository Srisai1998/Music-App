import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { Search, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', page, debouncedSearch],
    queryFn: () => adminAPI.users({ page, limit: 20, search: debouncedSearch || undefined }).then((r) => r.data),
  });

  const handleToggle = async (userId: string) => {
    try {
      await adminAPI.toggleUser(userId);
      toast.success('User status updated');
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
    } catch {
      toast.error('Failed to update user');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 text-sm mt-1">Manage registered users</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500 w-60"
          />
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-gray-400">
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Plan</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Joined</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
              )}
              {data?.data?.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-700 flex items-center justify-center text-xs font-bold text-white">
                        {user.display_name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{user.display_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-red-900 text-red-400' : user.role === 'artist' ? 'bg-purple-900 text-purple-400' : 'bg-gray-700 text-gray-300'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${user.subscription_type === 'free' ? 'bg-gray-700 text-gray-300' : 'bg-green-900 text-green-400'}`}>
                      {user.subscription_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${user.is_active ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                      {user.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(user.id)}
                      title={user.is_active ? 'Suspend user' : 'Activate user'}
                      className={`p-1.5 rounded transition-colors ${user.is_active ? 'text-red-400 hover:bg-red-900/20' : 'text-green-400 hover:bg-green-900/20'}`}
                    >
                      {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <p className="text-gray-400 text-sm">
            Total: {data?.pagination?.total?.toLocaleString() || 0} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1.5 bg-gray-800 rounded text-gray-300 text-sm">
              {page} / {data?.pagination?.totalPages || 1}
            </span>
            <button
              onClick={() => setPage(Math.min(data?.pagination?.totalPages || 1, page + 1))}
              disabled={page >= (data?.pagination?.totalPages || 1)}
              className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
