import { Router } from 'express';
import * as artistsCtrl from '../controllers/artists.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import multer from 'multer';

const router = Router();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const r = (fn: any) => fn;

const uploadFields = multer({ storage: multer.memoryStorage() }).fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);

router.get('/', r(artistsCtrl.listArtists));
router.get('/:id', r(artistsCtrl.getArtist));
router.post('/', r(authenticate), r(requireAdmin), uploadFields, r(artistsCtrl.createArtist));
router.post('/:id/follow', r(authenticate), r(artistsCtrl.toggleFollowArtist));
router.get('/:id/albums', r(artistsCtrl.listAlbums));

export default router;
