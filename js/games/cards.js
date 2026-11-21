/* ==========================================================================
   js/games/cards.js - 遊戲 5: 親子翻翻樂對決 (記憶對決型)
   支援 12 張/16 張牌自由切換、單人挑戰與雙人親子回合對決
   ========================================================================== */

import { state } from '../state.js';
import { sound } from '../sound.js';
import { showToast, showVictoryModal, Confetti } from '../effects.js';

export const GameCards = {
  isTwoPlayer: false,
  totalCards: 12, // 12 或 16
  turn: 1, // 1: 藍方, 2: 橘方
  scores: { p1: 0, p2: 0 },
  firstCard: null,
  secondCard: null,
  lockBoard: false,

  start() {
    this.scores = { p1: 0, p2: 0 };
    this.turn = 1;
    this.firstCard = null;
    this.secondCard = null;
    this.lockBoard = false;
    this.setupControls();
    this.updateDashboard();
    this.dealCards();
  },

  setupControls() {
    const p1Btn = document.getElementById('tab-card-p1');
    const p2Btn = document.getElementById('tab-card-p2');
    const countBtn = document.getElementById('tab-card-count');
    const restartBtn = document.getElementById('btn-card-restart');

    p1Btn.onclick = () => {
      sound.playPop();
      this.isTwoPlayer = false;
      p1Btn.classList.add('active');
      p2Btn.classList.remove('active');
      document.getElementById('p2-box').style.display = 'none';
      document.getElementById('p1-name-text').textContent = '小勇士';
      this.start();
    };

    p2Btn.onclick = () => {
      sound.playPop();
      this.isTwoPlayer = true;
      p2Btn.classList.add('active');
      p1Btn.classList.remove('active');
      document.getElementById('p2-box').style.display = 'flex';
      document.getElementById('p1-name-text').textContent = '藍方寶貝';
      this.start();
    };

    countBtn.onclick = () => {
      sound.playPop();
      this.totalCards = this.totalCards === 12 ? 16 : 12;
      countBtn.textContent = `${this.totalCards} 張卡牌`;
      this.start();
    };

    restartBtn.onclick = () => {
      sound.playPop();
      this.dealCards();
    };
  },

  updateDashboard() {
    document.getElementById('p1-score-text').textContent = `${this.scores.p1} 對`;
    document.getElementById('p2-score-text').textContent = `${this.scores.p2} 對`;

    const p1Box = document.getElementById('p1-box');
    const p2Box = document.getElementById('p2-box');

    if (this.turn === 1) {
      p1Box.classList.add('active-turn');
      p2Box.classList.remove('active-turn');
    } else {
      p2Box.classList.add('active-turn');
      p1Box.classList.remove('active-turn');
    }
  },

  dealCards() {
    this.firstCard = null;
    this.secondCard = null;
    this.lockBoard = false;

    const pairCount = this.totalCards / 2; // 6 或 8 組
    const pairs = [];
    const pool = state.selectedNumbers.length > 0 ? state.selectedNumbers : [2, 3, 5];

    while (pairs.length < pairCount) {
      const a = pool[Math.floor(Math.random() * pool.length)];
      const b = Math.floor(Math.random() * 9) + 1;
      const ans = a * b;
      const key = `${a}x${b}`;
      if (!pairs.some(p => p.key === key)) {
        pairs.push({
          key,
          equation: `${a} × ${b}`,
          ans: `${ans}`
        });
      }
    }

    let deck = [];
    pairs.forEach((p, idx) => {
      deck.push({ id: idx, pairId: idx, text: p.equation, type: 'eq' });
      deck.push({ id: idx + 100, pairId: idx, text: p.ans, type: 'ans' });
    });

    // 隨機洗牌
    deck.sort(() => Math.random() - 0.5);

    const grid = document.getElementById('card-board-grid');
    grid.innerHTML = '';
    // 依據卡牌數調整網格版型
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';

    deck.forEach(cardData => {
      const card = document.createElement('div');
      card.className = 'flip-card';
      card.dataset.pairId = cardData.pairId;
      card.innerHTML = `
        <div class="card-back">❓</div>
        <div class="card-front">${cardData.text}</div>
      `;

      card.addEventListener('click', () => {
        this.handleCardFlip(card);
      });

      grid.appendChild(card);
    });
  },

  handleCardFlip(card) {
    if (this.lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) return;

    sound.playPop();
    card.classList.add('flipped');

    if (!this.firstCard) {
      this.firstCard = card;
    } else {
      this.secondCard = card;
      this.lockBoard = true;
      this.checkMatch();
    }
  },

  checkMatch() {
    const id1 = this.firstCard.dataset.pairId;
    const id2 = this.secondCard.dataset.pairId;

    if (id1 === id2) {
      sound.playCorrect();
      showToast('配對成功！🎉');
      Confetti.burst(32);

      if (this.turn === 1) this.scores.p1++;
      else this.scores.p2++;
      this.updateDashboard();

      setTimeout(() => {
        this.firstCard.classList.add('matched');
        this.secondCard.classList.add('matched');
        this.resetTurn(true);
        this.checkGameOver();
      }, 500);

    } else {
      sound.playBoing();
      setTimeout(() => {
        this.firstCard.classList.remove('flipped');
        this.secondCard.classList.remove('flipped');
        if (this.isTwoPlayer) {
          this.turn = this.turn === 1 ? 2 : 1;
          this.updateDashboard();
        }
        this.resetTurn(false);
      }, 1100);
    }
  },

  resetTurn(keepTurn) {
    this.firstCard = null;
    this.secondCard = null;
    this.lockBoard = false;
  },

  checkGameOver() {
    const matched = document.querySelectorAll('.flip-card.matched').length;
    if (matched === this.totalCards) {
      let desc = `恭喜完成了全部 ${this.totalCards / 2} 組乘法配對！`;
      if (this.isTwoPlayer) {
        if (this.scores.p1 > this.scores.p2) desc = `藍方寶貝獲勝！(${this.scores.p1} 對 vs ${this.scores.p2} 對)`;
        else if (this.scores.p2 > this.scores.p1) desc = `家長隊伍獲勝！(${this.scores.p2} 對 vs ${this.scores.p1} 對)`;
        else desc = `平手！雙方都記得很熟練喔！(${this.scores.p1} 對)`;
      }
      showVictoryModal({
        title: '卡牌配對大勝利！',
        desc,
        emoji: '🃏',
        onReplay: () => this.start(),
        onMenu: () => window.appNavigate('menu')
      });
    }
  },

  cleanup() {}
};
