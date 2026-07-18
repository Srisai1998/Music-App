import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../types';

// ── Dashboard Overview ────────────────────────────────────────────────────────
export const getDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  const [
    totalUsers,
    totalSongs,
    totalArtists,
    totalAlbums,
    premiumUsers,
    totalRevenue,
    topSongs,
    topArtists,
    recentUsers,
    adStats,
  ] = await Promise.all([
    db('users').count('* as count').first(),
    db('songs').where({ is_active: true }).count('* as count').first(),
    db('artists').where({ is_active: true }).count('* as count').first(),
    db('albums').where({ is_active: true }).count('* as count').first(),
    db('users').whereIn('subscription_type', ['monthly', 'yearly']).count('* as count').first(),
    db('subscriptions').where({ status: 'active' }).sum('amount as total').first(),
    db('songs as s')
      .leftJoin('artists as ar', 's.artist_id', 'ar.id')
      .where('s.is_active', true)
      .select('s.id', 's.title', 's.play_count', 's.like_count', 'ar.name as artist_name', 's.cover_url')
      .orderBy('s.play_count', 'desc').limit(10),
    db('artists').where({ is_active: true }).orderBy('monthly_listeners', 'desc').limit(10),
    db('users').orderBy('created_at', 'desc').limit(10)
      .select('id', 'display_name', 'email', 'subscription_type', 'created_at', 'avatar_url'),
    db('advertisements').select(
      db.raw('SUM(impression_count) as total_impressions'),
      db.raw('SUM(click_count) as total_clicks'),
      db.raw('COUNT(*) as total_ads'),
      db.raw('SUM(spent) as total_ad_revenue')
    ).first(),
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        total_users: parseInt(totalUsers?.count as string),
        total_songs: parseInt(totalSongs?.count as string),
        total_artists: parseInt(totalArtists?.count as string),
        total_albums: parseInt(totalAlbums?.count as string),
        premium_users: parseInt(premiumUsers?.count as string),
        total_revenue: parseFloat(totalRevenue?.total as string) || 0,
      },
      top_songs: topSongs,
      top_artists: topArtists,
      recent_users: recentUsers,
      ad_stats: adStats,
    },
  });
};

// ── User Analytics ─────────────────────────────────────────────────────────────
export const getUserAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  const { days = '30' } = req.query as any;
  const since = new Date(Date.now() - parseInt(days) * 24 * 3600 * 1000);

  const [userGrowth, activeUsers, topCountries] = await Promise.all([
    db('users')
      .where('created_at', '>=', since)
      .select(db.raw("DATE(created_at) as date"), db.raw('COUNT(*) as count'))
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date', 'asc'),
    db('listening_history')
      .where('played_at', '>=', since)
      .countDistinct('user_id as count').first(),
    db('users')
      .select('preferences')
      .count('* as count')
      .groupBy('preferences')
      .orderBy('count', 'desc')
      .limit(10),
  ]);

  res.json({ success: true, data: { user_growth: userGrowth, active_users: activeUsers?.count || 0 } });
};

// ── Song Analytics ─────────────────────────────────────────────────────────────
export const getSongAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  const { days = '30' } = req.query as any;
  const since = new Date(Date.now() - parseInt(days) * 24 * 3600 * 1000);

  const [playTrends, topGenres, topLanguages] = await Promise.all([
    db('listening_history')
      .where('played_at', '>=', since)
      .select(db.raw("DATE(played_at) as date"), db.raw('COUNT(*) as plays'))
      .groupBy(db.raw('DATE(played_at)'))
      .orderBy('date', 'asc'),
    db('songs as s')
      .join('genres as g', 's.genre_id', 'g.id')
      .where('s.is_active', true)
      .select('g.name', db.raw('SUM(s.play_count) as total_plays'))
      .groupBy('g.name').orderBy('total_plays', 'desc').limit(10),
    db('songs')
      .whereNotNull('language')
      .select('language', db.raw('SUM(play_count) as total_plays'))
      .groupBy('language').orderBy('total_plays', 'desc').limit(10),
  ]);

  res.json({ success: true, data: { play_trends: playTrends, top_genres: topGenres, top_languages: topLanguages } });
};

// ── Revenue Analytics ─────────────────────────────────────────────────────────
export const getRevenueAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  const { days = '30' } = req.query as any;
  const since = new Date(Date.now() - parseInt(days) * 24 * 3600 * 1000);

  const [revenueTrends, planBreakdown] = await Promise.all([
    db('subscriptions')
      .where('created_at', '>=', since)
      .select(db.raw("DATE(created_at) as date"), db.raw('SUM(amount) as revenue'), db.raw('COUNT(*) as subs'))
      .groupBy(db.raw('DATE(created_at)')).orderBy('date', 'asc'),
    db('subscriptions')
      .where({ status: 'active' })
      .select('plan', db.raw('COUNT(*) as count'), db.raw('SUM(amount) as revenue'))
      .groupBy('plan'),
  ]);

  res.json({ success: true, data: { revenue_trends: revenueTrends, plan_breakdown: planBreakdown } });
};

// ── Manage Users (Admin) ──────────────────────────────────────────────────────
export const manageUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = 1, limit = 20, search } = req.query as any;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let query = db('users').select('id', 'email', 'username', 'display_name', 'role', 'subscription_type', 'is_active', 'is_verified', 'created_at', 'avatar_url');
  if (search) query = query.whereILike('email', `%${search}%`).orWhereILike('username', `%${search}%`).orWhereILike('display_name', `%${search}%`);
  const [users, [{ count }]] = await Promise.all([
    query.clone().orderBy('created_at', 'desc').limit(parseInt(limit)).offset(offset),
    db('users').count('* as count'),
  ]);
  res.json({ success: true, data: users, pagination: { total: parseInt(count as string), page: parseInt(page), limit: parseInt(limit) } });
};

// ── Toggle User Active Status ─────────────────────────────────────────────────
export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  if (userId === req.user!.userId) {
    res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
    return;
  }
  const user = await db('users').where({ id: userId }).first();
  if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
  const [updated] = await db('users').where({ id: userId }).update({ is_active: !user.is_active }).returning(['id', 'email', 'is_active']);
  res.json({ success: true, data: updated });
};
