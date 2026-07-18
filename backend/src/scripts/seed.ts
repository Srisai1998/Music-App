import db from '../config/database';
import bcrypt from 'bcryptjs';

async function seed(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ── Genres ────────────────────────────────────────────────────────────────
  const genreIds: Record<string, string> = {};
  const genres = [
    { name: 'Pop', slug: 'pop', color: '#e8115b' },
    { name: 'Hip-Hop', slug: 'hip-hop', color: '#ba5d07' },
    { name: 'Rock', slug: 'rock', color: '#e91429' },
    { name: 'Electronic', slug: 'electronic', color: '#0d73ec' },
    { name: 'R&B', slug: 'rnb', color: '#8400e7' },
    { name: 'Jazz', slug: 'jazz', color: '#1e3264' },
    { name: 'Classical', slug: 'classical', color: '#1db954' },
    { name: 'Country', slug: 'country', color: '#dc148c' },
    { name: 'Reggae', slug: 'reggae', color: '#056952' },
    { name: 'Lo-Fi', slug: 'lo-fi', color: '#503750' },
  ];

  for (const genre of genres) {
    const existing = await db('genres').where({ slug: genre.slug }).first();
    if (!existing) {
      const [g] = await db('genres').insert(genre).returning('*');
      genreIds[genre.slug] = g.id;
    } else {
      genreIds[genre.slug] = existing.id;
    }
  }

  // ── Admin User ────────────────────────────────────────────────────────────
  const adminEmail = 'admin@musicapp.com';
  const existing = await db('users').where({ email: adminEmail }).first();
  if (!existing) {
    const password_hash = await bcrypt.hash('Admin@12345', 12);
    await db('users').insert({
      email: adminEmail,
      username: 'admin',
      display_name: 'Admin User',
      password_hash,
      role: 'admin',
      is_verified: true,
      subscription_type: 'yearly',
    });
    console.log('✅ Admin user created: admin@musicapp.com / Admin@12345');
  }

  // ── Sample Artists ─────────────────────────────────────────────────────────
  const artistData = [
    { name: 'Aurora Waves', slug: 'aurora-waves', bio: 'Electronic music artist from Oslo', country: 'Norway', is_featured: true, monthly_listeners: 125000 },
    { name: 'The Midnight Trio', slug: 'midnight-trio', bio: 'Indie rock band from Austin, TX', country: 'USA', is_featured: true, monthly_listeners: 89000 },
    { name: 'Priya Sharma', slug: 'priya-sharma', bio: 'Bollywood playback singer', country: 'India', is_featured: true, monthly_listeners: 250000 },
    { name: 'Bass Kingdom', slug: 'bass-kingdom', bio: 'EDM & Bass music producer', country: 'UK', is_featured: false, monthly_listeners: 45000 },
    { name: 'Jazz Collective', slug: 'jazz-collective', bio: 'Modern jazz ensemble', country: 'USA', is_featured: false, monthly_listeners: 30000 },
  ];

  const artistIds: Record<string, string> = {};
  for (const artist of artistData) {
    const existing = await db('artists').where({ slug: artist.slug }).first();
    if (!existing) {
      const [a] = await db('artists').insert(artist).returning('*');
      artistIds[artist.slug] = a.id;
    } else {
      artistIds[artist.slug] = existing.id;
    }
  }

  // ── Sample Albums ──────────────────────────────────────────────────────────
  const albumData = [
    { title: 'Northern Lights', slug: 'northern-lights', artist_slug: 'aurora-waves', genre_slug: 'electronic', release_date: '2023-06-15', album_type: 'album', is_published: true, total_tracks: 10 },
    { title: 'City Stories', slug: 'city-stories', artist_slug: 'midnight-trio', genre_slug: 'rock', release_date: '2023-09-20', album_type: 'album', is_published: true, total_tracks: 12 },
    { title: 'Raag Fusion', slug: 'raag-fusion', artist_slug: 'priya-sharma', genre_slug: 'pop', release_date: '2024-01-10', album_type: 'album', is_published: true, total_tracks: 8 },
  ];

  const albumIds: Record<string, string> = {};
  for (const album of albumData) {
    const existing = await db('albums').where({ slug: album.slug }).first();
    if (!existing) {
      const { artist_slug, genre_slug, ...data } = album;
      const [a] = await db('albums').insert({
        ...data,
        artist_id: artistIds[artist_slug],
        genre_id: genreIds[genre_slug],
      }).returning('*');
      albumIds[album.slug] = a.id;
    } else {
      albumIds[album.slug] = existing.id;
    }
  }

  // ── Sample Songs ───────────────────────────────────────────────────────────
  const songData = [
    { title: 'Northern Lights (Title Track)', artist_slug: 'aurora-waves', album_slug: 'northern-lights', genre_slug: 'electronic', duration_seconds: 234, play_count: 125000, track_number: 1 },
    { title: 'Aurora Borealis', artist_slug: 'aurora-waves', album_slug: 'northern-lights', genre_slug: 'electronic', duration_seconds: 198, play_count: 87000, track_number: 2 },
    { title: 'Midnight Streets', artist_slug: 'midnight-trio', album_slug: 'city-stories', genre_slug: 'rock', duration_seconds: 265, play_count: 95000, track_number: 1 },
    { title: 'Rain on Glass', artist_slug: 'midnight-trio', album_slug: 'city-stories', genre_slug: 'rock', duration_seconds: 312, play_count: 54000, track_number: 2 },
    { title: 'Dil Kehta Hai', artist_slug: 'priya-sharma', album_slug: 'raag-fusion', genre_slug: 'pop', duration_seconds: 287, play_count: 310000, track_number: 1 },
    { title: 'Tu Mere Dil Mein', artist_slug: 'priya-sharma', album_slug: 'raag-fusion', genre_slug: 'pop', duration_seconds: 245, play_count: 198000, track_number: 2 },
    { title: 'Bass Drop 2024', artist_slug: 'bass-kingdom', genre_slug: 'electronic', duration_seconds: 178, play_count: 45000 },
    { title: 'Blue Note', artist_slug: 'jazz-collective', genre_slug: 'jazz', duration_seconds: 423, play_count: 28000 },
  ];

  for (const song of songData) {
    const slug = song.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await db('songs').where({ slug }).first();
    if (!existing) {
      const { artist_slug, album_slug, genre_slug, ...data } = song;
      await db('songs').insert({
        ...data,
        slug,
        artist_id: artistIds[artist_slug],
        album_id: album_slug ? albumIds[album_slug] : null,
        genre_id: genreIds[genre_slug],
        audio_url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3`, // placeholder
        is_published: true,
        language: 'English',
      });
    }
  }

  // ── Sample Ad ──────────────────────────────────────────────────────────────
  const adExists = await db('advertisements').first();
  if (!adExists) {
    await db('advertisements').insert({
      title: 'Premium — Listen Without Interruption',
      description: 'Upgrade to Premium for ad-free listening.',
      ad_type: 'banner',
      placement: 'home',
      is_active: true,
      duration_seconds: 0,
      click_url: '/premium',
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('🔑 Admin credentials:');
  console.log('   Email:    admin@musicapp.com');
  console.log('   Password: Admin@12345');
  await db.destroy();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
