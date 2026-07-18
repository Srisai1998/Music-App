import axios from 'axios';
import db from '../config/database';
import { toSlug, generateUniqueSlug } from '../utils/helpers';

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID;
const JAMENDO_API = 'https://api.jamendo.com/v3.0';
const TRACK_LIMIT = parseInt(process.env.JAMENDO_SYNC_LIMIT || '60');

interface JamendoTrack {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  album_name: string;
  album_image: string;
  image: string;
  audio: string;
  musicinfo?: { tags?: { genres?: string[] } };
}

async function fetchTracks(limit: number): Promise<JamendoTrack[]> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const { data } = await axios.get(`${JAMENDO_API}/tracks/`, {
      params: {
        client_id: JAMENDO_CLIENT_ID,
        format: 'json',
        limit,
        order: 'popularity_total',
        include: 'musicinfo',
        audioformat: 'mp32',
      },
    });
    if (data.results.length > 0) return data.results;
    console.log(`  (attempt ${attempt}: Jamendo returned 0 results, retrying...)`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  return [];
}

async function upsertArtist(name: string): Promise<string> {
  const cleanName = name?.trim() || 'Unknown Artist';
  const slug = await generateUniqueSlug(cleanName, async (s) => {
    const existing = await db('artists').where({ slug: s }).first();
    return !!existing && existing.name !== cleanName;
  });
  const existing = await db('artists').where({ name: cleanName }).first();
  if (existing) return existing.id;
  const [a] = await db('artists').insert({ name: cleanName, slug, is_active: true }).returning('*');
  return a.id;
}

async function upsertGenre(name?: string): Promise<string | null> {
  if (!name) return null;
  const slug = toSlug(name);
  const existing = await db('genres').where({ slug }).first();
  if (existing) return existing.id;
  const [g] = await db('genres').insert({ name, slug }).returning('*');
  return g.id;
}

async function main(): Promise<void> {
  if (!JAMENDO_CLIENT_ID) {
    console.error('❌ JAMENDO_CLIENT_ID missing in backend/.env');
    process.exit(1);
  }

  console.log(`🎧 Fetching ${TRACK_LIMIT} tracks from Jamendo...`);
  const tracks = await fetchTracks(TRACK_LIMIT);
  console.log(`Fetched ${tracks.length} tracks`);

  let inserted = 0;
  let skipped = 0;

  for (const t of tracks) {
    if (!t.audio) { skipped++; continue; }

    const existing = await db('songs').where({ audio_url: t.audio }).first();
    if (existing) { skipped++; continue; }

    const artistId = await upsertArtist(t.artist_name);
    const genreName = t.musicinfo?.tags?.genres?.[0];
    const genreId = await upsertGenre(genreName);
    const slug = await generateUniqueSlug(t.name, async (s) => !!(await db('songs').where({ slug: s }).first()));

    await db('songs').insert({
      title: t.name,
      slug,
      artist_id: artistId,
      genre_id: genreId,
      audio_url: t.audio,
      cover_url: t.image || t.album_image || null,
      duration_seconds: t.duration || 0,
      is_published: true,
      is_active: true,
      language: 'English',
    });
    inserted++;
  }

  console.log(`✅ Inserted ${inserted} new songs from Jamendo (${skipped} skipped as duplicates)`);
  await db.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Jamendo sync error:', err.response?.data || err.message);
  process.exit(1);
});
