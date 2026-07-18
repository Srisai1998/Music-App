'use client';
import React from 'react';
import Sidebar from './Sidebar';
import MusicPlayer from '../player/MusicPlayer';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useAppSelector } from '../../hooks/useRedux';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { currentSong } = useAppSelector((s) => s.player);
  useAudioPlayer(); // Initialize audio engine

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className={`flex-1 overflow-y-auto ${currentSong ? 'pb-24' : ''}`}>
          {children}
        </main>

        {/* Persistent music player */}
        {currentSong && <MusicPlayer />}
      </div>
    </div>
  );
}
