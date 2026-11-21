/* ==========================================================================
   js/games/space.js - 遊戲 4: 太空隕石防衛戰 (快速點擊型)
   支援「悠閒練習」與「小小英雄(60秒+連擊Combo)」雙模式，點擊砲台發射雷射
   ========================================================================== */

import { getRandomQuestion, getDistractorAnswers } from '../state.js';
import { sound } from '../sound.js';
import { showToast, showVictoryModal, Confetti } from '../effects.js';

export const GameSpace = {
  mode: 'relax', // 'relax' 或 'hero'
  score: 0,
  combo: 0,
  timeLeft: 60,
  currentQ: null,
  meteorY: 10,
  speed: 0.35,
  animFrame: null,
  timerInterval: null,

  start() {
    this.score = 0;
    this.combo = 0;
    this.timeLeft = 60;
    this.updateScoreDisplay();
    this.setupModes();
    this.nextMeteor();
    this.startLoop();
  },

  setupModes() {
    const relaxBtn = document.getElementById('tab-mode-relax');
    const heroBtn = document.getElementById('tab-mode-hero');

    relaxBtn.onclick = () => {
      sound.playPop();
      this.mode = 'relax';
      this.combo = 0;
      relaxBtn.classList.add('active');
      heroBtn.classList.remove('active');
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.updateScoreDisplay();
      this.nextMeteor();
    };

    heroBtn.onclick = () => {
      sound.playPop();
      this.mode = 'hero';
      this.score = 0;
      this.combo = 0;
      this.timeLeft = 60;
      heroBtn.classList.add('active');
      relaxBtn.classList.remove('active');
      this.updateScoreDisplay();

      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        this.timeLeft--;
        this.updateScoreDisplay();
        if (this.timeLeft <= 0) {
          clearInterval(this.timerInterval);
          showVictoryModal({
            title: '防衛戰時間到！',
            desc: `太帥了！你在小小英雄模式獲得了 ${this.score} 分！高分紀錄保持者！🚀`,
            emoji: '🏆',
            onReplay: () => this.start(),
            onMenu: () => window.appNavigate('menu')
          });
        }
      }, 1000);

      this.nextMeteor();
    };
  },

  updateScoreDisplay() {
    const badge = document.getElementById('space-score-badge');
    if (this.mode === 'hero') {
      const comboText = this.combo > 1 ? ` (連擊 x${this.combo}🔥)` : '';
      badge.textContent = `倒數：${this.timeLeft}s | 得分：${this.score}${comboText}`;
    } else {
      badge.textContent = `得分：${this.score} (悠閒練習)`;
    }
  },

  nextMeteor() {
    this.currentQ = getRandomQuestion();
    this.meteorY = 10;
    const meteorEl = document.getElementById('space-meteor');
    meteorEl.style.top = `${this.meteorY}px`;
    document.getElementById('space-meteor-eq').textContent = this.currentQ.text;

    this.speed = this.mode === 'hero' ? 0.9 : 0.35;

    // 產生 4 座砲台（1 正確 + 3 干擾選項）
    const answers = getDistractorAnswers(this.currentQ.ans, 3);
    const container = document.getElementById('space-turrets-container');
    container.innerHTML = '';

    answers.forEach(ans => {
      const btn = document.createElement('button');
      btn.className = 'turret-btn';
      btn.innerHTML = `
        <div class="turret-icon">🛰️</div>
        <div class="turret-answer">${ans}</div>
      `;
      btn.addEventListener('click', () => {
        this.fireTurret(ans, btn);
      });
      container.appendChild(btn);
    });
  },

  fireTurret(chosenAns, btnEl) {
    const meteorEl = document.getElementById('space-meteor');
    const canvas = document.getElementById('laser-canvas');
    const stage = document.getElementById('space-stage');
    canvas.width = stage.clientWidth;
    canvas.height = stage.clientHeight;
    const ctx = canvas.getContext('2d');

    const btnRect = btnEl.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const startX = btnRect.left + btnRect.width / 2 - stageRect.left;
    const startY = btnRect.top - stageRect.top;

    const meteorRect = meteorEl.getBoundingClientRect();
    const targetX = meteorRect.left + meteorRect.width / 2 - stageRect.left;
    const targetY = meteorRect.top + meteorRect.height / 2 - stageRect.top;

    if (chosenAns === this.currentQ.ans) {
      sound.playLaser();
      this.drawLaser(ctx, startX, startY, targetX, targetY, true);

      setTimeout(() => {
        sound.playCorrect();
        Confetti.burst(30);

        if (this.mode === 'hero') {
          this.combo++;
          const comboBonus = this.combo > 1 ? this.combo * 50 : 0;
          this.score += 100 + comboBonus;
          showToast(`💥 擊碎！${this.combo > 1 ? `連擊 x${this.combo}！+${100 + comboBonus}分` : '+100分'}`);
        } else {
          this.score += 100;
          showToast('💥 擊碎隕石！PERFECT！');
        }

        this.updateScoreDisplay();
        this.nextMeteor();
      }, 150);

    } else {
      sound.playBoing();
      this.combo = 0; // 答錯中斷連擊
      this.updateScoreDisplay();
      this.drawLaser(ctx, startX, startY, startX, startY - 70, false);
      showToast('能量頻率不符，再看一次題目算式！');
    }
  },

  drawLaser(ctx, x1, y1, x2, y2, hit) {
    ctx.save();
    ctx.strokeStyle = hit ? '#38BDF8' : '#F43F5E';
    ctx.lineWidth = hit ? 7 : 4;
    ctx.shadowBlur = 18;
    ctx.shadowColor = hit ? '#0284C7' : '#E11D48';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();

    setTimeout(() => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }, 130);
  },

  startLoop() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    const loop = () => {
      const meteorEl = document.getElementById('space-meteor');
      const field = document.getElementById('space-field');
      if (meteorEl && field) {
        const maxY = field.clientHeight - 90;
        this.meteorY += this.speed;
        if (this.meteorY >= maxY) {
          // 隕石飄落至底護盾
          this.meteorY = 10;
          this.combo = 0;
          this.updateScoreDisplay();
          showToast(`護盾抵擋了！答案是 ${this.currentQ.ans}，記住了嗎？`);
          this.nextMeteor();
        }
        meteorEl.style.top = `${this.meteorY}px`;
      }
      this.animFrame = requestAnimationFrame(loop);
    };
    loop();
  },

  cleanup() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
};
