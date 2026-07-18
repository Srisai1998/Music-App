import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../types';
import { paginate, getPaginationParams } from '../utils/helpers';
import { uploadToS3, generateStorageKey } from '../config/storage';

// ── List Ads ──────────────────────────────────────────────────────────────────
export const listAds = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, offset } = getPaginationParams(req.query);
  const { active, type, placement } = req.query as any;
  let query = db('advertisements');
  if (active !== undefined) query = query.where('is_active', active === 'true');
  if (type) query = query.where('ad_type', type);
  if (placement) query = query.where('placement', placement);
  const [ads, [{ count }]] = await Promise.all([
    query.clone().orderBy('created_at', 'desc').limit(limit).offset(offset),
    query.clone().count('* as count'),
  ]);
  res.json({ success: true, ...paginate(ads, parseInt(count as string), page, limit) });
};

// ── Get Active Ad for placement ───────────────────────────────────────────────
export const getActiveAd = async (req: AuthRequest, res: Response): Promise<void> => {
  const { placement = 'home', type } = req.query as any;
  const now = new Date();
  let query = db('advertisements')
    .where('is_active', true)
    .where('placement', placement)
    .where((qb) => qb.whereNull('starts_at').orWhere('starts_at', '<=', now))
    .where((qb) => qb.whereNull('ends_at').orWhere('ends_at', '>=', now));
  if (type) query = query.where('ad_type', type);
  const ad = await query.orderByRaw('RANDOM()').first();
  if (ad) {
    await db('advertisements').where({ id: ad.id }).increment('impression_count', 1);
  }
  res.json({ success: true, data: ad || null });
};

// ── Create Ad (Admin) ─────────────────────────────────────────────────────────
export const createAd = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description, click_url, ad_type, placement, duration_seconds, budget, starts_at, ends_at } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  let image_url: string | undefined;
  let audio_url: string | undefined;
  if (files?.['image']?.[0]) {
    const key = generateStorageKey('ads/images', files['image'][0].originalname);
    image_url = await uploadToS3(files['image'][0].buffer, key, files['image'][0].mimetype);
  }
  if (files?.['audio']?.[0]) {
    const key = generateStorageKey('ads/audio', files['audio'][0].originalname);
    audio_url = await uploadToS3(files['audio'][0].buffer, key, files['audio'][0].mimetype);
  }
  const [ad] = await db('advertisements')
    .insert({ title, description, click_url, ad_type, placement, duration_seconds: parseInt(duration_seconds) || 30, budget, starts_at: starts_at || null, ends_at: ends_at || null, image_url, audio_url })
    .returning('*');
  res.status(201).json({ success: true, data: ad });
};

// ── Track Ad Click ────────────────────────────────────────────────────────────
export const trackAdClick = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await db('advertisements').where({ id }).increment('click_count', 1);
  res.json({ success: true });
};

// ── Toggle Ad Status ──────────────────────────────────────────────────────────
export const toggleAd = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const ad = await db('advertisements').where({ id }).first();
  if (!ad) { res.status(404).json({ success: false, message: 'Ad not found' }); return; }
  const [updated] = await db('advertisements').where({ id }).update({ is_active: !ad.is_active }).returning('*');
  res.json({ success: true, data: updated });
};
