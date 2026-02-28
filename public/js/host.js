const socket = io();
let timerInterval = null;
let currentCorrectOption = null;

// Avatar emoji map
const avatarEmojis = {
  ghost: '\u{1F47B}', skull: '\u{1F480}', vampire: '\u{1F9DB}', zombie: '\u{1F9DF}',
  pumpkin: '\u{1F383}', bat: '\u{1F987}', spider: '\u{1F577}', witch: '\u{1F9D9}',
  alien: '\u{1F47D}', wolf: '\u{1F43A}', devil: '\u{1F608}', clown: '\u{1F921}',
};

function getAvatarEmoji(avatar) {
  return avatarEmojis[avatar] || avatarEmojis.ghost;
}

// Screens
const setupScreen = document.getElementById('setup-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const questionScreen = document.getElementById('question-screen');
const resultsScreen = document.getElementById('results-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const errorMsg = document.getElementById('error-msg');

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach((el) => el.classList.add('hidden'));
  screen.classList.remove('hidden');
}

// Load categories for host setup
(async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    const categories = await res.json();
    const container = document.getElementById('category-checkboxes');
    categories.forEach((c) => {
      const label = document.createElement('label');
      label.className = 'category-check';
      label.innerHTML = `<input type="checkbox" value="${c.id}" checked> ${escapeHtml(c.name)}`;
      container.appendChild(label);
    });

    // "All" checkbox toggles the rest
    const allCheck = container.querySelector('input[value="all"]');
    allCheck.addEventListener('change', () => {
      container.querySelectorAll('input:not([value="all"])').forEach((cb) => {
        cb.checked = allCheck.checked;
      });
    });
    container.addEventListener('change', (e) => {
      if (e.target.value !== 'all') {
        const boxes = container.querySelectorAll('input:not([value="all"])');
        const allChecked = Array.from(boxes).every((cb) => cb.checked);
        allCheck.checked = allChecked;
      }
    });
  } catch (e) { /* categories will just default to all */ }
})();

// Create game
document.getElementById('create-btn').addEventListener('click', () => {
  const categoryBoxes = document.querySelectorAll('#category-checkboxes input:not([value="all"]):checked');
  const categories = Array.from(categoryBoxes).map((cb) => parseInt(cb.value));
  const allChecked = document.querySelector('#category-checkboxes input[value="all"]').checked;

  const settings = {
    questionCount: parseInt(document.getElementById('question-count').value),
    timePerQuestion: parseInt(document.getElementById('time-limit').value),
    difficulty: document.getElementById('difficulty-select').value,
    categories: allChecked ? [] : categories, // empty = all
  };
  socket.emit('create-game', settings);
});

socket.on('game-created', ({ code }) => {
  document.getElementById('game-code').textContent = code;
  document.getElementById('start-btn').disabled = true;
  showScreen(lobbyScreen);

  // Generate QR code pointing to the join page
  const joinUrl = window.location.origin + '/?code=' + code;
  const qrContainer = document.getElementById('qr-code');
  const qrImg = document.createElement('img');
  qrImg.src = '/api/qr?url=' + encodeURIComponent(joinUrl);
  qrImg.alt = 'QR code to join game';
  qrImg.width = 150;
  qrImg.height = 150;
  qrContainer.innerHTML = '';
  qrContainer.appendChild(qrImg);
});

socket.on('player-joined', ({ nickname, playerCount, players }) => {
  SFX.playerJoin();
  document.getElementById('player-count').textContent = playerCount;
  renderPlayerList(players);
  document.getElementById('start-btn').disabled = false;
});

socket.on('player-left', ({ nickname, playerCount, players }) => {
  document.getElementById('player-count').textContent = playerCount;
  renderPlayerList(players);
  if (playerCount === 0) document.getElementById('start-btn').disabled = true;
});

function renderPlayerList(players) {
  const list = document.getElementById('player-list');
  list.innerHTML = players
    .map((p) => `<li class="player-tag"><span class="player-tag-avatar">${getAvatarEmoji(p.avatar)}</span>${escapeHtml(p.nickname)}</li>`)
    .join('');
}

// Start game
document.getElementById('start-btn').addEventListener('click', () => {
  socket.emit('start-game');
});

socket.on('error-msg', ({ message }) => {
  errorMsg.textContent = message;
  errorMsg.classList.remove('hidden');
  setTimeout(() => errorMsg.classList.add('hidden'), 5000);
});

socket.on('game-started', ({ totalQuestions, playerCount }) => {
  SFX.gameStart();
  document.getElementById('total-players').textContent = playerCount;
});

socket.on('countdown', ({ seconds }) => {
  const countdownScreen = document.getElementById('countdown-screen');
  const countdownNumber = document.getElementById('countdown-number');
  showScreen(countdownScreen);
  let count = seconds;
  countdownNumber.textContent = count;
  const cdInterval = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(cdInterval);
      return;
    }
    countdownNumber.textContent = count;
    SFX.countdown();
  }, 1000);
});

socket.on('question', (data) => {
  showScreen(questionScreen);
  currentCorrectOption = data.correctOption;

  document.getElementById('q-number').textContent = `${data.questionNumber} / ${data.totalQuestions}`;
  document.getElementById('q-category').textContent = data.category;
  document.getElementById('q-difficulty').textContent = data.difficulty;
  document.getElementById('q-text').textContent = data.question;
  document.getElementById('opt-a').textContent = data.options.A;
  document.getElementById('opt-b').textContent = data.options.B;
  document.getElementById('opt-c').textContent = data.options.C;
  document.getElementById('opt-d').textContent = data.options.D;
  document.getElementById('answered-count').textContent = '0';

  // Reset option highlights
  document.querySelectorAll('.host-option').forEach((el) => {
    el.classList.remove('correct-highlight');
  });

  startTimer(data.timeLimit);
});

socket.on('answer-received', ({ answeredCount, totalPlayers }) => {
  document.getElementById('answered-count').textContent = answeredCount;
  document.getElementById('total-players').textContent = totalPlayers;
});

socket.on('question-results', (data) => {
  clearTimer();
  showScreen(resultsScreen);

  // Show correct answer
  const correctDiv = document.getElementById('correct-answer');
  correctDiv.textContent = `${data.correctOption}: ${data.correctText}`;

  // Results list
  const list = document.getElementById('results-list');
  list.innerHTML = data.results
    .map(
      (r) =>
        `<div class="result-row ${r.correct ? 'result-correct' : 'result-wrong'}">
          <span class="result-name"><span class="result-avatar">${getAvatarEmoji(r.avatar)}</span>${escapeHtml(r.nickname)}</span>
          <span class="result-answer">${r.answer || 'No answer'}</span>
          <span class="result-points">+${r.pointsEarned}</span>
        </div>`
    )
    .join('');

  // Leaderboard
  const leaderboard = document.getElementById('leaderboard');
  const sorted = [...data.results].sort((a, b) => b.totalScore - a.totalScore);
  leaderboard.innerHTML = sorted
    .map(
      (r) =>
        `<li class="lb-row">
          <span class="lb-name"><span class="lb-avatar">${getAvatarEmoji(r.avatar)}</span>${escapeHtml(r.nickname)}</span>
          <span class="lb-score">${r.totalScore.toLocaleString()}</span>
        </li>`
    )
    .join('');
});

// Next question
document.getElementById('next-btn').addEventListener('click', () => {
  socket.emit('next-question');
});

socket.on('game-over', ({ standings }) => {
  SFX.gameOver();
  clearTimer();
  showScreen(gameoverScreen);

  // Podium for top 3
  const podium = document.getElementById('podium');
  const top3 = standings.slice(0, 3);
  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd for visual layout
  podium.innerHTML = podiumOrder
    .filter((i) => top3[i])
    .map((i) => {
      const s = top3[i];
      const heights = ['160px', '120px', '90px'];
      return `<div class="podium-place podium-${i + 1}">
        <div class="podium-avatar">${getAvatarEmoji(s.avatar)}</div>
        <div class="podium-name">${escapeHtml(s.nickname)}</div>
        <div class="podium-score">${s.score.toLocaleString()}</div>
        <div class="podium-bar" style="height:${heights[i]}">#${s.rank}</div>
      </div>`;
    })
    .join('');

  // Full standings
  const list = document.getElementById('final-standings');
  list.innerHTML = standings
    .map(
      (s) =>
        `<li class="lb-row">
          <span class="lb-name"><span class="lb-avatar">${getAvatarEmoji(s.avatar)}</span>${escapeHtml(s.nickname)}</span>
          <span class="lb-score">${s.score.toLocaleString()}</span>
        </li>`
    )
    .join('');
});

// Timer
function startTimer(seconds) {
  clearTimer();
  const fill = document.getElementById('timer-fill');
  let remaining = seconds;
  fill.style.width = '100%';
  fill.className = 'timer-fill';

  timerInterval = setInterval(() => {
    remaining -= 0.05;
    const pct = Math.max(0, (remaining / seconds) * 100);
    fill.style.width = pct + '%';
    if (pct < 25) fill.classList.add('timer-danger');
    if (remaining <= 0) clearTimer();
  }, 50);
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
