import axios from 'axios';
import db from '../config/database';
import { toSlug, generateUniqueSlug } from '../utils/helpers';

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID;
const JAMENDO_API = 'https://api.jamendo.com/v3.0';
const TRACK_LIMIT_PER_TERM = 50;

const SEARCH_TERMS = [
  'soundtrack', 'film score', 'movie', 'orchestral', 'epic', 'trailer', 'cinematic',
];

const MOVIE_GENRE_TAGS = ['filmscore', 'soundtrack', 'orchestral', 'symphonic'];

interface JamendoTrack {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  album_image: string;
  image: string;
  audio: string;
  musicinfo?: { tags?: { genres?: string[] } };
}

async function searchTracks(term: string): Promise<JamendoTrack[]> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data } = await axios.get(`${JAMENDO_API}/tracks/`, {
        params: {
          client_id: JAMENDO_CLIENT_ID,
          format: 'json',
          limit: TRACK_LIMIT_PER_TERM,
          search: term,
          include: 'musicinfo',
          audioformat: 'mp32',
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

async function upsertGenre(name: string): Promise<string> {
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

  console.log('🎬 Searching Jamendo for movie/cinematic-style tracks...');

  const seen = new Map<string, JamendoTrack>();
  for (const term of SEARCH_TERMS) {
    const results = await searchTracks(term);
    for (const t of results) {
      const genres = t.musicinfo?.tags?.genres || [];
      const isMovieStyle = genres.some((g) => MOVIE_GENRE_TAGS.includes(g));
      if (t.audio && isMovieStyle && !seen.has(t.id)) {
        seen.set(t.id, t);
      }
    }
  }

  console.log(`Found ${seen.size} unique film-score/soundtrack tracks`);

  const genreId = await upsertGenre('Soundtrack');
  let inserted = 0;
  let skipped = 0;

  for (const t of seen.values()) {
    const existing = await db('songs').where({ audio_url: t.audio }).first();
    if (existing) { skipped++; continue; }

    const artistId = await upsertArtist(t.artist_name);
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
      language: 'Instrumental',
    });
    inserted++;
  }

  console.log(`✅ Inserted ${inserted} movie/soundtrack-style songs (${skipped} skipped as duplicates)`);
  await db.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Jamendo movies sync error:', err.response?.data || err.message);
  process.exit(1);
});
