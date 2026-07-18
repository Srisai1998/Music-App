import { Request } from 'express';

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ── User ──────────────────────────────────────────────────────────────────────
export type UserRole = 'user' | 'admin' | 'artist';
export type AuthProvider = 'local' | 'google';
export type SubscriptionType = 'free' | 'monthly' | 'yearly';

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  password_hash?: string;
  avatar_url?: string;
  role: UserRole;
  auth_provider: AuthProvider;
  google_id?: string;
  is_verified: boolean;
  is_active: boolean;
  subscription_type: SubscriptionType;
  subscription_expires_at?: Date;
  stripe_customer_id?: string;
  preferences: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// ── Artist ────────────────────────────────────────────────────────────────────
export interface Artist {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  website?: string;
  social_links: Record<string, string>;
  country?: string;
  monthly_listeners: number;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  user_id?: string;
  created_at: Date;
  updated_at: Date;
}

// ── Genre ─────────────────────────────────────────────────────────────────────
export interface Genre {
  id: string;
  name: string;
  slug: string;
  color?: string;
  cover_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ── Album ─────────────────────────────────────────────────────────────────────
export type AlbumType = 'album' | 'single' | 'ep' | 'compilation';

export interface Album {
  id: string;
  title: string;
  slug: string;
  artist_id: string;
  description?: string;
  cover_url?: string;
  album_type: AlbumType;
  release_date?: Date;
  label?: string;
  genre_id?: string;
  total_tracks: number;
  is_published: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ── Song ──────────────────────────────────────────────────────────────────────
export interface Song {
  id: string;
  title: string;
  slug: string;
  artist_id: string;
  album_id?: string;
  genre_id?: string;
  audio_url: string;
  audio_url_hq?: string;
  cover_url?: string;
  duration_seconds: number;
  track_number?: number;
  language?: string;
  lyrics?: string;
  play_count: number;
  like_count: number;
  download_count: number;
  is_published: boolean;
  is_active: boolean;
  is_downloadable: boolean;
  is_premium: boolean;
  is_sponsored: boolean;
  tags: string[];
  file_size_bytes?: number;
  audio_quality: string;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  artist_name?: string;
  album_title?: string;
  genre_name?: string;
  is_favorited?: boolean;
  is_downloaded?: boolean;
}

// ── Playlist ──────────────────────────────────────────────────────────────────
export type PlaylistVisibility = 'public' | 'private' | 'collaborative';

export interface Playlist {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cover_url?: string;
  user_id: string;
  visibility: PlaylistVisibility;
  is_featured: boolean;
  is_sponsored: boolean;
  total_songs: number;
  total_duration_seconds: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  // Joined
  owner_name?: string;
  owner_avatar?: string;
  songs?: Song[];
}

// ── Advertisement ─────────────────────────────────────────────────────────────
export type AdType = 'banner' | 'interstitial' | 'rewarded' | 'audio';
export type AdPlacement = 'home' | 'player' | 'search' | 'playlist';

export interface Advertisement {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  audio_url?: string;
  click_url?: string;
  ad_type: AdType;
  placement: AdPlacement;
  is_active: boolean;
  duration_seconds: number;
  impression_count: number;
  click_count: number;
  starts_at?: Date;
  ends_at?: Date;
  budget?: number;
  spent: number;
  created_at: Date;
  updated_at: Date;
}

// ── Subscription ──────────────────────────────────────────────────────────────
export interface Subscription {
  id: string;
  user_id: string;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'paused';
  stripe_subscription_id?: string;
  amount: number;
  currency: string;
  starts_at: Date;
  expires_at: Date;
  cancelled_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ── API Response ──────────────────────────────────────────────────────────────
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}
