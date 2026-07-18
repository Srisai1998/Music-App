# Music App — API Documentation

Base URL: `http://localhost:5000/api`

All requests that require authentication must include:
```
Authorization: Bearer <accessToken>
```

All responses follow:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": { "field": ["validation error"] }
}
```

---

## 🔐 Authentication Endpoints

### POST /auth/register
Register a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "cooluser",
  "display_name": "Cool User"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "user" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### POST /auth/login
```json
{ "email": "user@example.com", "password": "SecurePass123" }
```

---

### POST /auth/refresh
```json
{ "refreshToken": "eyJ..." }
```

---

### GET /auth/google
Redirects to Google OAuth. No body required.

---

## 🎵 Songs Endpoints

### GET /songs
**Query params:** `page`, `limit`, `search`, `genre_id`, `artist_id`, `sort` (play_count|like_count|created_at), `order` (asc|desc)

**Response:**
```json
{
  "success": true,
  "data": [ { "id": "uuid", "title": "...", "artist_name": "...", "duration_seconds": 234 } ],
  "pagination": { "total": 500, "page": 1, "limit": 20, "totalPages": 25 }
}
```

### GET /songs/trending?limit=20
Returns top songs by play count.

### GET /songs/search?q=taylor&limit=10
Full-text search across songs, artists, and albums.

### GET /songs/:id
Returns song details and increments play count. Logs to listening_history if authenticated.

### POST /songs (Admin only)
**Content-Type: multipart/form-data**
```
audio: <file>          (required)
cover: <file>          (optional)
title: string
artist_id: uuid
album_id: uuid         (optional)
genre_id: uuid         (optional)
duration_seconds: number
language: string
lyrics: string
is_downloadable: boolean (default: true)
is_premium: boolean    (default: false)
```

---

## 🎤 Artists Endpoints

### GET /artists?search=&featured=true&page=1&limit=20
### GET /artists/:id — Returns artist + songs + albums + follower count
### POST /artists/:id/follow — Toggle follow/unfollow (Auth required)
### POST /artists (Admin) — multipart/form-data with avatar and cover files

---

## 📀 Albums Endpoints

### GET /albums?artist_id=&genre_id=&page=1&limit=20
### GET /albums/:id — Returns album + all tracks

---

## 📋 Playlists Endpoints

### GET /playlists?visibility=public
### GET /playlists/my (Auth required)
### GET /playlists/:id
### POST /playlists (Auth required) — `{ name, description, visibility }`
### PUT /playlists/:id (Auth required, owner only)
### DELETE /playlists/:id (Auth required, owner only)
### POST /playlists/:id/songs — `{ song_id: "uuid" }`
### DELETE /playlists/:id/songs/:songId

---

## ❤️ Favorites Endpoints

### POST /favorites/:songId — Toggle like (Auth required)
Returns `{ success: true, liked: true/false }`

### GET /favorites — Get liked songs (Auth required, paginated)
### GET /favorites/:songId/check — Check if liked

---

## 📜 History Endpoints

### GET /history — Listening history (Auth required, paginated)
### GET /history/recent — Recently played (deduplicated, Auth required)

---

## 🌟 Recommendations Endpoint

### GET /recommendations — Personalized songs based on listening history

---

## 💎 Subscription Endpoints

### POST /subscriptions/checkout
```json
{ "plan": "monthly" }  // or "yearly"
```
Returns `{ url: "https://checkout.stripe.com/..." }`

### GET /subscriptions/me — Current subscription status
### DELETE /subscriptions/cancel — Cancel active subscription
### POST /subscriptions/webhook — Stripe webhook (raw body)

---

## 📊 Admin Endpoints (Admin role required)

### GET /admin/dashboard — Full stats overview
### GET /admin/analytics/users?days=30
### GET /admin/analytics/songs?days=30
### GET /admin/analytics/revenue?days=30
### GET /admin/users?search=&page=1&limit=20
### PATCH /admin/users/:userId/status — Toggle active/suspended
### GET /admin/ads
### POST /admin/ads — multipart/form-data
### PATCH /admin/ads/:id/toggle — Toggle ad active status

---

## 🎯 Advertisement Endpoints

### GET /ads/active?placement=home&type=banner
Returns one random active ad for the given placement. Increments impression_count.

### POST /ads/:id/click — Track ad click

---

## Pagination Format

All list endpoints accept:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sort` — field name
- `order` — `asc` | `desc`

Response includes:
```json
"pagination": {
  "total": 500,
  "page": 2,
  "limit": 20,
  "totalPages": 25,
  "hasNext": true,
  "hasPrev": true
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200  | OK |
| 201  | Created |
| 401  | Unauthenticated |
| 403  | Forbidden (wrong role) |
| 404  | Not found |
| 409  | Conflict (duplicate) |
| 422  | Validation error |
| 429  | Rate limit exceeded |
| 500  | Internal server error |
