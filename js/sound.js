/* ==========================================================================
   js/sound.js - Web Audio API 音效合成引擎
   100% 離線即時音波生成，不依賴任何外部 mp3/wav 音檔，避免 404 或行動端載入問題
   ========================================================================== */

import { state } from './state.js';

class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  // 使用者初次互動時解鎖音訊上下文 (相容 iOS/iPadOS Safari 政策)
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 輕快按鈕點擊音 (Pop)
  playPop() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.08);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // 答對叮咚和弦 (C5 -> E5 -> G5 -> C6)
  playCorrect() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = now + idx * 0.07;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.28, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.26);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(st);
      osc.stop(st + 0.27);
    });
  }

  // 果凍彈跳回彈音 (Boing)
  playBoing() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.15);
    osc.frequency.linearRampToValueAtTime(230, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // 落水水花濺起音 (Splash)
  playSplash() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.25);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // 太空雷射發射光束音 (Laser)
  playLaser() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // 隕石落地劇烈爆炸音效 (重低音 Thump + 低頻白噪音轟鳴)
  playExplosion() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. 低頻重低音 Thump (150Hz -> 35Hz)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.45);
    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    // 2. 劇烈爆炸白噪音 (Noise 經低通濾波從 800Hz 衰減至 50Hz 轟鳴)
    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + 0.55);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  }

  // 振奮高昂的怪獸餵食答對歡慶音效 (清脆大三和弦勝利琶音 + 閃亮鈴聲泛音 + 歡樂共鳴 + 可愛飽嗝)
  playMonsterSuccess() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. 清脆歡欣的上升勝利琶音 (C5 -> E5 -> G5 -> C6 -> E6 -> G6)
    const notes = [
      { f: 523.25, t: 0.00, dur: 0.16, vol: 0.24, type: 'triangle' },
      { f: 659.25, t: 0.05, dur: 0.16, vol: 0.25, type: 'triangle' },
      { f: 783.99, t: 0.10, dur: 0.18, vol: 0.27, type: 'triangle' },
      { f: 1046.50, t: 0.15, dur: 0.28, vol: 0.32, type: 'triangle' },
      { f: 1318.51, t: 0.20, dur: 0.35, vol: 0.28, type: 'triangle' },
      { f: 1567.98, t: 0.25, dur: 0.45, vol: 0.26, type: 'sine' }
    ];

    notes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = now + note.t;
      osc.type = note.type;
      osc.frequency.setValueAtTime(note.f, st);

      gain.gain.setValueAtTime(0.0001, st);
      gain.gain.linearRampToValueAtTime(note.vol, st + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, st + note.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(st);
      osc.stop(st + note.dur + 0.02);

      // 閃爍高頻鈴音泛音 (呈現星光閃閃質感)
      if (note.f >= 783.99) {
        const bellOsc = this.ctx.createOscillator();
        const bellGain = this.ctx.createGain();
        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(note.f * 2, st);
        bellGain.gain.setValueAtTime(0.0001, st);
        bellGain.gain.linearRampToValueAtTime(note.vol * 0.4, st + 0.01);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, st + note.dur * 0.7);
        bellOsc.connect(bellGain);
        bellGain.connect(this.ctx.destination);
        bellOsc.start(st);
        bellOsc.stop(st + note.dur * 0.7 + 0.02);
      }
    });

    // 2. 飽滿的 C 大調背景和弦共鳴 (0.18s 進入，加強振奮與成就感)
    const chordFrequencies = [523.25, 659.25, 1046.50];
    chordFrequencies.forEach(freq => {
      const cOsc = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      const cStart = now + 0.18;
      cOsc.type = 'sine';
      cOsc.frequency.setValueAtTime(freq, cStart);
      cGain.gain.setValueAtTime(0.0001, cStart);
      cGain.gain.linearRampToValueAtTime(0.15, cStart + 0.03);
      cGain.gain.exponentialRampToValueAtTime(0.0001, cStart + 0.45);
      cOsc.connect(cGain);
      cGain.connect(this.ctx.destination);
      cOsc.start(cStart);
      cOsc.stop(cStart + 0.48);
    });

    // 3. 伴隨在和弦中後段的可愛打飽嗝 (Burp) - 幽默逗趣又滿足
    const burpStart = now + 0.28;
    const burpOsc = this.ctx.createOscillator();
    const burpGain = this.ctx.createGain();
    burpOsc.type = 'sawtooth';
    burpOsc.frequency.setValueAtTime(145, burpStart);
    burpOsc.frequency.linearRampToValueAtTime(115, burpStart + 0.08);
    burpOsc.frequency.linearRampToValueAtTime(180, burpStart + 0.18);
    burpGain.gain.setValueAtTime(0.0001, burpStart);
    burpGain.gain.linearRampToValueAtTime(0.28, burpStart + 0.02);
    burpGain.gain.exponentialRampToValueAtTime(0.0001, burpStart + 0.25);
    burpOsc.connect(burpGain);
    burpGain.connect(this.ctx.destination);
    burpOsc.start(burpStart);
    burpOsc.stop(burpStart + 0.26);
  }

  // 怪獸吃飽可愛打飽嗝 (相容舊呼叫，直接導向振奮版)
  playBurp() {
    this.playMonsterSuccess();
  }

  // 大通關歡慶樂章 (Fanfare)
  playFanfare() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = now + idx * 0.1;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.25, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(st);
      osc.stop(st + 0.52);
    });
  }
}

export const sound = new SoundEngine();
