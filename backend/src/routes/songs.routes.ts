import { Router } from 'express';
import * as songsCtrl from '../controllers/songs.controller';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware';
import { uploadLimiter, searchLimiter } from '../middleware/rateLimiter.middleware';
import multer from 'multer';

const router = Router();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const r = (fn: any) => fn;

const uploadFields = multer({ storage: multer.memoryStorage() }).fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);

router.get('/', r(optionalAuth), r(songsCtrl.listSongs));
router.get('/trending', r(optionalAuth), r(songsCtrl.getTrending));
router.get('/search', searchLimiter, r(optionalAuth), r(songsCtrl.searchAll));
router.get('/:id', r(optionalAuth), r(songsCtrl.getSong));

router.post('/', r(authenticate), r(requireAdmin), uploadLimiter, uploadFields, r(songsCtrl.createSong));
router.put('/:id', r(authenticate), r(requireAdmin), r(songsCtrl.updateSong));
router.delete('/:id', r(authenticate), r(requireAdmin), r(songsCtrl.deleteSong));

export default router;
