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
  completedMeteors: 0,
  maxMeteors: 10,
  currentQ: null,
  meteorY: 10,
  speed: 0.35,
  animFrame: null,
  timerInterval: null,
  isExploding: false,
  isGameOver: false,

  // 手機震動輔助器 (支援 Android/相容瀏覽器)
  vibrate(pattern) {
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  },

  start() {
    this.score = 0;
    this.combo = 0;
    this.timeLeft = 60;
    this.completedMeteors = 0;
    this.isExploding = false;
    this.isGameOver = false;
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
      this.score = 0;
      this.completedMeteors = 0;
      this.isExploding = false;
      this.isGameOver = false;
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
      this.completedMeteors = 0;
      this.isExploding = false;
      this.isGameOver = false;
      heroBtn.classList.add('active');
      relaxBtn.classList.remove('active');
      this.updateScoreDisplay();

      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (this.isGameOver) return;
        this.timeLeft--;
        this.updateScoreDisplay();
        if (this.timeLeft <= 0) {
          clearInterval(this.timerInterval);
          this.isGameOver = true;
          this.cleanup();
          showVictoryModal({
            title: '防衛戰時間到！',
            desc: `時間結束！你在小小英雄模式防衛了 ${this.completedMeteors} 顆隕石，獲得 ${this.score} 分！🚀`,
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
    const progress = `進度：${this.completedMeteors} / ${this.maxMeteors} 顆`;
    if (this.mode === 'hero') {
      const comboText = this.combo > 1 ? ` (${this.combo}連擊🔥)` : '';
      badge.textContent = `${progress} | ⏱️${this.timeLeft}s | 得分：${this.score}${comboText}`;
    } else {
      badge.textContent = `${progress} | 得分：${this.score} (悠閒練習)`;
    }
  },

  nextMeteor() {
    if (this.isGameOver) return;
    this.isExploding = false;
    this.currentQ = getRandomQuestion();
    this.meteorY = 10;
    const meteorEl = document.getElementById('space-meteor');
    const rockEl = meteorEl.querySelector('.meteor-rock');
    if (rockEl) rockEl.textContent = '☄️';
    meteorEl.classList.remove('meteor-exploding');
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
    if (this.isExploding || this.isGameOver) return;
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
      this.isExploding = true;
      sound.playLaser();
      this.drawLaser(ctx, startX, startY, targetX, targetY, true);

      // 1. 射中時手機震動 (約 90ms 俐落回饋)
      this.vibrate(90);

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

        this.completedMeteors++;
        this.updateScoreDisplay();

        // 3. 玩完 10 個就算過關
        if (this.completedMeteors >= this.maxMeteors) {
          this.isGameOver = true;
          this.cleanup();
          sound.playFanfare();
          setTimeout(() => {
            const bonusText = this.mode === 'hero' ? `（小小英雄剩餘時間：${this.timeLeft} 秒）` : '';
            showVictoryModal({
              title: '太空防衛大獲全勝！',
              desc: `太神了！你成功擊落全部 10 顆隕石，完美保衛太空站！得分：${this.score} 分！${bonusText}🚀🌟`,
              emoji: '🏆',
              onReplay: () => this.start(),
              onMenu: () => window.appNavigate('menu')
            });
          }, 400);
        } else {
          this.nextMeteor();
        }
      }, 150);

    } else {
      sound.playBoing();
      this.combo = 0;
      this.updateScoreDisplay();
      this.drawLaser(ctx, startX, startY, startX, startY - 70, false);
      showToast('能量頻率不符，再看一次題目算式！');
    }
  },

  handleMeteorCrash() {
    if (this.isExploding || this.isGameOver) return;
    this.isExploding = true;

    // 2. 隕石掉到下面就會爆炸：劇烈爆炸音效 + 手機長震動 + 畫面震動
    sound.playExplosion();
    this.vibrate([180, 80, 260]);

    const stage = document.getElementById('space-stage');
    const meteorEl = document.getElementById('space-meteor');
    const rockEl = meteorEl.querySelector('.meteor-rock');
    if (rockEl) rockEl.textContent = '💥';
    meteorEl.classList.add('meteor-exploding');
    if (stage) {
      stage.classList.remove('stage-shake');
      void stage.offsetWidth;
      stage.classList.add('stage-shake');
    }

    showToast(`💥 轟！隕石落地爆炸！答案是 ${this.currentQ.text} = ${this.currentQ.ans}，記住了嗎？`);
    this.combo = 0;
    this.completedMeteors++;
    this.updateScoreDisplay();

    setTimeout(() => {
      if (rockEl) rockEl.textContent = '☄️';
      meteorEl.classList.remove('meteor-exploding');
      if (stage) stage.classList.remove('stage-shake');

      // 3. 玩完 10 個就算過關
      if (this.completedMeteors >= this.maxMeteors) {
        this.isGameOver = true;
        this.cleanup();
        showVictoryModal({
          title: '防衛任務結算！',
          desc: `已完成 10 顆隕石防衛！最終得分：${this.score} 分！再玩一次挑戰全數擊落吧！🚀`,
          emoji: '🛰️',
          onReplay: () => this.start(),
          onMenu: () => window.appNavigate('menu')
        });
      } else {
        this.nextMeteor();
      }
    }, 650);
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
      if (meteorEl && field && !this.isExploding && !this.isGameOver) {
        const maxY = field.clientHeight - 90;
        this.meteorY += this.speed;
        if (this.meteorY >= maxY) {
          this.handleMeteorCrash();
        } else {
          meteorEl.style.top = `${this.meteorY}px`;
        }
      }
      if (!this.isGameOver) {
        this.animFrame = requestAnimationFrame(loop);
      }
    };
    loop();
  },

  cleanup() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
};
