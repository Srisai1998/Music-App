import { Router } from 'express';
import * as favCtrl from '../controllers/favorites.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const r = (fn: any) => fn;

router.post('/:songId', r(authenticate), r(favCtrl.toggleFavorite));
router.get('/', r(authenticate), r(favCtrl.getFavorites));
router.get('/:songId/check', r(authenticate), r(favCtrl.checkFavorite));

export default router;
