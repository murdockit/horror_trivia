# CLAUDE.md

## Project Overview

**horror_trivia** is a horror movie trivia web application inspired by Jackbox-style party games. Players answer horror movie trivia questions in a multiplayer, interactive format.

**Status:** Early stage — project has been initialized but no application code has been written yet.

## Repository Structure

```
horror_trivia/
├── CLAUDE.md          # AI assistant guide (this file)
└── README.md          # Project description
```

## Branch Conventions

- **main** — production-ready code; do not push directly
- **master** — legacy default branch (points to initial commit)
- Feature branches use the pattern: `claude/<description>-<id>` or `<author>/<feature-name>`

## Git Workflow

- Develop on feature branches, not on `main` or `master`
- Write clear, descriptive commit messages
- Push with `git push -u origin <branch-name>`

## Development Setup

No build tooling or dependencies have been configured yet. When the project is scaffolded, update this section with:
- How to install dependencies
- How to run the dev server
- How to run tests
- How to run linters/formatters
- How to build for production

## Key Commands

_To be defined once the tech stack is chosen. Expected commands:_

```bash
# Install dependencies
# npm install (or equivalent)

# Run development server
# npm run dev (or equivalent)

# Run tests
# npm test (or equivalent)

# Lint / format
# npm run lint (or equivalent)
```

## Tech Stack

Not yet selected. The project concept (Jackbox-style multiplayer trivia) suggests the following will likely be needed:
- **Frontend:** A reactive UI framework (React, Vue, Svelte, etc.)
- **Backend:** A server with WebSocket support for real-time multiplayer
- **Database:** Storage for trivia questions and game state

## Code Conventions

When contributing code to this project, follow these guidelines:
- Keep files focused and single-purpose
- Prefer clear, descriptive names over abbreviations
- Write tests alongside new features
- Do not commit secrets, API keys, or `.env` files
- Add a `.gitignore` appropriate for the chosen tech stack before adding dependencies

## Notes for AI Assistants

- Always read existing code before proposing changes
- Prefer editing existing files over creating new ones
- Do not over-engineer — keep solutions minimal and focused
- When scaffolding the project, confirm the tech stack choice with the user first
- Update this CLAUDE.md file as the project evolves (new commands, structure changes, conventions)
