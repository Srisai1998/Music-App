import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../types';
import { paginate, getPaginationParams, generateUniqueSlug } from '../utils/helpers';
import { getCache, setCache } from '../config/redis';
import { uploadToS3, generateStorageKey } from '../config/storage';

// ── List Playlists ────────────────────────────────────────────────────────────
export const listPlaylists = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { visibility = 'public' } = req.query as any;

  const query = db('playlists as p')
    .leftJoin('users as u', 'p.user_id', 'u.id')
    .where('p.is_active', true);

  if (visibility === 'public') {
    query.where('p.visibility', 'public');
  } else if (req.user) {
    query.where('p.user_id', req.user.userId);
  }

  const [playlists, [{ count }]] = await Promise.all([
    query
      .clone()
      .select('p.*', 'u.display_name as owner_name', 'u.avatar_url as owner_avatar')
      .orderBy('p.created_at', 'desc')
      .limit(limit)
      .offset(offset),
    query.clone().count('p.id as count'),
  ]);

  res.json({ success: true, ...paginate(playlists, parseInt(count as string), page, limit) });
};

// ── Get Playlist ──────────────────────────────────────────────────────────────
export const getPlaylist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const playlist = await db('playlists as p')
    .leftJoin('users as u', 'p.user_id', 'u.id')
    .where('p.id', id).orWhere('p.slug', id)
    .select('p.*', 'u.display_name as owner_name', 'u.avatar_url as owner_avatar')
    .first();

  if (!playlist) {
    res.status(404).json({ success: false, message: 'Playlist not found' });
    return;
  }

  // Access check
  if (playlist.visibility === 'private' && playlist.user_id !== req.user?.userId && req.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Access denied' });
    return;
  }

  const songs = await db('playlist_songs as ps')
    .join('songs as s', 'ps.song_id', 's.id')
    .leftJoin('artists as ar', 's.artist_id', 'ar.id')
    .where('ps.playlist_id', playlist.id)
    .where('s.is_active', true)
    .orderBy('ps.position', 'asc')
    .select('s.*', 'ps.position', 'ps.added_at', 'ar.name as artist_name', 'ar.avatar_url as artist_avatar');

  res.json({ success: true, data: { ...playlist, songs } });
};

// ── Create Playlist ───────────────────────────────────────────────────────────
export const createPlaylist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, visibility = 'private' } = req.body;
  const slug = await generateUniqueSlug(name, async (s) => !!(await db('playlists').where({ slug: s }).first()));
  let cover_url: string | undefined;
  if (req.file) {
    const key = generateStorageKey('covers/playlists', req.file.originalname);
    cover_url = await uploadToS3(req.file.buffer, key, req.file.mimetype);
  }
  const [playlist] = await db('playlists')
    .insert({ name: name.trim(), slug, description: description || null, user_id: req.user!.userId, visibility, cover_url })
    .returning('*');
  res.status(201).json({ success: true, data: playlist });
};

// ── Update Playlist ───────────────────────────────────────────────────────────
export const updatePlaylist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const playlist = await db('playlists').where({ id }).first();
  if (!playlist) {
    res.status(404).json({ success: false, message: 'Playlist not found' });
    return;
  }
  if (playlist.user_id !== req.user!.userId && req.user!.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Access denied' });
    return;
  }
  const { name, description, visibility } = req.body;
  const updateData: Record<string, any> = { updated_at: db.fn.now() };
  if (name) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description;
  if (visibility) updateData.visibility = visibility;
  if (req.file) {
    const key = generateStorageKey('covers/playlists', req.file.originalname);
    updateData.cover_url = await uploadToS3(req.file.buffer, key, req.file.mimetype);
  }
  const [updated] = await db('playlists').where({ id }).update(updateData).returning('*');
  res.json({ success: true, data: updated });
};

// ── Delete Playlist ───────────────────────────────────────────────────────────
export const deletePlaylist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const playlist = await db('playlists').where({ id }).first();
  if (!playlist) {
    res.status(404).json({ success: false, message: 'Playlist not found' });
    return;
  }
  if (playlist.user_id !== req.user!.userId && req.user!.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Access denied' });
    return;
  }
  await db('playlists').where({ id }).update({ is_active: false });
  res.json({ success: true, message: 'Playlist deleted' });
};

// ── Add Song to Playlist ──────────────────────────────────────────────────────
export const addSongToPlaylist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { song_id } = req.body;
  const playlist = await db('playlists').where({ id }).first();
  if (!playlist) {
    res.status(404).json({ success: false, message: 'Playlist not found' });
    return;
  }
  if (playlist.user_id !== req.user!.userId && req.user!.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Access denied' });
    return;
  }
  const song = await db('songs').where({ id: song_id, is_active: true }).first();
  if (!song) {
    res.status(404).json({ success: false, message: 'Song not found' });
    return;
  }
  const exists = await db('playlist_songs').where({ playlist_id: id, song_id }).first();
  if (exists) {
    res.status(409).json({ success: false, message: 'Song already in playlist' });
    return;
  }
  const [{ max }] = await db('playlist_songs').where({ playlist_id: id }).max('position as max');
  await db('playlist_songs').insert({
    playlist_id: id,
    song_id,
    added_by: req.user!.userId,
    position: (max || 0) + 1,
  });
  await db('playlists').where({ id }).increment('total_songs', 1).increment('total_duration_seconds', song.duration_seconds);
  res.json({ success: true, message: 'Song added to playlist' });
};

// ── Remove Song from Playlist ─────────────────────────────────────────────────
export const removeSongFromPlaylist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id, songId } = req.params;
  const playlist = await db('playlists').where({ id }).first();
  if (!playlist || (playlist.user_id !== req.user!.userId && req.user!.role !== 'admin')) {
    res.status(403).json({ success: false, message: 'Access denied' });
    return;
  }
  const ps = await db('playlist_songs').where({ playlist_id: id, song_id: songId }).first();
  if (!ps) {
    res.status(404).json({ success: false, message: 'Song not in playlist' });
    return;
  }
  const song = await db('songs').where({ id: songId }).first();
  await db('playlist_songs').where({ playlist_id: id, song_id: songId }).delete();
  if (song) {
    await db('playlists').where({ id }).decrement('total_songs', 1).decrement('total_duration_seconds', song.duration_seconds);
  }
  res.json({ success: true, message: 'Song removed from playlist' });
};

// ── My Playlists ──────────────────────────────────────────────────────────────
export const getMyPlaylists = async (req: AuthRequest, res: Response): Promise<void> => {
  const playlists = await db('playlists')
    .where({ user_id: req.user!.userId, is_active: true })
    .orderBy('updated_at', 'desc');
  res.json({ success: true, data: playlists });
};
