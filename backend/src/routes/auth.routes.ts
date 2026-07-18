import { Router } from 'express';
import { body } from 'express-validator';
import * as authCtrl from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import { uploadImage } from '../config/storage';

const router = Router();
// Bypass strict AuthRequest ↔ RequestHandler type mismatch at route registration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const r = (fn: any) => fn as any;

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('username').isLength({ min: 3, max: 30 }).matches(/^[a-z0-9_]+$/i).withMessage('Username: 3-30 chars, alphanumeric/underscore'),
    body('display_name').trim().isLength({ min: 1, max: 100 }).withMessage('Display name required'),
  ],
  validate,
  r(authCtrl.register)
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  r(authCtrl.login)
);

router.post('/refresh', r(authCtrl.refreshToken));
router.get('/verify-email', r(authCtrl.verifyEmail));

router.post(
  '/forgot-password',
  authLimiter,
  [body('email').isEmail().normalizeEmail()],
  validate,
  r(authCtrl.forgotPassword)
);

router.post(
  '/reset-password',
  authLimiter,
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  validate,
  r(authCtrl.resetPassword)
);

router.get('/me', r(authenticate), r(authCtrl.getMe));
router.put('/profile', r(authenticate), uploadImage.single('avatar'), r(authCtrl.updateProfile));

// Google OAuth routes
router.get('/google', (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_CALLBACK_URL}&response_type=code&scope=openid%20email%20profile`;
  res.redirect(googleAuthUrl);
});

router.get('/google/callback', r(authCtrl.googleCallback));

export default router;
