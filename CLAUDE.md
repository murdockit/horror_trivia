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
├── db/
│   ├── init.js            # Database schema and connection helper
│   └── seed.js            # Seed script (admin user + trivia questions)
├── game/
│   └── GameManager.js     # In-memory game state engine
├── middleware/
│   └── auth.js            # Admin session auth middleware
├── routes/
│   ├── admin.js           # Admin login, CRUD for questions/categories
│   └── game.js            # Page routes (join, host)
├── views/
│   ├── partials/          # EJS header/footer partials
│   ├── index.ejs          # Player join page
│   ├── host.ejs           # Host game page
│   ├── admin-login.ejs    # Admin login
│   └── admin-dashboard.ejs# Admin question management
├── public/
│   ├── css/style.css      # Horror-themed dark UI
│   └── js/
│       ├── player.js      # Player client-side logic
│       ├── host.js        # Host client-side logic
│       └── admin.js       # Admin dashboard logic
├── CLAUDE.md              # This file
└── README.md
```

## Key Commands

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

The server runs on `http://localhost:3000` by default (configurable via `PORT` in `.env`).

## Game Flow

1. **Host** visits `/host`, configures settings, clicks "Create Game" to get a 4-letter room code
2. **Players** visit `/` (root), enter the room code + a nickname to join the lobby
3. **Host** clicks "Start Game" — questions are pulled randomly from the database
4. Each round: question + 4 options shown, players answer on their devices, timer counts down
5. Points awarded: 1000 base + up to 500 speed bonus + streak bonuses
6. After all questions, final standings are displayed

## Admin Panel

- Login at `/admin/login` (default credentials in `.env.example`: admin / horroradmin)
- Manage questions: add, edit, delete, filter by category
- Manage categories: add new categories for organizing questions
- Questions have: category, difficulty (easy/medium/hard), 4 options, correct answer

## Architecture Notes

- **Game state is in-memory** (via `GameManager`). Games are ephemeral — only questions and admin data persist in SQLite.
- **Socket.io rooms** are used per game code. Host and players join the same room.
- **Timer is server-authoritative** — the server tracks question timing and forces question close after the time limit.
- **No build step** — the frontend is plain JS/CSS served statically.

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
