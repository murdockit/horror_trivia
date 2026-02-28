# Horror Trivia

A horror movie trivia web app a la Jackbox. Host a game on a big screen, players join on their phones with a room code and compete in real-time.

## Features

- **Multiplayer real-time gameplay** via Socket.io — players join with a 4-letter code and a nickname
- **Host screen** displays questions, timer, answer progress, and leaderboard
- **Player screen** shows answer buttons, results, score, and rank
- **Admin panel** for managing trivia questions and categories (add/edit/delete)
- **24 seed questions** across 6 categories: Classic Horror, Slasher Films, Supernatural, Zombies & Creatures, Modern Horror, Horror Directors
- **Scoring system** with speed bonuses and streak multipliers
- **Horror-themed dark UI** with Creepster font and blood-red accents

## Quick Start

```bash
npm install
cp .env.example .env
npm run seed
npm start
```

Then open `http://localhost:3000`.

- **Join a game:** Go to `/` and enter the room code + nickname
- **Host a game:** Go to `/host` to create a room
- **Admin panel:** Go to `/admin/login` (default: admin / horroradmin)

## Tech Stack

Node.js, Express, Socket.io, SQLite (better-sqlite3), EJS, vanilla JS/CSS.
