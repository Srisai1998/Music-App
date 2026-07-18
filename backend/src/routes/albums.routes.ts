import { Router } from 'express';
import * as artistsCtrl from '../controllers/artists.controller';

const router = Router();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const r = (fn: any) => fn;

router.get('/', r(artistsCtrl.listAlbums));
router.get('/:id', r(artistsCtrl.getAlbum));

export default router;
