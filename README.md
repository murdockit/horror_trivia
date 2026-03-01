# 🎃 Horror Trivia

A multiplayer horror movie trivia web app inspired by Jackbox Games. Host a game on a big screen, share a room code, and let players compete in real-time from their phones!

## ✨ Features

- **🎮 Multiplayer Real-Time Gameplay** — Players join via a 4-letter room code and a nickname using Socket.io
- **📺 Host Screen** — Displays questions, countdown timer, live answer progress, and a leaderboard
- **📱 Player Screen** — Shows answer buttons, round results, running score, and rank
- **🔑 QR Code Join** — Host screen generates a scannable QR code so players can join instantly
- **👤 Avatar Selection** — 12 horror-themed avatars to choose from (ghost, skull, vampire, zombie, and more)
- **🛠️ Admin Panel** — Full CRUD dashboard for managing trivia questions and categories
- **📦 24 Seed Questions** across 6 categories:
  - Classic Horror
  - Slasher Films
  - Supernatural
  - Zombies & Creatures
  - Modern Horror
  - Horror Directors
- **🏆 Scoring System** — 1,000 base points per correct answer, up to 500 speed bonus points, and streak multipliers (3+ correct in a row)
- **🔄 Reconnection Support** — Players who disconnect can rejoin mid-game with the same nickname
- **🧹 Auto-Cleanup** — Stale games are automatically removed after 30 minutes of inactivity
- **🎨 Horror-Themed Dark UI** — Creepster font, blood-red accents, and spooky styling
- **🐳 Docker Support** — Dockerfile and docker-compose.yml included for easy deployment

## 📁 Project Structure

```
horror_trivia/
├── server.js              # Express + Socket.io entry point
├── package.json
├── Dockerfile
├── docker-compose.yml
├── .env.example           # Environment variable template
├── db/
│   ├── init.js            # SQLite schema initialization
│   └── seed.js            # Database seeder (admin user, categories, questions)
├── game/
│   └── GameManager.js     # In-memory game state management
├── middleware/
│   └── auth.js            # Admin session authentication middleware
├── routes/
│   ├── game.js            # Game routes (join page, host page, QR API, categories API)
│   └── admin.js           # Admin routes (login, dashboard, question CRUD)
├── views/
│   ├── index.ejs          # Player join page
│   ├── host.ejs           # Host game page
│   ├── instructions.ejs   # How to Play page
│   ├── admin-login.ejs    # Admin login page
│   ├── admin-dashboard.ejs# Admin question management
│   └── partials/          # Shared header/footer templates
└── public/
    ├── css/               # Stylesheets
    └── js/                # Client-side JavaScript
```

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- npm

### Local Development

```bash
# Clone the repository
git clone https://github.com/murdockit/horror_trivia.git
cd horror_trivia

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Seed the database with categories, questions, and admin user
npm run seed

# Start the server
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

For development with auto-restart:

```bash
npm run dev
```

### Docker

```bash
# Build and run with Docker Compose
docker compose up -d
```

The app will be available at [http://localhost:4040](http://localhost:4040).

## 🎯 How to Play

| Route | Description |
|---|---|
| `/` | **Join a game** — Enter the 4-letter room code, pick a nickname and avatar |
| `/host` | **Host a game** — Configure settings, create a room, share the code or QR |
| `/instructions` | **How to Play** — Step-by-step guide and scoring details |
| `/admin/login` | **Admin panel** — Manage questions and categories |

### Game Flow

1. **Host** opens `/host`, configures question count (5–20), time per question (10–30s), difficulty, and categories, then creates a game
2. **Players** scan the QR code or visit `/` and enter the room code + nickname
3. **Host** clicks "Start Game" once everyone is in the lobby
4. Each round, a question appears with 4 options — players tap their answer before time runs out
5. After all questions, the final leaderboard reveals the top 3 on a podium

### Scoring

| Type | Points |
|---|---|
| 🎯 Correct Answer | **1,000** base points |
| ⚡ Speed Bonus | Up to **500** extra points (faster = more) |
| 🔥 Streak Bonus | **3+ correct in a row** earns bonus multiplier points |

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `SESSION_SECRET` | `change-me-to-a-random-string` | Express session secret |
| `ADMIN_USERNAME` | `admin` | Admin panel username |
| `ADMIN_PASSWORD` | `horroradmin` | Admin panel password |
| `PUBLIC_URL` | *(empty)* | Public-facing URL for QR codes (leave empty to use browser origin) |

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime |
| **Express** | Web framework |
| **Socket.io** | Real-time WebSocket communication |
| **SQLite** (better-sqlite3) | Database |
| **EJS** | Server-side templating |
| **bcryptjs** | Password hashing |
| **qrcode** | QR code generation |
| **express-session** | Session management |
| **Vanilla JS/CSS** | Client-side interactivity and styling |

## 📜 License

This project is licensed under the [MIT License](LICENSE).