// Horror Trivia — Sound Effects (Web Audio API, no files needed)
const SFX = (() => {
  let ctx;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function play(fn) {
    try { fn(getCtx()); } catch (e) { /* audio not available */ }
  }

  return {
    correct() {
      play((ctx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(523, ctx.currentTime);
        o.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        o.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + 0.4);
      });
    },

    wrong() {
      play((ctx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(200, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + 0.4);
      });
    },

    tick() {
      play((ctx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(880, ctx.currentTime);
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + 0.08);
      });
    },

    countdown() {
      play((ctx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(440, ctx.currentTime);
        g.gain.setValueAtTime(0.25, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + 0.25);
      });
    },

    gameStart() {
      play((ctx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(523, ctx.currentTime);
        o.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
        o.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
        o.frequency.setValueAtTime(1047, ctx.currentTime + 0.45);
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + 0.7);
      });
    },

    gameOver() {
      play((ctx) => {
        [523, 466, 415, 349].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.25);
          g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.25);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.25 + 0.3);
          o.start(ctx.currentTime + i * 0.25);
          o.stop(ctx.currentTime + i * 0.25 + 0.3);
        });
      });
    },

    playerJoin() {
      play((ctx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(600, ctx.currentTime);
        o.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + 0.2);
      });
    },

    timerWarning() {
      play((ctx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'square';
        o.frequency.setValueAtTime(600, ctx.currentTime);
        g.gain.setValueAtTime(0.1, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + 0.15);
      });
    },
  };
})();
