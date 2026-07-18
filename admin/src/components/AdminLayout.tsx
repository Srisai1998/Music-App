import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { logout } from '../store/slices/authSlice';
import {
  LayoutDashboard, Music, Users, Megaphone, BarChart3,
  Mic2, Upload, LogOut, Music2, Disc3
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/songs', label: 'Songs', icon: Music },
  { href: '/songs/upload', label: 'Upload Song', icon: Upload },
  { href: '/artists', label: 'Artists', icon: Mic2 },
  { href: '/albums', label: 'Albums', icon: Disc3 },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/ads', label: 'Advertisements', icon: Megaphone },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 flex flex-col border-r border-gray-800">
        <div className="px-6 py-5 flex items-center gap-2 border-b border-gray-800">
          <Music2 className="h-7 w-7 text-green-500" />
          <span className="font-bold text-lg">Admin Panel</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-green-600/20 text-green-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold">
              {user?.display_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium truncate">{user?.display_name}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => dispatch(logout())}
            className="flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-sm transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
