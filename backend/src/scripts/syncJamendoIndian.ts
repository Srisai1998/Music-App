import axios from 'axios';
import db from '../config/database';
import { toSlug, generateUniqueSlug } from '../utils/helpers';

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID;
const JAMENDO_API = 'https://api.jamendo.com/v3.0';

const LANGUAGES: Record<string, string> = {
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  bn: 'Bengali',
  ml: 'Malayalam',
  kn: 'Kannada',
};

const SEARCH_TERMS = [
  'india', 'indian', 'bollywood', 'hindi', 'tamil', 'telugu', 'bengali',
  'malayalam', 'kannada', 'raga', 'tabla', 'sitar', 'carnatic', 'bhangra',
  'punjabi', 'devotional', 'bhajan',
];

interface JamendoTrack {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  album_image: string;
  image: string;
  audio: string;
  releasedate?: string;
  musicinfo?: { lang?: string; tags?: { genres?: string[] } };
}

async function searchTracks(term: string): Promise<JamendoTrack[]> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data } = await axios.get(`${JAMENDO_API}/tracks/`, {
        params: {
          client_id: JAMENDO_CLIENT_ID,
          format: 'json',
          limit: 200,
          search: term,
          include: 'musicinfo',
          audioformat: 'mp32',
          datebetween: '1995-01-01_2026-12-31',
        },
        timeout: 15000,
      });
      if (data.results.length > 0) return data.results;
    } catch {
      // fall through to retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return [];
}

async function upsertArtist(name: string): Promise<string> {
  const cleanName = name?.trim() || 'Unknown Artist';
  const existing = await db('artists').where({ name: cleanName }).first();
  if (existing) return existing.id;
  const slug = await generateUniqueSlug(cleanName, async (s) => !!(await db('artists').where({ slug: s }).first()));
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

  console.log('🇮🇳 Searching Jamendo for Indian-language tracks (Telugu, Tamil, Hindi, Bengali, Malayalam, Kannada)...');

  const seen = new Map<string, JamendoTrack & { lang: string }>();

  for (const term of SEARCH_TERMS) {
    const results = await searchTracks(term);
    for (const t of results) {
      const lang = t.musicinfo?.lang || '';
      if (lang in LANGUAGES && t.audio && !seen.has(t.id)) {
        seen.set(t.id, { ...t, lang });
      }
    }
  }

  const counts: Record<string, number> = {};
  let inserted = 0;
  let skipped = 0;

  for (const t of seen.values()) {
    const languageName = LANGUAGES[t.lang];
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
      language: languageName,
    });
    inserted++;
    counts[languageName] = (counts[languageName] || 0) + 1;
  }

  console.log(`✅ Inserted ${inserted} Indian-language songs (${skipped} skipped as duplicates)`);
  for (const [lang, count] of Object.entries(counts)) {
    console.log(`   ${lang}: ${count}`);
  }
  await db.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Jamendo Indian sync error:', err.response?.data || err.message);
  process.exit(1);
});
