require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const path = require('path');
const { initialize, getDb } = require('./db/init');
const GameManager = require('./game/GameManager');

// Initialize database
initialize();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const gameManager = new GameManager();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'horror-trivia-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

// Routes
app.use('/', require('./routes/game'));
app.use('/admin', require('./routes/admin'));

// Socket.io
io.on('connection', (socket) => {
  // Host creates a game
  socket.on('create-game', (settings) => {
    const code = gameManager.createGame(socket.id, settings || {});
    socket.join(code);
    socket.emit('game-created', { code });
  });

  // Player joins a game
  socket.on('join-game', ({ code, nickname, avatar }) => {
    code = (code || '').toUpperCase().trim();
    nickname = (nickname || '').trim();
    avatar = (avatar || 'ghost').trim();

    if (!code || !nickname) {
      return socket.emit('joined', { success: false, error: 'Code and nickname are required.' });
    }
    if (nickname.length > 20) {
      return socket.emit('joined', { success: false, error: 'Nickname must be 20 characters or less.' });
    }

    const result = gameManager.addPlayer(code, socket.id, nickname, avatar);
    if (!result.success) {
      return socket.emit('joined', { success: false, error: result.error });
    }

    socket.join(code);
    socket.emit('joined', { success: true, code, nickname });

    // Notify host and other players
    io.to(code).emit('player-joined', {
      nickname,
      playerCount: result.playerCount,
      players: result.players,
    });
  });

  // Host starts the game
  socket.on('start-game', () => {
    const found = gameManager.findGameBySocket(socket.id);
    if (!found || found.role !== 'host') return;

    const game = gameManager.getGame(found.code);
    if (!game || game.state !== 'lobby') return;

    // Load questions from database
    const db = getDb();
    let query = `
      SELECT q.*, c.name as category_name
      FROM questions q
      JOIN categories c ON q.category_id = c.id
    `;
    const params = [];
    if (game.settings.difficulty !== 'all') {
      query += ' WHERE q.difficulty = ?';
      params.push(game.settings.difficulty);
    }
    query += ' ORDER BY RANDOM() LIMIT ?';
    params.push(game.settings.questionCount);

    const questions = db.prepare(query).all(...params);
    db.close();

    if (questions.length === 0) {
      return socket.emit('error-msg', { message: 'No questions available. Ask an admin to add some!' });
    }

    gameManager.startGame(found.code, questions);
    io.to(found.code).emit('game-started', {
      totalQuestions: questions.length,
      playerCount: game.players.size,
    });

    // Send first question
    sendNextQuestion(found.code);
  });

  // Host requests next question
  socket.on('next-question', () => {
    const found = gameManager.findGameBySocket(socket.id);
    if (!found || found.role !== 'host') return;
    sendNextQuestion(found.code);
  });

  // Player submits an answer
  socket.on('submit-answer', ({ answer }) => {
    const found = gameManager.findGameBySocket(socket.id);
    if (!found || found.role !== 'player') return;

    const result = gameManager.submitAnswer(found.code, socket.id, answer);
    if (!result) return;

    const game = gameManager.getGame(found.code);

    // Notify host about answer progress
    io.to(game.hostSocketId).emit('answer-received', {
      answeredCount: result.answeredCount,
      totalPlayers: result.totalPlayers,
    });

    if (result.allAnswered) {
      endQuestion(found.code);
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    const found = gameManager.findGameBySocket(socket.id);
    if (!found) return;

    if (found.role === 'host') {
      io.to(found.code).emit('host-disconnected');
      gameManager.removeGame(found.code);
    } else {
      const removed = gameManager.removePlayer(found.code, socket.id);
      if (removed) {
        io.to(found.code).emit('player-left', {
          nickname: removed.nickname,
          playerCount: removed.playerCount,
          players: gameManager.getPlayerList(found.code),
        });
      }
    }
  });
});

function sendNextQuestion(code) {
  const data = gameManager.nextQuestion(code);
  if (!data) return;

  if (data.finished) {
    io.to(code).emit('game-over', { standings: data.standings });
    gameManager.removeGame(code);
    return;
  }

  const game = gameManager.getGame(code);

  // Send full data to host (includes correct answer)
  io.to(game.hostSocketId).emit('question', data);

  // Send to players (without correct answer)
  const playerData = { ...data };
  delete playerData.correctOption;
  for (const [socketId] of game.players) {
    io.to(socketId).emit('question', playerData);
  }

  // Set timer
  game.timer = setTimeout(() => {
    endQuestion(code);
  }, game.settings.timePerQuestion * 1000 + 1000); // +1s buffer
}

function endQuestion(code) {
  const game = gameManager.getGame(code);
  if (!game || game.state !== 'playing') return;

  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }

  const results = gameManager.calculateResults(code);
  if (!results) return;

  // Send full results to host
  io.to(game.hostSocketId).emit('question-results', results);

  // Send individual results to each player
  for (const r of results.results) {
    io.to(r.socketId).emit('answer-result', {
      correct: r.correct,
      correctOption: results.correctOption,
      correctText: results.correctText,
      pointsEarned: r.pointsEarned,
      totalScore: r.totalScore,
      rank: r.rank,
      totalPlayers: results.results.length,
      streak: r.streak,
    });
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Horror Trivia running on http://localhost:${PORT}`);
});
