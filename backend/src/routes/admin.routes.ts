import { Router, Request, Response, NextFunction } from 'express';
import * as adminCtrl from '../controllers/admin.controller';
import * as adsCtrl from '../controllers/ads.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { AuthRequest } from '../types';
import multer from 'multer';

// Cast AuthRequest handlers to standard Express RequestHandler to satisfy Router typings
type H = (req: Request, res: Response, next?: NextFunction) => any;
const h = (fn: (req: AuthRequest, res: Response) => any): H =>
  (req, res) => fn(req as AuthRequest, res);

const router = Router();
router.use(authenticate as H);
router.use(requireAdmin as H);

const upload = multer({ storage: multer.memoryStorage() });
const adUpload = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }]);

// Dashboard & analytics
router.get('/dashboard', h(adminCtrl.getDashboard));
router.get('/analytics/users', h(adminCtrl.getUserAnalytics));
router.get('/analytics/songs', h(adminCtrl.getSongAnalytics));
router.get('/analytics/revenue', h(adminCtrl.getRevenueAnalytics));

// User management
router.get('/users', h(adminCtrl.manageUsers));
router.patch('/users/:userId/status', h(adminCtrl.toggleUserStatus));

// Ads management
router.get('/ads', h(adsCtrl.listAds));
router.post('/ads', adUpload, h(adsCtrl.createAd));
router.patch('/ads/:id/toggle', h(adsCtrl.toggleAd));
router.post('/ads/:id/click', h(adsCtrl.trackAdClick));

export default router;
