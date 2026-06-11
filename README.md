# mempa-api

REST API for the Mempa project. Node.js + Express 5 + TypeScript, PostgreSQL database via Prisma ORM, session-based authentication.

---

## Tech stack

| Layer         | Technology                                  |
|---------------|---------------------------------------------|
| Runtime       | Node.js 22                                  |
| Framework     | Express 5                                   |
| Language      | TypeScript (`tsx` in dev, `tsc` in prod)    |
| ORM           | Prisma 7                                    |
| Database      | PostgreSQL 16                               |
| Auth          | HTTP session (`express-session`) + bcrypt   |
| Security      | Helmet, CORS configured via env             |
| Tests         | Jest + Supertest                            |

---

## Getting started (Docker)

Copy `.env.example` to `.env` and fill in the values defined in `mempa-infra/.env`:

| Variable         | Description                                              |
|------------------|----------------------------------------------------------|
| `DATABASE_URL`   | Prisma connection URL (`postgresql://...`)               |
| `SESSION_SECRET` | Secret key used to sign session cookies                  |
| `FRONTEND_URL`   | CORS-allowed origin (e.g. `http://localhost:4200`)       |
| `NODE_ENV`       | `development` or `production`                            |


Run from `mempa-infra/`:

```bash
docker compose up -d
```

On startup, the API container automatically runs `prisma migrate deploy` before launching the server. The DB must be healthy (built-in PostgreSQL healthcheck) before the API attempts to connect.

To seed the database with demo data:

```bash
docker exec mempa-api npm run db:seed
```

---

## Scripts

```bash
npm run dev       # Start server in watch mode (tsx)
npm run build     # Compile TypeScript
npm start         # Production start (node ./bin/www)
npm test          # Run Jest tests
npm run db:seed   # Insert demo data
```

---

## Project structure

```
mempa-api/
├── bin/www.ts            # HTTP entry point
├── app.ts                # Express setup (middlewares, routes)
├── routes/
│   ├── auth.ts           # /auth
│   ├── tracks.ts         # /tracks
│   ├── styles.ts         # /styles
│   ├── playlist.ts       # /playlists
│   └── user.ts           # /api/users
├── middlewares/
│   └── requireAuth.ts    # Session guard
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration history
│   ├── seed.ts           # Demo data
│   ├── client.ts         # Prisma instance
│   └── singleton.ts      # Singleton for tests
└── tests/                # Integration tests
```

---

## API

The full API collection is available in `bruno-collection/` — open it with [Bruno](https://www.usebruno.com/).

The environment file (`environments/mempa-api-env.bru`) sets `url` to `http://localhost:3000` by default.

---

## Data model

```
User ──< Playlist (createdPlaylists)
User ──< PlaylistTrack (addedTracks)

MusicStyle ──< Playlist
MusicStyle ──< Track

Playlist ──< PlaylistTrack
Track    ──< PlaylistTrack
```

Deletions cascade: deleting a `User` removes their playlists and contributions; deleting a `MusicStyle` removes associated playlists and tracks.

---

## Tests

```bash
npm test
```

Test files are located in `tests/`.
