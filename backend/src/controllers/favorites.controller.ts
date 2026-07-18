import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../types';
import { paginate, getPaginationParams } from '../utils/helpers';

// ── Toggle Favorite ───────────────────────────────────────────────────────────
export const toggleFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  const { songId } = req.params;
  const userId = req.user!.userId;

  const song = await db('songs').where({ id: songId, is_active: true }).first();
  if (!song) {
    res.status(404).json({ success: false, message: 'Song not found' });
    return;
  }

  const existing = await db('favorites').where({ user_id: userId, song_id: songId }).first();
  if (existing) {
    await db('favorites').where({ user_id: userId, song_id: songId }).delete();
    await db('songs').where({ id: songId }).decrement('like_count', 1);
    res.json({ success: true, data: { liked: false }, message: 'Removed from favorites' });
  } else {
    await db('favorites').insert({ user_id: userId, song_id: songId });
    await db('songs').where({ id: songId }).increment('like_count', 1);
    res.json({ success: true, data: { liked: true }, message: 'Added to favorites' });
  }
};

// ── Get User Favorites ────────────────────────────────────────────────────────
export const getFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const userId = req.user!.userId;

  const [favorites, [{ count }]] = await Promise.all([
    db('favorites as f')
      .join('songs as s', 'f.song_id', 's.id')
      .leftJoin('artists as ar', 's.artist_id', 'ar.id')
      .leftJoin('albums as al', 's.album_id', 'al.id')
      .where({ 'f.user_id': userId, 's.is_active': true })
      .select('s.*', 'f.created_at as favorited_at', 'ar.name as artist_name', 'ar.avatar_url as artist_avatar', 'al.title as album_title')
      .orderBy('f.created_at', 'desc').limit(limit).offset(offset),
    db('favorites').where({ user_id: userId }).count('* as count'),
  ]);

  res.json({ success: true, ...paginate(favorites.map(s => ({ ...s, is_favorited: true })), parseInt(count as string), page, limit) });
};

// ── Check Favorite ────────────────────────────────────────────────────────────
export const checkFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  const { songId } = req.params;
  const existing = await db('favorites').where({ user_id: req.user!.userId, song_id: songId }).first();
  res.json({ success: true, data: { is_favorited: !!existing } });
};

// ── Listening History ─────────────────────────────────────────────────────────
export const getListeningHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const userId = req.user!.userId;

  const [history, [{ count }]] = await Promise.all([
    db('listening_history as lh')
      .join('songs as s', 'lh.song_id', 's.id')
      .leftJoin('artists as ar', 's.artist_id', 'ar.id')
      .where({ 'lh.user_id': userId, 's.is_active': true })
      .select('s.*', 'lh.played_at', 'lh.play_duration_seconds', 'lh.completed', 'ar.name as artist_name')
      .orderBy('lh.played_at', 'desc').limit(limit).offset(offset),
    db('listening_history').where({ user_id: userId }).countDistinct('song_id as count'),
  ]);

  res.json({ success: true, ...paginate(history, parseInt(count as string), page, limit) });
};

// ── Recently Played (deduplicated) ───────────────────────────────────────────
export const getRecentlyPlayed = async (req: AuthRequest, res: Response): Promise<void> => {
  const { limit = '20' } = req.query as any;
  const userId = req.user!.userId;

  const recentSongs = await db
    .raw(`
      SELECT DISTINCT ON (lh.song_id)
        s.*, ar.name as artist_name, ar.avatar_url as artist_avatar,
        al.title as album_title, al.cover_url as album_cover,
        lh.played_at
      FROM listening_history lh
      JOIN songs s ON lh.song_id = s.id
      LEFT JOIN artists ar ON s.artist_id = ar.id
      LEFT JOIN albums al ON s.album_id = al.id
      WHERE lh.user_id = ? AND s.is_active = true
      ORDER BY lh.song_id, lh.played_at DESC
      LIMIT ?
    `, [userId, parseInt(limit)])
    .then((r) => r.rows);

  res.json({ success: true, data: recentSongs });
};

// ── Record Play (called from frontend on song start) ─────────────────────────
export const recordPlay = async (req: AuthRequest, res: Response): Promise<void> => {
  const { song_id } = req.body;
  if (!song_id) {
    res.status(400).json({ success: false, message: 'song_id required' });
    return;
  }
  const userId = req.user!.userId;
  await db('listening_history').insert({
    user_id: userId,
    song_id,
    ip_address: req.ip,
    device_type: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
  }).catch(() => {}); // non-fatal
  // Increment play count
  await db('songs').where({ id: song_id }).increment('play_count', 1).catch(() => {});
  res.json({ success: true });
};

// ── Recommendations ───────────────────────────────────────────────────────────
export const getRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { limit = '20' } = req.query as any;

  // Simple recommendation: songs from genres the user listens to most
  const topGenres = await db('listening_history as lh')
    .join('songs as s', 'lh.song_id', 's.id')
    .where('lh.user_id', userId)
    .whereNotNull('s.genre_id')
    .select('s.genre_id')
    .groupBy('s.genre_id')
    .orderByRaw('count(*) desc')
    .limit(3)
    .then((rows) => rows.map((r: any) => r.genre_id));

  const listenedIds = await db('listening_history')
    .where({ user_id: userId })
    .distinct('song_id')
    .then((rows) => rows.map((r: any) => r.song_id));

  let songs: any[] = [];
  if (topGenres.length > 0) {
    songs = await db('songs as s')
      .leftJoin('artists as ar', 's.artist_id', 'ar.id')
      .whereIn('s.genre_id', topGenres)
      .whereNotIn('s.id', listenedIds.length > 0 ? listenedIds : ['none'])
      .where('s.is_published', true).where('s.is_active', true)
      .select('s.*', 'ar.name as artist_name', 'ar.avatar_url as artist_avatar')
      .orderBy('s.play_count', 'desc')
      .limit(parseInt(limit));
  }

  // Fallback to trending if no personalised results
  if (songs.length < 10) {
    const trending = await db('songs as s')
      .leftJoin('artists as ar', 's.artist_id', 'ar.id')
      .where('s.is_published', true).where('s.is_active', true)
      .whereNotIn('s.id', [...(listenedIds), ...songs.map((s) => s.id)])
      .select('s.*', 'ar.name as artist_name', 'ar.avatar_url as artist_avatar')
      .orderBy('s.play_count', 'desc')
      .limit(parseInt(limit) - songs.length);
    songs = [...songs, ...trending];
  }

  res.json({ success: true, data: songs });
};
