// Sistema de audio procedural basado en Web Audio API (sin archivos externos)
window.GameAudio = (function () {
  let ctx = null;
  let muted = false;

  function ensureContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playNoise(duration, filterFreq, gainVal, type = 'bandpass') {
    const audioCtx = ensureContext();
    if (!audioCtx || muted) return;

    const bufferSize = Math.floor(audioCtx.sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(filterFreq, audioCtx.currentTime);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    source.start();
  }

  function playTone(freqStart, freqEnd, duration, wave = 'square', gainVal = 0.1) {
    const audioCtx = ensureContext();
    if (!audioCtx || muted) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  return {
    init() {
      ensureContext();
    },
    isMuted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    shoot(weaponId) {
      if (muted) return;
      switch (weaponId) {
        case 'pistol':
          playNoise(0.08, 1200, 0.14);
          playTone(260, 80, 0.07, 'triangle', 0.09);
          break;
        case 'smg':
          playNoise(0.055, 1600, 0.11);
          playTone(320, 110, 0.05, 'sawtooth', 0.06);
          break;
        case 'shotgun':
          playNoise(0.18, 700, 0.24, 'lowpass');
          playTone(150, 42, 0.15, 'sawtooth', 0.14);
          break;
        case 'rifle':
          playNoise(0.1, 1000, 0.16);
          playTone(210, 65, 0.09, 'sawtooth', 0.09);
          break;
        case 'plasma':
          playTone(720, 190, 0.11, 'sine', 0.11);
          playTone(460, 120, 0.09, 'triangle', 0.07);
          break;
        default:
          playNoise(0.08, 1100, 0.12);
      }
    },
    enemyShoot() {
      playNoise(0.06, 850, 0.06);
    },
    reload() {
      playTone(420, 560, 0.07, 'triangle', 0.07);
      setTimeout(() => playTone(560, 740, 0.08, 'triangle', 0.07), 90);
    },
    coin() {
      playTone(880, 1320, 0.07, 'sine', 0.08);
      setTimeout(() => playTone(1320, 1760, 0.09, 'sine', 0.07), 55);
    },
    heal() {
      playTone(440, 660, 0.12, 'sine', 0.08);
      setTimeout(() => playTone(660, 880, 0.14, 'sine', 0.08), 90);
    },
    hit() {
      playTone(180, 90, 0.05, 'square', 0.05);
    },
    playerHurt() {
      playTone(160, 60, 0.14, 'sawtooth', 0.13);
    },
    explosion() {
      playNoise(0.42, 320, 0.32, 'lowpass');
      playTone(110, 28, 0.35, 'sawtooth', 0.18);
    },
    upgrade() {
      playTone(523, 659, 0.08, 'triangle', 0.09);
      setTimeout(() => playTone(659, 784, 0.08, 'triangle', 0.09), 70);
      setTimeout(() => playTone(784, 1046, 0.14, 'triangle', 0.1), 140);
    },
    levelComplete() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((n, idx) => {
        setTimeout(() => playTone(n, n * 1.03, 0.14, 'triangle', 0.09), idx * 95);
      });
    },
    gameOver() {
      const notes = [330, 277, 220, 146];
      notes.forEach((n, idx) => {
        setTimeout(() => playTone(n, n * 0.92, 0.2, 'sawtooth', 0.09), idx * 130);
      });
    },
  };
})();
