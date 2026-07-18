import { Router, Request, Response } from 'express';
import https from 'https';
import http from 'http';
import db from '../config/database';

const router = Router();

/**
 * GET /api/stream/:songId
 *
 * Server-side audio proxy. Fetches the audio file from the song's audio_url
 * and pipes it through to the browser with the correct headers.
 * This eliminates all CORS issues — the browser talks to our own backend.
 * Supports byte-range requests for seeking.
 */
router.get('/:songId', async (req: Request, res: Response) => {
  const { songId } = req.params;

  const song = await db('songs').where({ id: songId, is_active: true }).first();
  if (!song) {
    res.status(404).json({ success: false, message: 'Song not found' });
    return;
  }

  const audioUrl: string = song.audio_url_hq || song.audio_url;
  if (!audioUrl) {
    res.status(404).json({ success: false, message: 'No audio URL for this song' });
    return;
  }

  // Forward Range header for seeking support
  const rangeHeader = req.headers['range'];
  const upstreamHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (compatible; MusicApp/1.0)',
    'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
  };
  if (rangeHeader) upstreamHeaders['Range'] = rangeHeader;

  const protocol = audioUrl.startsWith('https') ? https : http;
  const upstreamReq = protocol.get(audioUrl, { headers: upstreamHeaders }, (upstream) => {
    // Follow redirect (301/302)
    if (upstream.statusCode === 301 || upstream.statusCode === 302) {
      const location = upstream.headers.location;
      if (location) {
        res.redirect(307, `/api/stream/${songId}?_r=${Date.now()}`);
        // Re-resolve by updating the song URL (non-blocking)
        db('songs').where({ id: songId }).update({ audio_url: location }).catch(() => {});
      } else {
        res.status(502).json({ success: false, message: 'Bad redirect from upstream' });
      }
      return;
    }

    const statusCode = upstream.statusCode || 200;
    const contentType = upstream.headers['content-type'] || 'audio/mpeg';
    const contentLength = upstream.headers['content-length'];
    const contentRange = upstream.headers['content-range'];
    const acceptRanges = upstream.headers['accept-ranges'];

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
    else res.setHeader('Accept-Ranges', 'bytes');

    res.status(statusCode);
    upstream.pipe(res);

    upstream.on('error', (err) => {
      if (!res.headersSent) {
        res.status(502).json({ success: false, message: 'Upstream audio error' });
      }
    });
  });

  upstreamReq.on('error', (err) => {
    if (!res.headersSent) {
      res.status(502).json({ success: false, message: 'Failed to fetch audio' });
    }
  });

  req.on('close', () => upstreamReq.destroy());
});

export default router;
