import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../types';
import { paginate, getPaginationParams, generateUniqueSlug, toSlug } from '../utils/helpers';
import { getCache, setCache, deleteCache } from '../config/redis';
import { uploadToS3, generateStorageKey } from '../config/storage';

const withArtistAndAlbum = () =>
  db('songs as s')
    .leftJoin('artists as ar', 's.artist_id', 'ar.id')
    .leftJoin('albums as al', 's.album_id', 'al.id')
    .leftJoin('genres as g', 's.genre_id', 'g.id')
    .select(
      's.*',
      'ar.name as artist_name',
      'ar.slug as artist_slug',
      'ar.avatar_url as artist_avatar',
      'al.title as album_title',
      'al.cover_url as album_cover',
      'g.name as genre_name'
    );

// ── List Songs ────────────────────────────────────────────────────────────────
export const listSongs = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { search, genre_id, artist_id, sort = 'play_count', order = 'desc' } = req.query as any;

  const cacheKey = `songs:${JSON.stringify(req.query)}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json(JSON.parse(cached));
    return;
  }

  let query = withArtistAndAlbum().where('s.is_published', true).where('s.is_active', true);
  if (search) {
    query = query.whereRaw(
      `to_tsvector('english', s.title) @@ plainto_tsquery('english', ?)`,
      [search]
    );
  }
  if (genre_id) query = query.where('s.genre_id', genre_id);
  if (artist_id) query = query.where('s.artist_id', artist_id);

  const countQuery = db('songs as s').where('s.is_published', true).where('s.is_active', true);
  if (search) countQuery.whereRaw(`to_tsvector('english', s.title) @@ plainto_tsquery('english', ?)`, [search]);
  if (genre_id) countQuery.where('s.genre_id', genre_id);
  if (artist_id) countQuery.where('s.artist_id', artist_id);

  const [songs, [{ count }]] = await Promise.all([
    query.orderBy(`s.${sort}`, order).limit(limit).offset(offset),
    countQuery.count('* as count'),
  ]);

  // Attach favorites if user is authenticated
  let favoritedIds = new Set<string>();
  if (req.user) {
    const favs = await db('favorites').where({ user_id: req.user.userId }).select('song_id');
    favoritedIds = new Set(favs.map((f) => f.song_id));
  }

  const enriched = songs.map((s) => ({ ...s, is_favorited: favoritedIds.has(s.id) }));
  const result = { success: true, ...paginate(enriched, parseInt(count as string), page, limit) };
  await setCache(cacheKey, JSON.stringify(result), 60);
  res.json(result);
};

// ── Get Single Song ───────────────────────────────────────────────────────────
export const getSong = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const song = await withArtistAndAlbum()
    .where('s.id', id)
    .orWhere('s.slug', id)
    .first();
  if (!song) {
    res.status(404).json({ success: false, message: 'Song not found' });
    return;
  }
  // Increment play count asynchronously
  db('songs').where({ id: song.id }).increment('play_count', 1).catch(() => {});
  // Log listening history if user authenticated
  if (req.user) {
    db('listening_history')
      .insert({
        user_id: req.user.userId,
        song_id: song.id,
        ip_address: req.ip,
        device_type: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
      })
      .catch(() => {});
  }
  res.json({ success: true, data: song });
};

// ── Create Song (Admin) ───────────────────────────────────────────────────────
export const createSong = async (req: AuthRequest, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const audioFile = files?.['audio']?.[0];
  const coverFile = files?.['cover']?.[0];

  if (!audioFile) {
    res.status(400).json({ success: false, message: 'Audio file is required' });
    return;
  }

  const {
    title, artist_id, album_id, genre_id, duration_seconds,
    track_number, language, lyrics, is_downloadable,
    is_premium, tags, audio_quality,
  } = req.body;

  const audioKey = generateStorageKey('audio', audioFile.originalname);
  const audioUrl = await uploadToS3(audioFile.buffer, audioKey, audioFile.mimetype);

  let coverUrl: string | undefined;
  if (coverFile) {
    const coverKey = generateStorageKey('covers/songs', coverFile.originalname);
    coverUrl = await uploadToS3(coverFile.buffer, coverKey, coverFile.mimetype);
  }

  const slug = await generateUniqueSlug(title, async (s) => {
    const exists = await db('songs').where({ slug: s }).first();
    return !!exists;
  });

  const [song] = await db('songs')
    .insert({
      title: title.trim(),
      slug,
      artist_id,
      album_id: album_id || null,
      genre_id: genre_id || null,
      audio_url: audioUrl,
      cover_url: coverUrl || null,
      duration_seconds: parseInt(duration_seconds) || 0,
      track_number: track_number ? parseInt(track_number) : null,
      language: language || null,
      lyrics: lyrics || null,
      is_downloadable: is_downloadable !== 'false',
      is_premium: is_premium === 'true',
      tags: JSON.stringify(tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : []),
      audio_quality: audio_quality || 'standard',
      file_size_bytes: audioFile.size,
      is_published: true,
    })
    .returning('*');

  await deleteCache(`songs:*`);
  res.status(201).json({ success: true, message: 'Song uploaded successfully', data: song });
};

// ── Update Song ───────────────────────────────────────────────────────────────
export const updateSong = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const existing = await db('songs').where({ id }).first();
  if (!existing) {
    res.status(404).json({ success: false, message: 'Song not found' });
    return;
  }
  const allowedFields = [
    'title', 'album_id', 'genre_id', 'duration_seconds',
    'track_number', 'language', 'lyrics', 'is_downloadable',
    'is_premium', 'is_sponsored', 'is_published', 'tags',
  ];
  const updateData: Record<string, any> = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updateData[f] = req.body[f];
  });
  updateData.updated_at = db.fn.now();
  const [song] = await db('songs').where({ id }).update(updateData).returning('*');
  res.json({ success: true, data: song });
};

// ── Delete Song ───────────────────────────────────────────────────────────────
export const deleteSong = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const song = await db('songs').where({ id }).first();
  if (!song) {
    res.status(404).json({ success: false, message: 'Song not found' });
    return;
  }
  await db('songs').where({ id }).update({ is_active: false });
  res.json({ success: true, message: 'Song deleted successfully' });
};

// ── Trending Songs ─────────────────────────────────────────────────────────────
export const getTrending = async (req: AuthRequest, res: Response): Promise<void> => {
  const { limit = '20' } = req.query as any;
  const cacheKey = `songs:trending:${limit}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    res.json(JSON.parse(cached));
    return;
  }
  const songs = await withArtistAndAlbum()
    .where('s.is_published', true)
    .where('s.is_active', true)
    .orderBy('s.play_count', 'desc')
    .limit(parseInt(limit));
  const result = { success: true, data: songs };
  await setCache(cacheKey, JSON.stringify(result), 300);
  res.json(result);
};

// ── Search ────────────────────────────────────────────────────────────────────
export const searchAll = async (req: AuthRequest, res: Response): Promise<void> => {
  const { q } = req.query as { q: string };
  if (!q || q.length < 2) {
    res.json({ success: true, data: { songs: [], artists: [], albums: [], playlists: [] } });
    return;
  }

  const tsQuery = `plainto_tsquery('english', ?)`;
  const [songs, artists, albums, playlists] = await Promise.all([
    db('songs as s')
      .leftJoin('artists as ar', 's.artist_id', 'ar.id')
      .whereRaw(`to_tsvector('english', s.title) @@ ${tsQuery}`, [q])
      .where('s.is_published', true).where('s.is_active', true)
      .select('s.*', 'ar.name as artist_name', 'ar.avatar_url as artist_avatar')
      .limit(10),
    db('artists')
      .whereRaw(`to_tsvector('english', name) @@ ${tsQuery}`, [q])
      .where('is_active', true).limit(5),
    db('albums as al')
      .leftJoin('artists as ar', 'al.artist_id', 'ar.id')
      .whereRaw(`to_tsvector('english', al.title) @@ ${tsQuery}`, [q])
      .where('al.is_published', true).where('al.is_active', true)
      .select('al.*', 'ar.name as artist_name').limit(5),
    db('playlists')
      .whereILike('name', `%${q}%`)
      .where('visibility', 'public').where('is_active', true).limit(5),
  ]);

  res.json({ success: true, data: { songs, artists, albums, playlists } });
};
