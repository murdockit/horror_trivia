class GameManager {
  constructor() {
    this.games = new Map();
    // Clean up stale games every 5 minutes
    this._cleanupInterval = setInterval(() => this.cleanupStaleGames(), 5 * 60 * 1000);
  }

  cleanupStaleGames() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    for (const [code, game] of this.games) {
      if (now - game.lastActivity > maxAge) {
        if (game.timer) clearTimeout(game.timer);
        for (const [, dc] of game.disconnectedPlayers) {
          clearTimeout(dc.timeout);
        }
        this.games.delete(code);
      }
    }
  }

  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code;
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (this.games.has(code));
    return code;
  }

  createGame(hostSocketId, settings = {}) {
    const code = this.generateCode();
    this.games.set(code, {
      code,
      hostSocketId,
      players: new Map(),
      disconnectedPlayers: new Map(), // nickname -> { player data, timeout }
      state: 'lobby',
      currentQuestionIndex: -1,
      questions: [],
      questionStartTime: null,
      timer: null,
      lastActivity: Date.now(),
      settings: {
        questionCount: settings.questionCount || 10,
        timePerQuestion: settings.timePerQuestion || 20,
        difficulty: settings.difficulty || 'all',
        categories: settings.categories || [], // empty = all
      },
    });
    return code;
  }

  getGame(code) {
    return this.games.get(code);
  }

  addPlayer(code, socketId, nickname, avatar) {
    const game = this.games.get(code);
    if (!game) return { success: false, error: 'Game not found.' };

    // Check for reconnection — player rejoining with same nickname during an active game
    const nickLower = nickname.toLowerCase();
    const disconnected = game.disconnectedPlayers.get(nickLower);
    if (disconnected) {
      clearTimeout(disconnected.timeout);
      game.disconnectedPlayers.delete(nickLower);
      game.players.set(socketId, disconnected.data);
      game.lastActivity = Date.now();
      return {
        success: true,
        reconnected: true,
        playerCount: game.players.size,
        players: this.getPlayerList(code),
      };
    }

    if (game.state !== 'lobby')
      return { success: false, error: 'Game already in progress.' };

    for (const [, player] of game.players) {
      if (player.nickname.toLowerCase() === nickLower) {
        return { success: false, error: 'Nickname already taken.' };
      }
    }

    game.players.set(socketId, {
      nickname,
      avatar: avatar || 'ghost',
      score: 0,
      currentAnswer: null,
      answerTime: null,
      streak: 0,
    });

    game.lastActivity = Date.now();

    return {
      success: true,
      reconnected: false,
      playerCount: game.players.size,
      players: this.getPlayerList(code),
    };
  }

  removePlayer(code, socketId, preserveForReconnect = false) {
    const game = this.games.get(code);
    if (!game) return null;
    const player = game.players.get(socketId);
    if (!player) return null;
    game.players.delete(socketId);

    // During active games, save player data for 60s so they can reconnect
    if (preserveForReconnect && game.state !== 'lobby') {
      const nickLower = player.nickname.toLowerCase();
      const timeout = setTimeout(() => {
        game.disconnectedPlayers.delete(nickLower);
      }, 60000);
      game.disconnectedPlayers.set(nickLower, { data: player, timeout });
    }

    return {
      nickname: player.nickname,
      playerCount: game.players.size,
    };
  }

  getPlayerList(code) {
    const game = this.games.get(code);
    if (!game) return [];
    return Array.from(game.players.values()).map((p) => ({
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score,
    }));
  }

  startGame(code, questions) {
    const game = this.games.get(code);
    if (!game) return null;
    if (game.players.size === 0) return null;

    game.questions = questions;
    game.state = 'playing';
    game.currentQuestionIndex = -1;
    game.lastActivity = Date.now();
    return true;
  }

  nextQuestion(code) {
    const game = this.games.get(code);
    if (!game) return null;

    if (game.timer) {
      clearTimeout(game.timer);
      game.timer = null;
    }

    game.currentQuestionIndex++;
    if (game.currentQuestionIndex >= game.questions.length) {
      game.state = 'finished';
      return { finished: true, standings: this.getStandings(code) };
    }

    const q = game.questions[game.currentQuestionIndex];
    game.questionStartTime = Date.now();
    game.lastActivity = Date.now();
    game.state = 'playing';

    for (const [, player] of game.players) {
      player.currentAnswer = null;
      player.answerTime = null;
    }

    return {
      finished: false,
      questionNumber: game.currentQuestionIndex + 1,
      totalQuestions: game.questions.length,
      question: q.question_text,
      options: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d,
      },
      category: q.category_name,
      difficulty: q.difficulty,
      timeLimit: game.settings.timePerQuestion,
      correctOption: q.correct_option,
    };
  }

  submitAnswer(code, socketId, answer) {
    const game = this.games.get(code);
    if (!game || game.state !== 'playing') return null;

    const player = game.players.get(socketId);
    if (!player || player.currentAnswer !== null) return null;

    player.currentAnswer = answer;
    player.answerTime = Date.now() - game.questionStartTime;
    game.lastActivity = Date.now();

    const answeredCount = Array.from(game.players.values()).filter(
      (p) => p.currentAnswer !== null
    ).length;

    return {
      answeredCount,
      totalPlayers: game.players.size,
      allAnswered: answeredCount === game.players.size,
    };
  }

  calculateResults(code) {
    const game = this.games.get(code);
    if (!game) return null;

    const q = game.questions[game.currentQuestionIndex];
    const correctOption = q.correct_option;
    const timeLimit = game.settings.timePerQuestion * 1000;

    const results = [];
    for (const [socketId, player] of game.players) {
      const correct = player.currentAnswer === correctOption;
      let pointsEarned = 0;

      if (correct) {
        const basePoints = 1000;
        const timeFraction = Math.max(
          0,
          1 - (player.answerTime || timeLimit) / timeLimit
        );
        const speedBonus = Math.round(timeFraction * 500);
        pointsEarned = basePoints + speedBonus;
        player.streak++;
        if (player.streak >= 3) {
          pointsEarned += player.streak * 50;
        }
      } else {
        player.streak = 0;
      }

      player.score += pointsEarned;
      results.push({
        socketId,
        nickname: player.nickname,
        avatar: player.avatar,
        answer: player.currentAnswer,
        correct,
        pointsEarned,
        totalScore: player.score,
        streak: player.streak,
      });
    }

    results.sort((a, b) => b.totalScore - a.totalScore);
    results.forEach((r, i) => (r.rank = i + 1));

    game.state = 'showing-results';

    return {
      correctOption,
      correctText: q['option_' + correctOption.toLowerCase()],
      results,
    };
  }

  getStandings(code) {
    const game = this.games.get(code);
    if (!game) return [];
    return Array.from(game.players.values())
      .map((p) => ({ nickname: p.nickname, avatar: p.avatar, score: p.score }))
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }

  findGameBySocket(socketId) {
    for (const [code, game] of this.games) {
      if (game.hostSocketId === socketId) return { code, role: 'host' };
      if (game.players.has(socketId)) return { code, role: 'player' };
    }
    return null;
  }

  removeGame(code) {
    const game = this.games.get(code);
    if (!game) return;
    if (game.timer) clearTimeout(game.timer);
    for (const [, dc] of game.disconnectedPlayers) {
      clearTimeout(dc.timeout);
    }
    this.games.delete(code);
  }
}

module.exports = GameManager;
