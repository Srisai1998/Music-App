'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playlistsAPI, songsAPI } from '../../../services/api';
import { useAppDispatch, useAppSelector } from '../../../hooks/useRedux';
import { playSong } from '../../../store/slices/playerSlice';
import SongCard from '../../../components/ui/SongCard';
import { Play, Lock, Globe, Pencil, Trash2, PlusCircle, X, Search } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import toast from 'react-hot-toast';
import { useDebounce } from '../../../hooks/useDebounce';

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [showAddSong, setShowAddSong] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const debouncedQ = useDebounce(searchQ, 400);

  const { data: playlist, isLoading } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => playlistsAPI.get(id).then((r) => r.data.data),
  });

  const { data: searchResults } = useQuery({
    queryKey: ['songSearch', debouncedQ],
    queryFn: () => songsAPI.search(debouncedQ).then((r) => r.data.data?.songs || []),
    enabled: debouncedQ.length >= 2,
  });

  const deleteMutation = useMutation({
    mutationFn: () => playlistsAPI.delete(id),
    onSuccess: () => { router.push('/library'); toast.success('Playlist deleted'); },
    onError: () => toast.error('Failed to delete playlist'),
  });

  const removeSongMutation = useMutation({
    mutationFn: (songId: string) => playlistsAPI.removeSong(id, songId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['playlist', id] }); },
    onError: () => toast.error('Failed to remove song'),
  });

  const addSongMutation = useMutation({
    mutationFn: (songId: string) => playlistsAPI.addSong(id, songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', id] });
      toast.success('Song added');
    },
    onError: () => toast.error('Song already in playlist or error occurred'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!playlist) return <div className="p-6 text-muted-foreground">Playlist not found.</div>;

  const songs: any[] = playlist.songs || [];
  const isOwner = isAuthenticated && user?.id === playlist.user_id;

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-b from-purple-900 to-background p-8">
        <div className="flex items-end gap-6">
          <div className="relative h-52 w-52 rounded-md overflow-hidden shadow-2xl flex-shrink-0 bg-secondary">
            {playlist.cover_url ? (
              <Image src={playlist.cover_url} alt={playlist.name} fill className="object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-purple-500 to-indigo-900 flex items-center justify-center text-6xl">
                🎵
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm uppercase font-bold mb-1">Playlist</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-muted-foreground text-sm mb-2 max-w-lg">{playlist.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-white font-medium">{playlist.display_name || 'User'}</span>
              <span>•</span>
              {playlist.visibility === 'private' ? (
                <><Lock className="h-3 w-3" /> Private</>
              ) : (
                <><Globe className="h-3 w-3" /> Public</>
              )}
              <span>•</span>
              <span>{songs.length} songs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-8 py-4 flex items-center gap-4">
        {songs.length > 0 && (
          <button
            onClick={() => dispatch(playSong({ song: songs[0], queue: songs }))}
            className="h-14 w-14 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
          >
            <Play className="h-6 w-6 text-black fill-black ml-1" />
          </button>
        )}
        {isOwner && (
          <>
            <button
              onClick={() => setShowAddSong(true)}
              className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm"
            >
              <PlusCircle className="h-5 w-5" /> Add songs
            </button>
            <button
              onClick={() => { if (confirm('Delete this playlist?')) deleteMutation.mutate(); }}
              className="flex items-center gap-2 text-muted-foreground hover:text-red-400 transition-colors text-sm ml-auto"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </>
        )}
      </div>

      {/* Song list */}
      <div className="px-6 pb-8">
        {songs.length === 0 && !showAddSong && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-3">This playlist is empty</p>
            {isOwner && (
              <button
                onClick={() => setShowAddSong(true)}
                className="text-primary hover:underline text-sm"
              >
                Add songs to get started
              </button>
            )}
          </div>
        )}
        <div className="space-y-1">
          {songs.map((song: any, i: number) => (
            <div key={song.id} className="group flex items-center">
              <div className="flex-1">
                <SongCard song={song} queue={songs} showIndex={i + 1} />
              </div>
              {isOwner && (
                <button
                  onClick={() => removeSongMutation.mutate(song.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-400 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Song Drawer */}
      {showAddSong && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowAddSong(false)}>
          <div
            className="bg-[#282828] rounded-xl p-6 w-full max-w-lg max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Add to playlist</h3>
              <button onClick={() => setShowAddSong(false)}><X className="h-5 w-5 text-muted-foreground hover:text-white" /></button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search songs..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-md bg-secondary text-white text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto space-y-1">
              {searchResults?.map((song: any) => (
                <div key={song.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/60 cursor-pointer"
                  onClick={() => addSongMutation.mutate(song.id)}>
                  <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center text-sm flex-shrink-0">♪</div>
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">{song.title}</p>
                    <p className="text-muted-foreground text-xs truncate">{song.artist_name}</p>
                  </div>
                  <PlusCircle className="h-4 w-4 text-muted-foreground ml-auto flex-shrink-0" />
                </div>
              ))}
              {debouncedQ.length >= 2 && !searchResults?.length && (
                <p className="text-muted-foreground text-sm text-center py-4">No songs found</p>
              )}
              {debouncedQ.length < 2 && (
                <p className="text-muted-foreground text-sm text-center py-4">Type at least 2 characters to search</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
