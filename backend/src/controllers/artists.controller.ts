import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../types';
import { paginate, getPaginationParams, generateUniqueSlug } from '../utils/helpers';
import { uploadToS3, generateStorageKey } from '../config/storage';
import { getCache, setCache } from '../config/redis';

// ── List Artists ──────────────────────────────────────────────────────────────
export const listArtists = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { search, featured } = req.query as any;

  let query = db('artists').where('is_active', true);
  if (search) query = query.whereILike('name', `%${search}%`);
  if (featured === 'true') query = query.where('is_featured', true);

  const [artists, [{ count }]] = await Promise.all([
    query.clone().orderBy('monthly_listeners', 'desc').limit(limit).offset(offset),
    query.clone().count('* as count'),
  ]);
  res.json({ success: true, ...paginate(artists, parseInt(count as string), page, limit) });
};

// ── Get Artist ────────────────────────────────────────────────────────────────
export const getArtist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const cacheKey = `artist:${id}`;
  const cached = await getCache(cacheKey);
  if (cached) { res.json(JSON.parse(cached)); return; }

  const artist = await db('artists').where('id', id).orWhere('slug', id).first();
  if (!artist) { res.status(404).json({ success: false, message: 'Artist not found' }); return; }

  const [songs, albums, followerCount] = await Promise.all([
    db('songs as s')
      .leftJoin('albums as al', 's.album_id', 'al.id')
      .where({ 's.artist_id': artist.id, 's.is_published': true, 's.is_active': true })
      .select('s.*', 'al.title as album_title', 'al.cover_url as album_cover')
      .orderBy('s.play_count', 'desc').limit(20),
    db('albums').where({ artist_id: artist.id, is_published: true, is_active: true }).orderBy('release_date', 'desc'),
    db('artist_follows').where({ artist_id: artist.id }).count('* as count').first(),
  ]);

  const result = { success: true, data: { ...artist, songs, albums, follower_count: followerCount?.count || 0 } };
  await setCache(cacheKey, JSON.stringify(result), 120);
  res.json(result);
};

// ── Create Artist (Admin) ─────────────────────────────────────────────────────
export const createArtist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, bio, country, website, social_links } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const slug = await generateUniqueSlug(name, async (s) => !!(await db('artists').where({ slug: s }).first()));

  let avatar_url: string | undefined;
  let cover_url: string | undefined;
  if (files?.['avatar']?.[0]) {
    const key = generateStorageKey('artists/avatars', files['avatar'][0].originalname);
    avatar_url = await uploadToS3(files['avatar'][0].buffer, key, files['avatar'][0].mimetype);
  }
  if (files?.['cover']?.[0]) {
    const key = generateStorageKey('artists/covers', files['cover'][0].originalname);
    cover_url = await uploadToS3(files['cover'][0].buffer, key, files['cover'][0].mimetype);
  }

  const [artist] = await db('artists')
    .insert({ name: name.trim(), slug, bio, country, website, avatar_url, cover_url, social_links: JSON.stringify(social_links || {}) })
    .returning('*');
  res.status(201).json({ success: true, data: artist });
};

// ── Follow/Unfollow Artist ────────────────────────────────────────────────────
export const toggleFollowArtist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const existing = await db('artist_follows').where({ user_id: userId, artist_id: id }).first();
  if (existing) {
    await db('artist_follows').where({ user_id: userId, artist_id: id }).delete();
    await db('artists').where({ id }).decrement('monthly_listeners', 1);
    res.json({ success: true, followed: false });
  } else {
    await db('artist_follows').insert({ user_id: userId, artist_id: id });
    await db('artists').where({ id }).increment('monthly_listeners', 1);
    res.json({ success: true, followed: true });
  }
};

// ── List Albums ───────────────────────────────────────────────────────────────
export const listAlbums = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { artist_id, genre_id } = req.query as any;
  let query = db('albums as al').leftJoin('artists as ar', 'al.artist_id', 'ar.id')
    .where('al.is_published', true).where('al.is_active', true)
    .select('al.*', 'ar.name as artist_name', 'ar.slug as artist_slug', 'ar.avatar_url as artist_avatar');
  if (artist_id) query = query.where('al.artist_id', artist_id);
  if (genre_id) query = query.where('al.genre_id', genre_id);
  const [albums, [{ count }]] = await Promise.all([
    query.clone().orderBy('al.release_date', 'desc').limit(limit).offset(offset),
    db('albums').where('is_published', true).where('is_active', true).count('* as count'),
  ]);
  res.json({ success: true, ...paginate(albums, parseInt(count as string), page, limit) });
};

// ── Get Album ─────────────────────────────────────────────────────────────────
export const getAlbum = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const album = await db('albums as al')
    .leftJoin('artists as ar', 'al.artist_id', 'ar.id')
    .where('al.id', id).orWhere('al.slug', id)
    .select('al.*', 'ar.name as artist_name', 'ar.avatar_url as artist_avatar').first();
  if (!album) { res.status(404).json({ success: false, message: 'Album not found' }); return; }
  const songs = await db('songs as s')
    .where({ 's.album_id': album.id, 's.is_published': true, 's.is_active': true })
    .orderBy('s.track_number', 'asc');
  res.json({ success: true, data: { ...album, songs } });
};
