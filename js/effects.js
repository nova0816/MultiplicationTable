/* ==========================================================================
   js/effects.js - 視覺特效系統 (Confetti 煙火彩紙、Toast 浮層與結算彈窗)
   ========================================================================== */

import { sound } from './sound.js';

// 煙火彩紙特效引擎 (純 Canvas 60fps)
export const Confetti = {
  canvas: null,
  ctx: null,
  particles: [],
  animId: null,

  init(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  burst(count = 65) {
    if (!this.canvas) return;
    const colors = ['#F43F5E', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#EC4899'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2 - 80,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 18,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        alpha: 1
      });
    }
    if (!this.animId) {
      this.loop();
    }
  },

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45; // 重力加速度
      p.rotation += p.rotSpeed;
      p.alpha -= 0.012;

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      this.ctx.restore();

      if (p.alpha <= 0) {
        this.particles.splice(idx, 1);
      }
    });

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.loop());
    } else {
      this.animId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
};

// 浮層提示
let toastTimeout = null;
export function showToast(msg) {
  const t = document.getElementById('global-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    t.classList.remove('show');
  }, 1600);
}

// 結算通關彈窗
export function showVictoryModal({ title, desc, emoji = '🎉', onReplay, onMenu }) {
  sound.playFanfare();
  Confetti.burst(85);

  const modal = document.getElementById('victory-modal');
  document.getElementById('victory-title').textContent = title;
  document.getElementById('victory-desc').textContent = desc;
  document.getElementById('victory-emoji').textContent = emoji;
  modal.style.display = 'flex';

  const replayBtn = document.getElementById('btn-modal-replay');
  replayBtn.onclick = () => {
    closeVictoryModal();
    if (onReplay) onReplay();
  };

  const menuBtn = document.getElementById('btn-modal-menu');
  menuBtn.onclick = () => {
    closeVictoryModal();
    if (onMenu) onMenu();
  };
}

export function closeVictoryModal() {
  const modal = document.getElementById('victory-modal');
  if (modal) modal.style.display = 'none';
}
