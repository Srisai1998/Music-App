# 🎵 Music Streaming App — Production-Ready

A full-stack music streaming application similar to Spotify / JioSaavn / YouTube Music, built with **TypeScript** across the entire stack.

## 🏗️ Architecture Overview

```
Music_Application/
├── backend/               # Node.js + Express.js REST API
├── frontend-web/          # Next.js 14 Web Application
├── mobile/                # React Native (Expo) Mobile App
├── admin/                 # React + Vite Admin Dashboard
├── docker/                # Nginx & Docker configs
├── docker-compose.yml     # Full-stack orchestration
└── .env.example           # Environment variables template
```

## ⚡ Tech Stack

| Layer         | Technology                                            |
|---------------|-------------------------------------------------------|
| **Backend**   | Node.js, Express.js, TypeScript, Knex.js (query builder) |
| **Database**  | PostgreSQL 16 + Full-text search                      |
| **Cache**     | Redis 7                                               |
| **Auth**      | JWT (Access + Refresh tokens) + Google OAuth 2.0     |
| **Storage**   | AWS S3 / Cloudinary                                   |
| **Web**       | Next.js 14, React 18, TypeScript, Tailwind CSS        |
| **Mobile**    | React Native (Expo), react-native-track-player        |
| **Admin**     | React + Vite, Recharts analytics                      |
| **State**     | Redux Toolkit + React Query                           |
| **Payments**  | Stripe Checkout + Webhooks                            |
| **Email**     | Nodemailer (SMTP)                                     |
| **DevOps**    | Docker Compose, Nginx reverse proxy                   |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### 1. Clone & configure environment

```bash
git clone https://github.com/yourorg/music-app.git
cd music-app

# Copy and fill in environment variables
cp .env.example .env
```

### 2. Start with Docker (recommended)

```bash
# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend npm run migrate

# Seed sample data
docker-compose exec backend npm run seed
```

### 3. Start in development mode

```bash
# Install all dependencies
npm run install:all

# Terminal 1 — Backend API
npm run dev:backend

# Terminal 2 — Web frontend
npm run dev:web

# Terminal 3 — Admin panel
npm run dev:admin

# Terminal 4 — Mobile app
npm run dev:mobile
```

## 🌐 URLs (development)

| Service        | URL                          |
|----------------|------------------------------|
| Backend API    | http://localhost:5000/api    |
| Health Check   | http://localhost:5000/health |
| Web Frontend   | http://localhost:3000        |
| Admin Panel    | http://localhost:3001        |
| Mobile (Expo)  | exp://localhost:8081         |

## 🗄️ Database Schema

10 core tables:
- **users** — Authentication, profiles, subscriptions
- **artists** — Artist profiles, social links, followers
- **genres** — Music categories with color themes
- **albums** — Album metadata, release info
- **songs** — Audio files, metadata, play counts
- **playlists** — User & featured playlists
- **playlist_songs** — Many-to-many with ordering
- **favorites** — User liked songs
- **listening_history** — Play tracking, analytics
- **subscriptions** — Stripe subscription records
- **advertisements** — Ad management
- **downloads** — Offline download tracking

## 📡 API Reference

### Authentication
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /api/auth/register          | Register new user        |
| POST   | /api/auth/login             | Email/password login     |
| POST   | /api/auth/refresh           | Refresh access token     |
| GET    | /api/auth/google            | Initiate Google OAuth    |
| GET    | /api/auth/me                | Get current user         |
| PUT    | /api/auth/profile           | Update profile/avatar    |
| POST   | /api/auth/forgot-password   | Request reset email      |
| POST   | /api/auth/reset-password    | Reset password           |
| GET    | /api/auth/verify-email      | Verify email address     |

### Songs
| Method | Endpoint            | Auth    | Description              |
|--------|---------------------|---------|--------------------------|
| GET    | /api/songs          | Optional| List songs (paginated)   |
| GET    | /api/songs/:id      | Optional| Get song + increment play|
| GET    | /api/songs/trending | Optional| Top songs by play count  |
| GET    | /api/songs/search   | Optional| Full-text search         |
| POST   | /api/songs          | Admin   | Upload song              |
| PUT    | /api/songs/:id      | Admin   | Update song metadata     |
| DELETE | /api/songs/:id      | Admin   | Soft delete song         |

### Playlists
| Method | Endpoint                     | Auth     | Description              |
|--------|------------------------------|----------|--------------------------|
| GET    | /api/playlists               | Optional | List public playlists    |
| GET    | /api/playlists/my            | Required | My playlists             |
| GET    | /api/playlists/:id           | Optional | Get playlist + songs     |
| POST   | /api/playlists               | Required | Create playlist          |
| PUT    | /api/playlists/:id           | Required | Update playlist          |
| DELETE | /api/playlists/:id           | Required | Delete playlist          |
| POST   | /api/playlists/:id/songs     | Required | Add song to playlist     |
| DELETE | /api/playlists/:id/songs/:sid| Required | Remove song              |

### Full API documentation: see [api-docs.md](./docs/api-docs.md)

## 🎵 Features

### User Features
- ✅ Email/password registration & login
- ✅ Google OAuth 2.0 authentication
- ✅ Email verification flow
- ✅ Password reset via email
- ✅ User profiles with avatars
- ✅ Liked songs collection
- ✅ Playlist creation & management
- ✅ Recently played history
- ✅ Personalized recommendations
- ✅ Search songs, artists, albums
- ✅ Dark mode (system default)
- ✅ Artist following

### Music Player
- ✅ Play / Pause / Next / Previous
- ✅ Seek bar with time display
- ✅ Volume control with mute
- ✅ Shuffle mode
- ✅ Repeat (none / all / one)
- ✅ Queue management
- ✅ Background playback (mobile)
- ✅ Lock screen controls (mobile)
- ✅ Mini player (mobile)
- ✅ Persistent bottom player (web)

### Admin Panel
- ✅ Secure admin authentication
- ✅ Analytics dashboard with charts
- ✅ Song upload with audio + cover
- ✅ User management + suspend/activate
- ✅ Advertisement management
- ✅ Revenue analytics
- ✅ Top songs & artists

### Monetization
- ✅ Stripe subscription checkout (Monthly / Yearly)
- ✅ Webhook-driven subscription lifecycle
- ✅ Premium badge in UI
- ✅ Ad placement system (banner, interstitial, rewarded)
- ✅ Ad impression + click tracking
- ✅ Sponsored songs & playlists schema

## 🔒 Security

- **bcryptjs** — Password hashing (cost factor 12)
- **JWT** — Short-lived access tokens (7d) + refresh tokens (30d)
- **Helmet** — HTTP security headers
- **CORS** — Configurable origin whitelist in production
- **Rate limiting** — Global (100 req/15min), auth (10 req/15min), uploads (20 req/hr)
- **Input validation** — express-validator on all routes
- **File type validation** — MIME-type allowlist for audio and images
- **Role-based access** — user / admin / artist roles
- **Non-root Docker** — Containers run as non-root users

## 🐳 Docker Deployment

```bash
# Production deployment
cp .env.example .env
# Edit .env with production values

docker-compose up -d

# Migrations
docker-compose exec backend npm run migrate

# View logs
docker-compose logs -f backend
```

### Services
| Container           | Port    | Description              |
|---------------------|---------|--------------------------|
| musicapp-postgres   | 5432    | PostgreSQL database      |
| musicapp-redis      | 6379    | Redis cache              |
| musicapp-backend    | 5000    | Express.js REST API      |
| musicapp-web        | 3000    | Next.js web app          |
| musicapp-admin      | 3001    | React admin panel        |
| musicapp-nginx      | 80/443  | Reverse proxy            |

## ☁️ Cloud Deployment Options

### AWS
- **EC2** + RDS (PostgreSQL) + ElastiCache (Redis) + S3 + CloudFront
- **ECS/EKS** for containerised deployment
- Set `NODE_ENV=production` and proper secrets in AWS Secrets Manager

### Railway / Render
1. Create PostgreSQL and Redis services
2. Deploy backend with environment variables
3. Deploy frontend-web as Next.js app
4. Deploy admin as static site

### Vercel (Web frontend)
```bash
cd frontend-web
vercel --prod
```

## 📱 Mobile Build

```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli
eas login

# Configure
eas build:configure

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

## 🔧 Environment Variables

See [`.env.example`](.env.example) for the complete list. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Min 32 chars random string |
| `GOOGLE_CLIENT_ID` | Google OAuth App credential |
| `AWS_S3_BUCKET_NAME` | S3 bucket for media storage |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

## 📁 Project Structure

```
backend/src/
├── config/          # database.ts, redis.ts, storage.ts
├── controllers/     # auth, songs, artists, playlists, favorites, admin, subscription, ads
├── middleware/      # auth, rateLimiter, validate
├── migrations/      # 001_initial_schema.ts
├── routes/          # All API route files
├── seeds/           # Sample data seeders
├── types/           # TypeScript interfaces
├── utils/           # helpers, email, logger
└── server.ts        # Express app entry point

frontend-web/src/
├── app/             # Next.js 14 App Router pages
├── components/
│   ├── layout/      # Sidebar, MainLayout
│   ├── player/      # MusicPlayer (bottom bar)
│   └── ui/          # SongCard, MediaCard
├── hooks/           # useAudioPlayer, useDebounce, useRedux
├── services/        # api.ts (Axios + all API calls)
├── store/slices/    # authSlice, playerSlice
└── styles/          # globals.css, Tailwind

mobile/src/
├── components/      # MiniPlayer
├── hooks/           # useRedux
├── navigation/      # (Tab & Stack config in App.tsx)
├── screens/         # Home, Player, Search, Library, Profile, auth/*
├── services/        # api.ts, trackPlayer.ts
└── store/slices/    # authSlice, playerSlice

admin/src/
├── components/      # AdminLayout
├── hooks/           # useRedux, useDebounce
├── pages/           # Dashboard, Songs, Artists, Users, Ads, Analytics, UploadSong
├── services/        # api.ts
└── store/slices/    # authSlice
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
