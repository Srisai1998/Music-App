import slugify from 'slugify';
import { PaginatedResponse } from '../types';

export const toSlug = (text: string): string =>
  slugify(text, { lower: true, strict: true, replacement: '-' });

export const paginate = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});

export const getPaginationParams = (query: Record<string, any>) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const sanitizeUser = (user: Record<string, any>) => {
  const { password_hash, verification_token, reset_password_token, ...safe } = user;
  return safe;
};

export const parseTagsArray = (tags: any): string[] => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') {
    try { return JSON.parse(tags); } catch { return []; }
  }
  return [];
};

export const isSubscriptionActive = (user: { subscription_type: string; subscription_expires_at?: Date | null }): boolean => {
  if (user.subscription_type === 'free') return false;
  if (!user.subscription_expires_at) return false;
  return new Date(user.subscription_expires_at) > new Date();
};

export const generateUniqueSlug = async (
  base: string,
  checkFn: (slug: string) => Promise<boolean>
): Promise<string> => {
  let slug = toSlug(base);
  let exists = await checkFn(slug);
  let counter = 1;
  while (exists) {
    slug = `${toSlug(base)}-${counter}`;
    exists = await checkFn(slug);
    counter++;
  }
  return slug;
};
