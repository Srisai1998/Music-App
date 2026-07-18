import { Router } from 'express';
import * as playlistsCtrl from '../controllers/playlists.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { uploadImage } from '../config/storage';

const router = Router();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const r = (fn: any) => fn;

router.get('/', r(optionalAuth), r(playlistsCtrl.listPlaylists));
router.get('/my', r(authenticate), r(playlistsCtrl.getMyPlaylists));
router.get('/:id', r(optionalAuth), r(playlistsCtrl.getPlaylist));
router.post('/', r(authenticate), uploadImage.single('cover'), r(playlistsCtrl.createPlaylist));
router.put('/:id', r(authenticate), uploadImage.single('cover'), r(playlistsCtrl.updatePlaylist));
router.delete('/:id', r(authenticate), r(playlistsCtrl.deletePlaylist));
router.post('/:id/songs', r(authenticate), r(playlistsCtrl.addSongToPlaylist));
router.delete('/:id/songs/:songId', r(authenticate), r(playlistsCtrl.removeSongFromPlaylist));

export default router;
