const socket = io();
let timerInterval = null;

// DOM elements
const joinForm = document.getElementById('join-form');
const codeInput = document.getElementById('code-input');
const nicknameInput = document.getElementById('nickname-input');
const errorMsg = document.getElementById('error-msg');
const lobbyScreen = document.getElementById('lobby-screen');
const questionScreen = document.getElementById('question-screen');
const waitingScreen = document.getElementById('waiting-screen');
const resultScreen = document.getElementById('result-screen');
const gameoverScreen = document.getElementById('gameover-screen');

function showScreen(screen) {
  document
    .querySelectorAll('.screen, .join-form, .tagline')
    .forEach((el) => el.classList.add('hidden'));
  if (screen) screen.classList.remove('hidden');
}

// Auto-uppercase game code
codeInput.addEventListener('input', () => {
  codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z]/g, '');
});

// Join game
joinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  errorMsg.classList.add('hidden');
  const code = codeInput.value.trim();
  const nickname = nicknameInput.value.trim();
  if (!code || !nickname) return;
  socket.emit('join-game', { code, nickname });
});

socket.on('joined', ({ success, error, nickname }) => {
  if (!success) {
    errorMsg.textContent = error;
    errorMsg.classList.remove('hidden');
    return;
  }
  document.getElementById('player-nickname').textContent = nickname;
  showScreen(lobbyScreen);
});

socket.on('game-started', () => {
  // Wait for first question
});

socket.on('question', (data) => {
  showScreen(questionScreen);
  document.getElementById('q-number').textContent = `${data.questionNumber} / ${data.totalQuestions}`;
  document.getElementById('q-category').textContent = data.category;
  document.getElementById('q-text').textContent = data.question;

  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach((btn) => {
    const opt = btn.dataset.option;
    btn.querySelector('.option-text').textContent = data.options[opt];
    btn.disabled = false;
    btn.classList.remove('selected', 'correct', 'wrong');
  });

  startTimer(data.timeLimit);
});

// Option click
document.querySelectorAll('.option-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    document.querySelectorAll('.option-btn').forEach((b) => {
      b.disabled = true;
    });
    btn.classList.add('selected');
    socket.emit('submit-answer', { answer: btn.dataset.option });
    clearTimer();
    showScreen(waitingScreen);
  });
});

socket.on('answer-result', (data) => {
  showScreen(resultScreen);
  const icon = document.getElementById('result-icon');
  const title = document.getElementById('result-title');
  const correct = document.getElementById('result-correct');

  if (data.correct) {
    icon.textContent = '\u2713';
    icon.className = 'result-icon correct';
    title.textContent = 'Correct!';
    if (data.streak >= 3) {
      title.textContent = `Correct! ${data.streak} streak!`;
    }
  } else {
    icon.textContent = '\u2717';
    icon.className = 'result-icon wrong';
    title.textContent = 'Wrong!';
  }
  correct.textContent = `Answer: ${data.correctOption} \u2014 ${data.correctText}`;
  document.getElementById('points-earned').textContent = `+${data.pointsEarned}`;
  document.getElementById('total-score').textContent = data.totalScore.toLocaleString();
  document.getElementById('player-rank').textContent = `#${data.rank}`;
});

socket.on('game-over', ({ standings }) => {
  showScreen(gameoverScreen);

  // Find this player
  const myNickname = document.getElementById('player-nickname').textContent;
  const me = standings.find((s) => s.nickname === myNickname);

  document.getElementById('final-rank').textContent = me
    ? `#${me.rank}`
    : '';
  document.getElementById('final-score').textContent = me
    ? `${me.score.toLocaleString()} points`
    : '';

  const list = document.getElementById('standings-list');
  list.innerHTML = standings
    .map(
      (s) =>
        `<div class="standing-row ${s.nickname === myNickname ? 'standing-me' : ''}">
          <span class="standing-rank">#${s.rank}</span>
          <span class="standing-name">${escapeHtml(s.nickname)}</span>
          <span class="standing-score">${s.score.toLocaleString()}</span>
        </div>`
    )
    .join('');
});

socket.on('host-disconnected', () => {
  showScreen(null);
  errorMsg.textContent = 'The host has disconnected.';
  errorMsg.classList.remove('hidden');
  joinForm.classList.remove('hidden');
  document.querySelector('.tagline').classList.remove('hidden');
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
    if (remaining <= 0) {
      clearTimer();
      // Auto-submit no answer
      document.querySelectorAll('.option-btn').forEach((b) => (b.disabled = true));
      showScreen(waitingScreen);
    }
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
