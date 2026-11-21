/* ==========================================================================
   js/games/puzzle.js - 遊戲 6: 乘法方塊大挪移 (算式拼圖解謎型)
   從 2 排開始，每過 3 關增加 1 排，最多 5 排共 12 關大破關！
   ========================================================================== */

import { state } from '../state.js';
import { sound } from '../sound.js';
import { showToast, showVictoryModal, Confetti } from '../effects.js';

export const GamePuzzle = {
  currentLevel: 1,
  totalLevels: 12,
  rowsCount: 2,
  equations: [],
  blocks: [], // 每排為 [valA, valB]
  selectedBlock: null,

  start() {
    this.currentLevel = 1;
    this.setupControls();
    this.loadLevel(this.currentLevel);
  },

  setupControls() {
    const resetBtn = document.getElementById('btn-puzzle-reset');
    const checkBtn = document.getElementById('btn-puzzle-check');

    if (resetBtn) {
      resetBtn.onclick = () => {
        sound.playPop();
        this.shuffleCurrentBlocks();
        this.renderBoard();
        showToast('方塊已重新打亂！');
      };
    }

    if (checkBtn) {
      checkBtn.onclick = () => {
        this.checkAnswer();
      };
    }
  },

  getRowsForLevel(lvl) {
    // 第 1 ~ 3 關: 2 排
    // 第 4 ~ 6 關: 3 排
    // 第 7 ~ 9 關: 4 排
    // 第 10 ~ 12 關: 5 排
    return Math.min(5, Math.floor((lvl - 1) / 3) + 2);
  },

  getTierName(rows) {
    if (rows === 2) return '初級：2 排算式';
    if (rows === 3) return '進階：3 排算式';
    if (rows === 4) return '挑戰：4 排算式';
    return '大師：5 排算式';
  },

  loadLevel(lvl) {
    this.currentLevel = lvl;
    this.rowsCount = this.getRowsForLevel(lvl);
    this.selectedBlock = null;

    const tierBadge = document.getElementById('puzzle-tier-badge');
    const levelBadge = document.getElementById('puzzle-level-badge');
    if (tierBadge) tierBadge.textContent = this.getTierName(this.rowsCount);
    if (levelBadge) levelBadge.textContent = `第 ${this.currentLevel} / ${this.totalLevels} 關`;

    this.generateEquations();
    this.shuffleCurrentBlocks();
    this.renderBoard();
  },

  generateEquations() {
    const pool = state.selectedNumbers.length > 0 ? state.selectedNumbers : [2, 3, 5];
    this.equations = [];
    const usedTargets = new Set();
    let attempts = 0;

    while (this.equations.length < this.rowsCount && attempts < 200) {
      attempts++;
      let a = pool[Math.floor(Math.random() * pool.length)];
      let b = Math.floor(Math.random() * 9) + 1;

      // 若有選 2，2 優先放前面
      if ((b === 2 || a === 2) && state.selectedNumbers.includes(2)) {
        a = 2;
      }

      const target = a * b;
      if (!usedTargets.has(target)) {
        usedTargets.add(target);
        this.equations.push({
          target: target,
          solA: a,
          solB: b
        });
      }
    }

    // 保底填滿行數
    while (this.equations.length < this.rowsCount) {
      const a = pool[Math.floor(Math.random() * pool.length)];
      const b = Math.floor(Math.random() * 9) + 1;
      this.equations.push({
        target: a * b,
        solA: a,
        solB: b
      });
    }
  },

  shuffleCurrentBlocks() {
    const numbers = [];
    this.equations.forEach(eq => {
      numbers.push(eq.solA, eq.solB);
    });

    let isAllCorrect = true;
    let shuffleAttempts = 0;

    // 洗牌直到不是初始完全解完的狀態
    while (isAllCorrect && shuffleAttempts < 50) {
      shuffleAttempts++;
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }

      isAllCorrect = this.equations.every((eq, idx) => {
        const nA = numbers[idx * 2];
        const nB = numbers[idx * 2 + 1];
        return (nA * nB === eq.target);
      });
    }

    this.blocks = [];
    for (let r = 0; r < this.rowsCount; r++) {
      this.blocks.push([
        numbers[r * 2],
        numbers[r * 2 + 1]
      ]);
    }
  },

  renderBoard() {
    const board = document.getElementById('puzzle-board');
    if (!board) return;
    board.innerHTML = '';

    this.equations.forEach((eq, r) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'puzzle-row';
      rowEl.dataset.row = r;
      rowEl.id = `puzzle-row-${r}`;

      const valA = this.blocks[r][0];
      const valB = this.blocks[r][1];

      rowEl.innerHTML = `
        <div class="puzzle-block" data-row="${r}" data-col="0" id="pblock-${r}-0">${valA}</div>
        <div class="puzzle-op">×</div>
        <div class="puzzle-block" data-row="${r}" data-col="1" id="pblock-${r}-1">${valB}</div>
        <div class="puzzle-eq">=</div>
        <div class="puzzle-target">${eq.target}</div>
        <div class="puzzle-status-icon" id="pstatus-${r}"></div>
      `;

      const blockA = rowEl.querySelector(`#pblock-${r}-0`);
      const blockB = rowEl.querySelector(`#pblock-${r}-1`);
      blockA.addEventListener('click', () => this.handleBlockClick(r, 0, blockA));
      blockB.addEventListener('click', () => this.handleBlockClick(r, 1, blockB));

      board.appendChild(rowEl);
    });
  },

  handleBlockClick(row, col, blockEl) {
    sound.playPop();

    // 移除之前的錯誤標示
    document.querySelectorAll('.puzzle-row').forEach(r => {
      r.classList.remove('row-wrong');
    });

    if (!this.selectedBlock) {
      this.selectedBlock = { row, col, el: blockEl };
      blockEl.classList.add('selected');
      return;
    }

    // 點同一個方塊取消選取
    if (this.selectedBlock.row === row && this.selectedBlock.col === col) {
      blockEl.classList.remove('selected');
      this.selectedBlock = null;
      return;
    }

    // 兩方塊交換
    const prev = this.selectedBlock;
    prev.el.classList.remove('selected');

    const val1 = this.blocks[prev.row][prev.col];
    const val2 = this.blocks[row][col];

    this.blocks[prev.row][prev.col] = val2;
    this.blocks[row][col] = val1;

    prev.el.textContent = val2;
    blockEl.textContent = val1;

    prev.el.style.transform = 'scale(1.15)';
    blockEl.style.transform = 'scale(1.15)';
    setTimeout(() => {
      prev.el.style.transform = '';
      blockEl.style.transform = '';
    }, 180);

    this.selectedBlock = null;
  },

  checkAnswer() {
    let allCorrect = true;
    let correctCount = 0;

    this.equations.forEach((eq, r) => {
      const valA = this.blocks[r][0];
      const valB = this.blocks[r][1];
      const isRowCorrect = (valA * valB === eq.target);

      const rowEl = document.getElementById(`puzzle-row-${r}`);
      const statusIcon = document.getElementById(`pstatus-${r}`);

      if (rowEl && statusIcon) {
        rowEl.classList.remove('row-correct', 'row-wrong');
        void rowEl.offsetWidth; // 強制重繪動畫

        if (isRowCorrect) {
          rowEl.classList.add('row-correct');
          statusIcon.textContent = '✓';
          correctCount++;
        } else {
          rowEl.classList.add('row-wrong');
          statusIcon.textContent = '✗';
          allCorrect = false;
        }
      }
    });

    if (allCorrect) {
      sound.playMonsterSuccess();
      Confetti.burst(50);
      showToast('🎉 太棒了！全部算式配對正確！');

      if (this.currentLevel >= this.totalLevels) {
        setTimeout(() => {
          showVictoryModal(
            '大破關！全能乘法大師！',
            '恭喜你通關了全部 12 道方塊大挪移挑戰，連五排算式也難不倒你！太厲害了！🏆✨',
            '🧩',
            () => this.start()
          );
        }, 600);
      } else {
        const nextLvl = this.currentLevel + 1;
        const nextRows = this.getRowsForLevel(nextLvl);
        if (nextRows > this.rowsCount) {
          setTimeout(() => {
            showToast(`🚀 晉級！接下來挑戰更厲害的 ${nextRows} 排算式！`);
          }, 400);
        }
        setTimeout(() => {
          this.loadLevel(nextLvl);
        }, 1200);
      }
    } else {
      sound.playBoing();
      try {
        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
          navigator.vibrate(80);
        }
      } catch (e) {}

      showToast(`還有 ${this.rowsCount - correctCount} 排算式不對喔，再調換方塊試試看！💪`);
    }
  },

  cleanup() {
    this.selectedBlock = null;
  }
};
