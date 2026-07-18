import { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { generateTokens, verifyRefreshToken } from '../middleware/auth.middleware';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { sanitizeUser, toSlug } from '../utils/helpers';
import { AuthRequest } from '../types';

// ── Register ──────────────────────────────────────────────────────────────────
export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, username, display_name } = req.body;

  const existing = await db('users').where({ email }).orWhere({ username }).first();
  if (existing) {
    res.status(409).json({ success: false, message: 'Email or username already taken' });
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const verification_token = crypto.randomBytes(32).toString('hex');

  const [user] = await db('users')
    .insert({
      email: email.toLowerCase().trim(),
      username: username.toLowerCase().trim(),
      display_name: display_name.trim(),
      password_hash,
      verification_token,
      is_verified: false,
    })
    .returning('*');

  await sendVerificationEmail(user.email, verification_token).catch(() => {});

  const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });
  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
    data: { user: sanitizeUser(user), ...tokens },
  });
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await db('users').where({ email: email.toLowerCase().trim() }).first();
  if (!user || !user.password_hash) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  if (!user.is_active) {
    res.status(403).json({ success: false, message: 'Account is suspended' });
    return;
  }

  const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });
  res.json({
    success: true,
    message: 'Login successful',
    data: { user: sanitizeUser(user), ...tokens },
  });
};

// ── Google OAuth Callback ─────────────────────────────────────────────────────
export const googleCallback = async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = (req as any).googleProfile;
  const { id: google_id, emails, displayName, photos } = profile;
  const email = emails?.[0]?.value?.toLowerCase().trim();
  const avatar_url = photos?.[0]?.value;

  let user = await db('users').where({ google_id }).orWhere({ email }).first();

  if (!user) {
    const username = `${toSlug(displayName)}_${uuidv4().slice(0, 6)}`;
    [user] = await db('users')
      .insert({
        email,
        username,
        display_name: displayName,
        google_id,
        avatar_url,
        auth_provider: 'google',
        is_verified: true,
      })
      .returning('*');
  } else if (!user.google_id) {
    await db('users').where({ id: user.id }).update({ google_id, auth_provider: 'google' });
    user = { ...user, google_id, auth_provider: 'google' };
  }

  const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });
  // Redirect to frontend with tokens
  res.redirect(
    `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
  );
};

// ── Refresh Token ─────────────────────────────────────────────────────────────
export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken: token } = req.body;
  if (!token) {
    res.status(401).json({ success: false, message: 'Refresh token required' });
    return;
  }
  const payload = verifyRefreshToken(token);
  const user = await db('users').where({ id: payload.userId }).first();
  if (!user || !user.is_active) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
    return;
  }
  const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });
  res.json({ success: true, data: tokens });
};

// ── Verify Email ──────────────────────────────────────────────────────────────
export const verifyEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  const { token } = req.query as { token: string };
  const user = await db('users').where({ verification_token: token }).first();
  if (!user) {
    res.status(400).json({ success: false, message: 'Invalid verification token' });
    return;
  }
  await db('users')
    .where({ id: user.id })
    .update({ is_verified: true, verification_token: null });
  res.json({ success: true, message: 'Email verified successfully' });
};

// ── Forgot Password ───────────────────────────────────────────────────────────
export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.body;
  const user = await db('users').where({ email: email.toLowerCase() }).first();
  if (!user) {
    // Return success to prevent email enumeration
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    return;
  }
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour
  await db('users').where({ id: user.id }).update({
    reset_password_token: token,
    reset_password_expires: expires,
  });

  // Always send email (will use Ethereal in dev, real SMTP in prod)
  await sendPasswordResetEmail(user.email, token).catch(() => {});

  // In development: return the reset URL directly in the API response
  // so developers can test without configuring email
  const isDev = process.env.NODE_ENV !== 'production';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  res.json({
    success: true,
    message: 'If that email exists, a reset link has been sent.',
    ...(isDev && {
      dev_reset_url: resetUrl,
      dev_note: 'DEV MODE: Use this URL directly to reset password (email not required)',
    }),
  });
};

// ── Reset Password ────────────────────────────────────────────────────────────
export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { token, password } = req.body;
  const user = await db('users')
    .where({ reset_password_token: token })
    .andWhere('reset_password_expires', '>', new Date())
    .first();
  if (!user) {
    res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    return;
  }
  const password_hash = await bcrypt.hash(password, 12);
  await db('users').where({ id: user.id }).update({
    password_hash,
    reset_password_token: null,
    reset_password_expires: null,
  });
  res.json({ success: true, message: 'Password reset successfully' });
};

// ── Get Current User ──────────────────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await db('users').where({ id: req.user!.userId }).first();
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({ success: true, data: sanitizeUser(user) });
};

// ── Update Profile ─────────────────────────────────────────────────────────────
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { display_name, preferences } = req.body;
  const updateData: Record<string, any> = {};
  if (display_name) updateData.display_name = display_name.trim();
  if (preferences) updateData.preferences = JSON.stringify(preferences);
  if (req.file) {
    const { uploadToS3, generateStorageKey } = await import('../config/storage');
    const key = generateStorageKey('avatars', req.file.originalname);
    updateData.avatar_url = await uploadToS3(req.file.buffer, key, req.file.mimetype);
  }
  const [user] = await db('users')
    .where({ id: req.user!.userId })
    .update({ ...updateData, updated_at: db.fn.now() })
    .returning('*');
  res.json({ success: true, data: sanitizeUser(user) });
};
