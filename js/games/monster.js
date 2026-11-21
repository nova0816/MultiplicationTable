/* ==========================================================================
   js/games/monster.js - 遊戲 1: 貪吃怪獸餵食秀 (拖曳配對型)
   針對 iPad 與手機觸控優化，支援 Pointer Events 與點擊雙模式
   ========================================================================== */

import { getRandomQuestion, getDistractorAnswers } from '../state.js';
import { sound } from '../sound.js';
import { showToast, showVictoryModal, Confetti } from '../effects.js';

export const GameMonster = {
  score: 0,
  targetScore: 5,
  currentQ: null,
  foodIcons: ['🍩', '🍔', '🍕', '🍰', '🥞', '🍪'],

  start() {
    this.score = 0;
    this.updateProgress();
    this.nextQuestion();
  },

  nextQuestion() {
    this.currentQ = getRandomQuestion();
    document.getElementById('monster-bubble').textContent = `我要吃 ${this.currentQ.text} ！`;

    // 產生 3 樣食物（1 正確 + 2 干擾選項）
    const answers = getDistractorAnswers(this.currentQ.ans, 2);
    const shelf = document.getElementById('monster-food-shelf');
    shelf.innerHTML = '';

    answers.forEach((ans, idx) => {
      const item = document.createElement('div');
      item.className = 'food-item';
      item.dataset.val = ans;

      const icon = this.foodIcons[idx % this.foodIcons.length];
      item.innerHTML = `
        <div class="food-icon">${icon}</div>
        <div class="food-val">${ans}</div>
      `;

      this.bindDragAndClick(item);
      shelf.appendChild(item);
    });
  },

  bindDragAndClick(el) {
    let isDragging = false;
    let hasMoved = false;
    let startX = 0, startY = 0;

    const mouthDropZone = document.getElementById('monster-mouth-drop-zone');
    const mouthEl = document.getElementById('monster-mouth');
    const tongueEl = document.getElementById('monster-tongue');

    const onPointerDown = (e) => {
      e.preventDefault();
      sound.playPop();
      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;

      el.classList.add('dragging');
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 8) {
        hasMoved = true;
      }
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;

      // 靠近怪獸嘴巴時，怪獸期待張大嘴巴
      const mouthRect = mouthDropZone.getBoundingClientRect();
      const mouthCenterX = mouthRect.left + mouthRect.width / 2;
      const mouthCenterY = mouthRect.top + mouthRect.height / 2;
      const dist = Math.hypot(e.clientX - mouthCenterX, e.clientY - mouthCenterY);

      if (dist < 90) {
        mouthEl.setAttribute('ry', '34');
        mouthEl.setAttribute('fill', '#500724');
        tongueEl.setAttribute('cy', '150');
      } else {
        mouthEl.setAttribute('ry', '26');
        mouthEl.setAttribute('fill', '#831843');
        tongueEl.setAttribute('cy', '142');
      }
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;

      el.classList.remove('dragging');
      el.style.left = '';
      el.style.top = '';

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      mouthEl.setAttribute('ry', '26');
      mouthEl.setAttribute('fill', '#831843');
      tongueEl.setAttribute('cy', '142');

      const foodVal = parseInt(el.dataset.val, 10);

      // 若只是輕點 (Tap)，執行飛入餵食
      if (!hasMoved) {
        this.handleDirectFeed(el, foodVal);
        return;
      }

      // 判定是否拖曳進入怪獸嘴巴 (給予 110px 兒童友善寬容半徑)
      const mouthRect = mouthDropZone.getBoundingClientRect();
      const mouthCenterX = mouthRect.left + mouthRect.width / 2;
      const mouthCenterY = mouthRect.top + mouthRect.height / 2;
      const dist = Math.hypot(e.clientX - mouthCenterX, e.clientY - mouthCenterY);

      if (dist < 110) {
        if (foodVal === this.currentQ.ans) {
          this.onEatSuccess(el);
        } else {
          this.onEatWrong(el);
        }
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
  },

  handleDirectFeed(el, foodVal) {
    const mouthDropZone = document.getElementById('monster-mouth-drop-zone');
    if (foodVal === this.currentQ.ans) {
      el.style.transition = 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
      const mouthRect = mouthDropZone.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const dx = (mouthRect.left + mouthRect.width / 2) - (elRect.left + elRect.width / 2);
      const dy = (mouthRect.top + mouthRect.height / 2) - (elRect.top + elRect.height / 2);
      el.style.transform = `translate(${dx}px, ${dy}px) scale(0.6)`;
      setTimeout(() => {
        this.onEatSuccess(el);
      }, 350);
    } else {
      this.onEatWrong(el);
    }
  },

  onEatSuccess(el) {
    sound.playBurp();
    showToast('嗝～ 好吃！答對了！❤️');
    Confetti.burst(35);

    const bubble = document.getElementById('monster-bubble');
    bubble.textContent = '嗝～ 肚子好滿足！😋';

    el.style.transform = 'scale(0)';
    setTimeout(() => el.remove(), 200);

    this.score++;
    this.updateProgress();

    if (this.score >= this.targetScore) {
      setTimeout(() => {
        showVictoryModal({
          title: '怪獸吃得超級飽！',
          desc: '太厲害了！你成功餵飽怪獸，全部題目都答對了！',
          emoji: '👾',
          onReplay: () => this.start(),
          onMenu: () => window.appNavigate('menu')
        });
      }, 600);
    } else {
      setTimeout(() => {
        this.nextQuestion();
      }, 1100);
    }
  },

  onEatWrong(el) {
    sound.playBoing();
    showToast('咦？怪獸歪頭：好像不是這個味道喔！🤔');

    // 果凍彈簧回彈效果
    el.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    el.style.transform = 'scale(1.2) rotate(15deg)';
    setTimeout(() => {
      el.style.transform = 'scale(1)';
    }, 300);

    const bubble = document.getElementById('monster-bubble');
    bubble.textContent = `這不是 ${this.currentQ.text} 啦～ 再試試看！`;
  },

  updateProgress() {
    document.getElementById('monster-score-text').textContent = `已吃飽：${this.score} / ${this.targetScore}`;
    const pct = Math.round((this.score / this.targetScore) * 100);
    document.getElementById('monster-progress-fill').style.width = `${pct}%`;
    document.getElementById('monster-progress-text').textContent = `飽足感 ${pct}%`;
  },

  cleanup() {}
};
