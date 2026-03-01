# CLAUDE.md

## Project Overview

**horror_trivia** is a horror movie trivia web application inspired by Jackbox-style party games. Players answer horror trivia questions in a multiplayer, real-time format using their own devices.

## Tech Stack

- **Runtime:** Node.js
- **Server:** Express with EJS templates
- **Real-time:** Socket.io for multiplayer game communication
- **Database:** SQLite via better-sqlite3 (file-based, no external DB needed)
- **Auth:** bcryptjs for password hashing, express-session for admin sessions
- **Frontend:** Vanilla JS + CSS (no build step required)

## Repository Structure

```
horror_trivia/
├── server.js              # Express + Socket.io entry point
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variable template
├── Dockerfile             # Docker container configuration
├── docker-compose.yml     # Docker Compose orchestration
├── .dockerignore          # Docker build exclusions
├── db/
│   ├── init.js            # Database schema and connection helper
│   └── seed.js            # Seed script (admin user + trivia questions)
├── game/
│   └── GameManager.js     # In-memory game state engine
├── middleware/
│   └── auth.js            # Admin session auth middleware
├── routes/
│   ├── admin.js           # Admin login, CRUD for questions/categories
│   └── game.js            # Page routes, categories API, QR code API
├── views/
│   ├── partials/          # EJS header/footer partials
│   ├── index.ejs          # Player join page (with avatar picker)
│   ├── host.ejs           # Host game page
│   ├── instructions.ejs   # How to Play page
│   ├── admin-login.ejs    # Admin login
│   └── admin-dashboard.ejs# Admin question management
├── public/
│   ├── css/style.css      # Horror-themed dark UI
│   └── js/
│       ├── player.js      # Player client-side logic
│       ├── host.js        # Host client-side logic
│       ├── admin.js       # Admin dashboard logic
│       └── sounds.js      # Web Audio API sound effects
├── CLAUDE.md              # This file
└── README.md
```

## Key Commands

### Docker (recommended)

```bash
# Run with Docker (port 4040) — installs deps, seeds DB, starts server automatically
docker compose up --build

# Run in background
docker compose up --build -d
```

The database is persisted via a volume mount (`./db:/app/db`), so admin-added questions survive container restarts.
Available at `http://localhost:4040`.

### Local Development

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Seed the database (creates admin user + sample questions)
npm run seed

# Start the server (production)
npm start

# Start with auto-reload (development)
npm run dev
```

Available at `http://localhost:3000` by default (configurable via `PORT` in `.env`).

## Game Flow

1. **Host** visits `/host`, configures settings (questions, time, difficulty, categories), clicks "Create Game" to get a 4-letter room code + QR code
2. **Players** visit `/` (root) or scan the QR code, enter the room code + a nickname, pick a horror-themed avatar, and join the lobby
3. **Host** clicks "Start Game" — a 3-2-1 countdown plays, then questions begin
4. Each round: question + 4 options shown, players answer on their devices, timer counts down
5. Points awarded: 1000 base + up to 500 speed bonus + streak bonuses
6. After all questions, final standings are displayed
7. **Reconnection** — if a player disconnects mid-game, they can rejoin with the same nickname within 60 seconds to recover their score

## Admin Panel

- Login at `/admin/login` (default credentials in `.env.example`: admin / horroradmin)
- Manage questions: add, edit, delete, filter by category
- Bulk import questions via JSON file upload
- Manage categories: add new categories for organizing questions
- Questions have: category, difficulty (easy/medium/hard), 4 options, correct answer

## Architecture Notes

- **Game state is in-memory** (via `GameManager`). Games are ephemeral — only questions and admin data persist in SQLite.
- **Socket.io rooms** are used per game code. Host and players join the same room.
- **Timer is server-authoritative** — the server tracks question timing and forces question close after the time limit.
- **No build step** — the frontend is plain JS/CSS served statically.
- **Avatars** — players choose a horror-themed emoji avatar on join. Avatars are stored in-memory with player data and displayed in lobby, results, leaderboard, and podium views.
- **Docker** — the app can be containerized via `Dockerfile` and `docker-compose.yml`, running on port 4040. The `db/` directory is mounted as a volume so the SQLite database persists across restarts.
- **Sound effects** — synthesized via Web Audio API (no audio files). Plays on correct/wrong answers, countdown, timer warning, game over, and player join.
- **Player reconnection** — disconnected players are preserved for 60 seconds, allowing rejoin with the same nickname to recover score and state.
- **Game cleanup** — stale games are automatically removed after 30 minutes of inactivity.
- **QR codes** — generated server-side via the `qrcode` npm package, displayed in the host lobby for easy player joining.

## Branch Conventions

- **main** — production-ready code; do not push directly
- Feature branches: `claude/<description>-<id>` or `<author>/<feature-name>`

## Code Conventions

- Keep files focused and single-purpose
- Use clear, descriptive names
- Do not commit `.env` files or `db/*.db` database files (both gitignored)
- Escape all user-generated content before rendering (XSS prevention)
- Admin routes are protected by session middleware (`requireAdmin`)

## Notes for AI Assistants

- Always read existing code before proposing changes
- Prefer editing existing files over creating new ones
- Keep solutions minimal — do not over-engineer
- The database schema lives in `db/init.js` — run `npm run seed` after schema changes
- Socket.io events are handled in `server.js` — game logic lives in `game/GameManager.js`
- Update this CLAUDE.md when adding new routes, commands, or architectural changes
