/* ==========================================================================
   js/games/frog.js - 遊戲 2: 叢林跳跳蛙 (路徑闖關型)
   連續答對 3 題觸發「彩虹加速」一次跳 2 格，踩錯荷葉落水逗趣重試
   ========================================================================== */

import { getRandomQuestion, getDistractorAnswers } from '../state.js';
import { sound } from '../sound.js';
import { showToast, showVictoryModal } from '../effects.js';

export const GameFrog = {
  step: 1,
  totalSteps: 5,
  streak: 0,
  currentQ: null,

  start() {
    this.step = 1;
    this.streak = 0;
    this.updateStepDisplay();
    this.renderStep();
  },

  updateStepDisplay() {
    document.getElementById('frog-step-badge').textContent = `進度：第 ${this.step} / ${this.totalSteps} 步`;
  },

  renderStep() {
    this.currentQ = getRandomQuestion();
    document.getElementById('frog-eq-text').textContent = `${this.currentQ.text} = ?`;

    const container = document.getElementById('frog-pads-container');
    container.innerHTML = '';

    const answers = getDistractorAnswers(this.currentQ.ans, 2);
    answers.forEach(ans => {
      const pad = document.createElement('button');
      pad.className = 'lilypad-btn';
      pad.textContent = ans;

      pad.addEventListener('click', () => {
        this.handleChoice(ans, pad);
      });

      container.appendChild(pad);
    });

    // 青蛙回正
    const frog = document.getElementById('frog-hero');
    frog.style.transform = 'translateX(-50%)';
  },

  handleChoice(selectedAns, padEl) {
    const frog = document.getElementById('frog-hero');
    const padRect = padEl.getBoundingClientRect();
    const startBank = document.querySelector('.frog-start-bank');
    const bankRect = startBank ? startBank.getBoundingClientRect() : frog.getBoundingClientRect();

    const frogCenterX = bankRect.left + bankRect.width / 2;
    const frogCenterY = bankRect.bottom - 45;
    const targetCenterX = padRect.left + padRect.width / 2;
    const targetCenterY = padRect.top + padRect.height / 2;

    const dx = targetCenterX - frogCenterX;
    const dy = targetCenterY - frogCenterY;

    if (selectedAns === this.currentQ.ans) {
      sound.playCorrect();
      this.streak++;
      frog.classList.add('jumping');
      frog.style.transform = `translate(calc(-50% + ${dx}px), ${dy}px) scale(1.15)`;

      let stepJump = 1;
      if (this.streak >= 3) {
        stepJump = 2;
        const banner = document.getElementById('frog-rainbow-banner');
        banner.textContent = `🌈 連對 3 題！啟動彩虹加速，一次跳過兩格！`;
        banner.style.display = 'block';
        showToast('🌈 彩虹衝刺！一次跳兩格！');
        frog.style.filter = 'drop-shadow(0 0 16px #FDE047)';
        setTimeout(() => {
          banner.style.display = 'none';
          frog.style.filter = '';
        }, 1800);
      }

      setTimeout(() => {
        frog.classList.remove('jumping');
        frog.style.transform = 'translateX(-50%)';
        this.step += stepJump;
        if (this.step > this.totalSteps) {
          showVictoryModal({
            title: '到達寶藏終點！',
            desc: '太帥了！小青蛙成功渡河拿到了國王皇冠與寶藏箱！👑',
            emoji: '🐸',
            onReplay: () => this.start(),
            onMenu: () => window.appNavigate('menu')
          });
        } else {
          this.updateStepDisplay();
          this.renderStep();
        }
      }, 650);

    } else {
      sound.playSplash();
      this.streak = 0;
      padEl.classList.add('sink');
      frog.classList.add('jumping');
      frog.style.transform = `translate(calc(-50% + ${dx}px), ${dy + 15}px) scale(0.85)`;
      showToast('撲通！落水了，小青蛙游回來再試一次～ 🏊');

      setTimeout(() => {
        frog.classList.remove('jumping');
        frog.style.transform = 'translateX(-50%)';
        padEl.classList.remove('sink');
      }, 800);
    }
  },

  cleanup() {}
};
