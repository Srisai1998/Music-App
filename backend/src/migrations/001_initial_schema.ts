import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ── USERS ──────────────────────────────────────────────────────────────────
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('email', 255).notNullable().unique();
    t.string('username', 50).notNullable().unique();
    t.string('display_name', 100).notNullable();
    t.string('password_hash', 255).nullable();
    t.string('avatar_url', 500).nullable();
    t.enum('role', ['user', 'admin', 'artist']).defaultTo('user');
    t.enum('auth_provider', ['local', 'google']).defaultTo('local');
    t.string('google_id', 100).nullable().unique();
    t.boolean('is_verified').defaultTo(false);
    t.boolean('is_active').defaultTo(true);
    t.string('verification_token', 255).nullable();
    t.string('reset_password_token', 255).nullable();
    t.timestamp('reset_password_expires').nullable();
    t.enum('subscription_type', ['free', 'monthly', 'yearly']).defaultTo('free');
    t.timestamp('subscription_expires_at').nullable();
    t.string('stripe_customer_id', 100).nullable();
    t.jsonb('preferences').defaultTo('{}');
    t.timestamps(true, true);
  });

  // ── ARTISTS ───────────────────────────────────────────────────────────────
  await knex.schema.createTable('artists', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 200).notNullable();
    t.string('slug', 200).notNullable().unique();
    t.text('bio').nullable();
    t.string('avatar_url', 500).nullable();
    t.string('cover_url', 500).nullable();
    t.string('website', 500).nullable();
    t.jsonb('social_links').defaultTo('{}');
    t.string('country', 100).nullable();
    t.integer('monthly_listeners').defaultTo(0);
    t.boolean('is_verified').defaultTo(false);
    t.boolean('is_featured').defaultTo(false);
    t.boolean('is_active').defaultTo(true);
    t.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.timestamps(true, true);
  });

  // ── GENRES ────────────────────────────────────────────────────────────────
  await knex.schema.createTable('genres', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 100).notNullable().unique();
    t.string('slug', 100).notNullable().unique();
    t.string('color', 20).nullable();
    t.string('cover_url', 500).nullable();
    t.boolean('is_active').defaultTo(true);
    t.timestamps(true, true);
  });

  // ── ALBUMS ────────────────────────────────────────────────────────────────
  await knex.schema.createTable('albums', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('title', 300).notNullable();
    t.string('slug', 300).notNullable().unique();
    t.uuid('artist_id').notNullable().references('id').inTable('artists').onDelete('CASCADE');
    t.text('description').nullable();
    t.string('cover_url', 500).nullable();
    t.enum('album_type', ['album', 'single', 'ep', 'compilation']).defaultTo('album');
    t.date('release_date').nullable();
    t.string('label', 200).nullable();
    t.uuid('genre_id').nullable().references('id').inTable('genres').onDelete('SET NULL');
    t.integer('total_tracks').defaultTo(0);
    t.boolean('is_published').defaultTo(false);
    t.boolean('is_active').defaultTo(true);
    t.timestamps(true, true);
  });

  // ── SONGS ─────────────────────────────────────────────────────────────────
  await knex.schema.createTable('songs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('title', 300).notNullable();
    t.string('slug', 300).notNullable().unique();
    t.uuid('artist_id').notNullable().references('id').inTable('artists').onDelete('CASCADE');
    t.uuid('album_id').nullable().references('id').inTable('albums').onDelete('SET NULL');
    t.uuid('genre_id').nullable().references('id').inTable('genres').onDelete('SET NULL');
    t.string('audio_url', 500).notNullable();
    t.string('audio_url_hq', 500).nullable();
    t.string('cover_url', 500).nullable();
    t.integer('duration_seconds').notNullable().defaultTo(0);
    t.integer('track_number').nullable();
    t.string('language', 50).nullable();
    t.text('lyrics').nullable();
    t.bigInteger('play_count').defaultTo(0);
    t.integer('like_count').defaultTo(0);
    t.integer('download_count').defaultTo(0);
    t.boolean('is_published').defaultTo(false);
    t.boolean('is_active').defaultTo(true);
    t.boolean('is_downloadable').defaultTo(true);
    t.boolean('is_premium').defaultTo(false);
    t.boolean('is_sponsored').defaultTo(false);
    t.jsonb('tags').defaultTo('[]');
    t.integer('file_size_bytes').nullable();
    t.string('audio_quality', 20).defaultTo('standard');
    t.timestamps(true, true);
  });

  // ── PLAYLISTS ─────────────────────────────────────────────────────────────
  await knex.schema.createTable('playlists', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 300).notNullable();
    t.string('slug', 300).notNullable();
    t.text('description').nullable();
    t.string('cover_url', 500).nullable();
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.enum('visibility', ['public', 'private', 'collaborative']).defaultTo('private');
    t.boolean('is_featured').defaultTo(false);
    t.boolean('is_sponsored').defaultTo(false);
    t.integer('total_songs').defaultTo(0);
    t.integer('total_duration_seconds').defaultTo(0);
    t.boolean('is_active').defaultTo(true);
    t.timestamps(true, true);
  });

  // ── PLAYLIST_SONGS ────────────────────────────────────────────────────────
  await knex.schema.createTable('playlist_songs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('playlist_id').notNullable().references('id').inTable('playlists').onDelete('CASCADE');
    t.uuid('song_id').notNullable().references('id').inTable('songs').onDelete('CASCADE');
    t.uuid('added_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.integer('position').notNullable().defaultTo(0);
    t.timestamp('added_at').defaultTo(knex.fn.now());
    t.unique(['playlist_id', 'song_id']);
  });

  // ── FAVORITES ─────────────────────────────────────────────────────────────
  await knex.schema.createTable('favorites', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('song_id').notNullable().references('id').inTable('songs').onDelete('CASCADE');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['user_id', 'song_id']);
  });

  // ── LISTENING_HISTORY ─────────────────────────────────────────────────────
  await knex.schema.createTable('listening_history', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('song_id').notNullable().references('id').inTable('songs').onDelete('CASCADE');
    t.integer('play_duration_seconds').defaultTo(0);
    t.boolean('completed').defaultTo(false);
    t.string('ip_address', 45).nullable();
    t.string('device_type', 50).nullable();
    t.timestamp('played_at').defaultTo(knex.fn.now());
  });

  // ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────
  await knex.schema.createTable('subscriptions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.enum('plan', ['monthly', 'yearly']).notNullable();
    t.enum('status', ['active', 'cancelled', 'expired', 'paused']).defaultTo('active');
    t.string('stripe_subscription_id', 200).nullable().unique();
    t.string('stripe_payment_intent_id', 200).nullable();
    t.decimal('amount', 10, 2).notNullable();
    t.string('currency', 10).defaultTo('USD');
    t.timestamp('starts_at').notNullable();
    t.timestamp('expires_at').notNullable();
    t.timestamp('cancelled_at').nullable();
    t.timestamps(true, true);
  });

  // ── ADVERTISEMENTS ────────────────────────────────────────────────────────
  await knex.schema.createTable('advertisements', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('title', 300).notNullable();
    t.text('description').nullable();
    t.string('image_url', 500).nullable();
    t.string('audio_url', 500).nullable();
    t.string('click_url', 500).nullable();
    t.enum('ad_type', ['banner', 'interstitial', 'rewarded', 'audio']).notNullable();
    t.enum('placement', ['home', 'player', 'search', 'playlist']).defaultTo('home');
    t.boolean('is_active').defaultTo(true);
    t.integer('duration_seconds').defaultTo(30);
    t.integer('impression_count').defaultTo(0);
    t.integer('click_count').defaultTo(0);
    t.timestamp('starts_at').nullable();
    t.timestamp('ends_at').nullable();
    t.decimal('budget', 10, 2).nullable();
    t.decimal('spent', 10, 2).defaultTo(0);
    t.timestamps(true, true);
  });

  // ── DOWNLOADS (offline) ───────────────────────────────────────────────────
  await knex.schema.createTable('downloads', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('song_id').notNullable().references('id').inTable('songs').onDelete('CASCADE');
    t.timestamp('downloaded_at').defaultTo(knex.fn.now());
    t.unique(['user_id', 'song_id']);
  });

  // ── ARTIST_FOLLOWS ────────────────────────────────────────────────────────
  await knex.schema.createTable('artist_follows', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('artist_id').notNullable().references('id').inTable('artists').onDelete('CASCADE');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['user_id', 'artist_id']);
  });

  // ── SONG_ARTISTS (featured artists) ──────────────────────────────────────
  await knex.schema.createTable('song_artists', (t) => {
    t.uuid('song_id').notNullable().references('id').inTable('songs').onDelete('CASCADE');
    t.uuid('artist_id').notNullable().references('id').inTable('artists').onDelete('CASCADE');
    t.enum('role', ['primary', 'featured', 'producer', 'composer']).defaultTo('featured');
    t.primary(['song_id', 'artist_id']);
  });

  // ── INDEXES ───────────────────────────────────────────────────────────────
  await knex.schema.raw('CREATE INDEX idx_songs_artist ON songs(artist_id)');
  await knex.schema.raw('CREATE INDEX idx_songs_album ON songs(album_id)');
  await knex.schema.raw('CREATE INDEX idx_songs_play_count ON songs(play_count DESC)');
  await knex.schema.raw('CREATE INDEX idx_songs_published ON songs(is_published, is_active)');
  await knex.schema.raw('CREATE INDEX idx_listening_history_user ON listening_history(user_id, played_at DESC)');
  await knex.schema.raw('CREATE INDEX idx_listening_history_song ON listening_history(song_id)');
  await knex.schema.raw('CREATE INDEX idx_favorites_user ON favorites(user_id)');
  await knex.schema.raw('CREATE INDEX idx_playlists_user ON playlists(user_id)');
  await knex.schema.raw('CREATE INDEX idx_albums_artist ON albums(artist_id)');

  // Full text search indexes
  await knex.schema.raw(`
    CREATE INDEX idx_songs_fts ON songs USING gin(to_tsvector('english', title));
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_artists_fts ON artists USING gin(to_tsvector('english', name));
  `);
  await knex.schema.raw(`
    CREATE INDEX idx_albums_fts ON albums USING gin(to_tsvector('english', title));
  `);
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    'song_artists', 'artist_follows', 'downloads', 'advertisements',
    'subscriptions', 'listening_history', 'favorites', 'playlist_songs',
    'playlists', 'songs', 'albums', 'genres', 'artists', 'users',
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
}
