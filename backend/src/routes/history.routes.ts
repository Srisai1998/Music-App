import { Router } from 'express';
import * as favCtrl from '../controllers/favorites.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const r = (fn: any) => fn;

router.get('/', r(authenticate), r(favCtrl.getListeningHistory));
router.get('/recent', r(authenticate), r(favCtrl.getRecentlyPlayed));
router.post('/record', r(authenticate), r(favCtrl.recordPlay));

export default router;
