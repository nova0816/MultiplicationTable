/* ==========================================================================
   js/games/sliding.js - 遊戲 7: 九九乘法滑動拼圖 (Multiplication Sliding Puzzle)
   3x3 經典 8-Puzzle 拼圖 + 九九乘法橫向算式還原 + Peppa Pig 可愛插畫背景
   ========================================================================== */

import { state } from '../state.js';
import { sound } from '../sound.js';
import { showToast, showVictoryModal, Confetti } from '../effects.js';

export const GameSliding = {
  themes: [
    { id: 'dinosaur', name: '🦖 恐龍先生', file: 'assets/puzzle/ep18_dinosaur.png' },
    { id: 'rocket',   name: '🚀 太空火箭', file: 'assets/puzzle/ep2_rocket.png' },
    { id: 'rabbit',   name: '🐰 可愛兔兔', file: 'assets/puzzle/ep31_rabbit.png' },
    { id: 'cake',     name: '🍰 生日蛋糕', file: 'assets/puzzle/ep18_cake.png' },
    { id: 'lion',     name: '🦁 歡樂小獅', file: 'assets/puzzle/ep29_lion.png' },
    { id: 'balloon',  name: '🎈 夢幻熱球', file: 'assets/puzzle/ep17_balloon.png' },
    { id: 'treasure', name: '🏴‍☠️ 藏寶箱',   file: 'assets/puzzle/ep2_treasure.png' },
    { id: 'toy',      name: '🧸 歡樂玩具', file: 'assets/puzzle/ep11_toy.png' }
  ],
  currentThemeIndex: 0,
  equations: [], // 3 組算式: [E0, E1, E2]
  tileDefs: [],  // 9 塊拼圖定義: [0..7 可移動, 8 勝利補齊塊]
  board: [],     // 9 個位置: board[pos] = tileId (0..7, 或 8 代表空格)
  emptyPos: 8,
  moves: 0,
  isWon: false,
  controlsBound: false,
  hintTimer: null,

  start() {
    this.setupControls();
    this.renderThemeBar();
    this.newGame();
  },

  setupControls() {
    if (this.controlsBound) return;
    this.controlsBound = true;

    const previewBtn = document.getElementById('btn-sliding-preview');
    const shuffleBtn = document.getElementById('btn-sliding-shuffle');
    const newBtn = document.getElementById('btn-sliding-new');
    const hintOverlay = document.getElementById('sliding-hint-overlay');

    if (previewBtn) {
      previewBtn.onclick = () => this.previewHint();
    }
    if (hintOverlay) {
      hintOverlay.onclick = () => {
        if (this.hintTimer) clearTimeout(this.hintTimer);
        hintOverlay.classList.remove('show');
      };
    }
    if (shuffleBtn) {
      shuffleBtn.onclick = () => {
        sound.playPop();
        this.shuffleCurrent();
        showToast('🔄 已重新打亂拼圖！');
      };
    }
    if (newBtn) {
      newBtn.onclick = () => {
        sound.playPop();
        this.newGame();
        showToast('🎲 換了 3 組全新的乘法題目！');
      };
    }

    // 鍵盤方向鍵支援
    window.addEventListener('keydown', (e) => {
      if (state.currentView !== 'sliding' || this.isWon) return;
      const r = Math.floor(this.emptyPos / 3);
      const c = this.emptyPos % 3;
      let target = -1;
      if (e.key === 'ArrowUp' && r < 2) target = this.emptyPos + 3;
      else if (e.key === 'ArrowDown' && r > 0) target = this.emptyPos - 3;
      else if (e.key === 'ArrowLeft' && c < 2) target = this.emptyPos + 1;
      else if (e.key === 'ArrowRight' && c > 0) target = this.emptyPos - 1;

      if (target >= 0) {
        e.preventDefault();
        this.moveTileAtPos(target);
      }
    });

    // 觸控手勢滑動支援
    const boardEl = document.getElementById('sliding-board');
    if (boardEl) {
      let touchX = 0, touchY = 0;
      boardEl.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          touchX = e.touches[0].clientX;
          touchY = e.touches[0].clientY;
        }
      }, { passive: true });

      boardEl.addEventListener('touchend', (e) => {
        if (this.isWon || e.changedTouches.length === 0) return;
        const dx = e.changedTouches[0].clientX - touchX;
        const dy = e.changedTouches[0].clientY - touchY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (Math.max(absDx, absDy) < 25) return;

        const r = Math.floor(this.emptyPos / 3);
        const c = this.emptyPos % 3;
        let target = -1;
        if (absDx > absDy) {
          if (dx > 0 && c > 0) target = this.emptyPos - 1;
          else if (dx < 0 && c < 2) target = this.emptyPos + 1;
        } else {
          if (dy > 0 && r > 0) target = this.emptyPos - 3;
          else if (dy < 0 && r < 2) target = this.emptyPos + 3;
        }

        if (target >= 0) {
          this.moveTileAtPos(target);
        }
      }, { passive: true });
    }
  },

  renderThemeBar() {
    const bar = document.getElementById('sliding-theme-bar');
    if (!bar) return;
    bar.innerHTML = '';

    this.themes.forEach((th, idx) => {
      const pill = document.createElement('div');
      pill.className = `theme-pill ${idx === this.currentThemeIndex ? 'active' : ''}`;
      pill.textContent = th.name;
      pill.onclick = () => {
        sound.playPop();
        this.setTheme(idx);
      };
      bar.appendChild(pill);
    });
  },

  setTheme(idx) {
    this.currentThemeIndex = idx;
    document.querySelectorAll('.theme-pill').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });
    const currentTheme = this.themes[this.currentThemeIndex];

    for (let tileId = 0; tileId < 9; tileId++) {
      const tileEl = document.getElementById(`sliding-tile-${tileId}`);
      if (tileEl) {
        tileEl.style.backgroundImage = `url('${currentTheme.file}')`;
      }
    }
  },

  previewHint() {
    sound.playPop();
    const overlay = document.getElementById('sliding-hint-overlay');
    if (!overlay) return;

    const eq0 = document.getElementById('hint-eq-0');
    const eq1 = document.getElementById('hint-eq-1');
    const eq2 = document.getElementById('hint-eq-2');
    if (eq0 && this.equations[0]) eq0.textContent = `${this.equations[0].solA} × ${this.equations[0].solB} = ${this.equations[0].target}`;
    if (eq1 && this.equations[1]) eq1.textContent = `${this.equations[1].solA} × ${this.equations[1].solB} = ${this.equations[1].target}`;
    if (eq2 && this.equations[2]) eq2.textContent = `${this.equations[2].solA} × ${this.equations[2].solB} = ${this.equations[2].target}`;

    overlay.classList.add('show');

    if (this.hintTimer) clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => {
      overlay.classList.remove('show');
    }, 3000);
  },

  generateEquations() {
    const pool = state.selectedNumbers.length > 0 ? state.selectedNumbers : [2, 3, 5];
    const equations = [];
    const usedTargets = new Set();
    const usedPairs = new Set();
    let attempts = 0;

    while (equations.length < 3 && attempts < 300) {
      attempts++;
      let a = pool[Math.floor(Math.random() * pool.length)];
      let b = Math.floor(Math.random() * 9) + 1;

      // 若有選 2，2 必須在前面 (例如 2 x 7，不能 7 x 2)
      if ((b === 2 || a === 2) && state.selectedNumbers.includes(2)) {
        a = 2;
        if (b === 2) b = Math.floor(Math.random() * 8) + 2;
      }

      const target = a * b;
      const pairKey = `${Math.min(a, b)}-${Math.max(a, b)}`;

      if (!usedTargets.has(target) && !usedPairs.has(pairKey)) {
        usedTargets.add(target);
        usedPairs.add(pairKey);
        equations.push({ solA: a, solB: b, target: target });
      }
    }

    while (equations.length < 3) {
      const a = pool[0];
      const b = equations.length + 2;
      equations.push({ solA: a, solB: b, target: a * b });
    }

    this.equations = equations;
  },

  setupTileDefs() {
    const eq = this.equations;
    this.tileDefs = [
      { id: 0, text: `${eq[0].solA} ×`, type: 'multiplicand', origRow: 0, origCol: 0 },
      { id: 1, text: `${eq[0].solB} =`, type: 'multiplier',   origRow: 0, origCol: 1 },
      { id: 2, text: `${eq[0].target}`, type: 'product',      origRow: 0, origCol: 2 },
      { id: 3, text: `${eq[1].solA} ×`, type: 'multiplicand', origRow: 1, origCol: 0 },
      { id: 4, text: `${eq[1].solB} =`, type: 'multiplier',   origRow: 1, origCol: 1 },
      { id: 5, text: `${eq[1].target}`, type: 'product',      origRow: 1, origCol: 2 },
      { id: 6, text: `${eq[2].solA} ×`, type: 'multiplicand', origRow: 2, origCol: 0 },
      { id: 7, text: `${eq[2].solB} =`, type: 'multiplier',   origRow: 2, origCol: 1 },
      { id: 8, text: `${eq[2].target}`, type: 'product',      origRow: 2, origCol: 2 }
    ];
  },

  getAdjacent(pos) {
    const r = Math.floor(pos / 3);
    const c = pos % 3;
    const list = [];
    if (r > 0) list.push(pos - 3);
    if (r < 2) list.push(pos + 3);
    if (c > 0) list.push(pos - 1);
    if (c < 2) list.push(pos + 1);
    return list;
  },

  shuffleBoard(steps = 60) {
    let cur = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    let empty = 8;
    let lastMovedTile = -1;

    for (let i = 0; i < steps; i++) {
      const adj = this.getAdjacent(empty).filter(p => cur[p] !== lastMovedTile);
      const chosenPos = adj[Math.floor(Math.random() * adj.length)];
      const movedTile = cur[chosenPos];
      cur[empty] = movedTile;
      cur[chosenPos] = 8;
      lastMovedTile = movedTile;
      empty = chosenPos;
    }

    const isSolved = cur.every((t, idx) => t === idx);
    if (isSolved) {
      return this.shuffleBoard(steps + 10);
    }
    return { board: cur, emptyPos: empty };
  },

  newGame() {
    this.isWon = false;
    this.moves = 0;
    this.updateMovesDisplay();

    const boardEl = document.getElementById('sliding-board');
    if (boardEl) boardEl.classList.remove('board-won');

    this.generateEquations();
    this.setupTileDefs();

    const shuffled = this.shuffleBoard(60);
    this.board = shuffled.board;
    this.emptyPos = shuffled.emptyPos;

    this.renderBoardDom();
    this.setTheme(this.currentThemeIndex);
  },

  shuffleCurrent() {
    this.isWon = false;
    this.moves = 0;
    this.updateMovesDisplay();

    const boardEl = document.getElementById('sliding-board');
    if (boardEl) boardEl.classList.remove('board-won');

    const shuffled = this.shuffleBoard(60);
    this.board = shuffled.board;
    this.emptyPos = shuffled.emptyPos;

    this.updateTilesPosition(false);
  },

  renderBoardDom() {
    const boardEl = document.getElementById('sliding-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    // 9 個格座底板
    for (let pos = 0; pos < 9; pos++) {
      const r = Math.floor(pos / 3);
      const c = pos % 3;
      const slot = document.createElement('div');
      slot.className = 'sliding-slot';
      slot.dataset.pos = pos;
      slot.style.left = `calc(var(--board-pad) + ${c} * ((100% - 2 * var(--board-pad) - 2 * var(--board-gap)) / 3 + var(--board-gap)))`;
      slot.style.top = `calc(var(--board-pad) + ${r} * ((100% - 2 * var(--board-pad) - 2 * var(--board-gap)) / 3 + var(--board-gap)))`;
      slot.style.width = `calc((100% - 2 * var(--board-pad) - 2 * var(--board-gap)) / 3)`;
      slot.style.height = `calc((100% - 2 * var(--board-pad) - 2 * var(--board-gap)) / 3)`;

      if (pos === 8) {
        slot.innerHTML = `
          <div class="slot-target-clue">
            <span class="clue-tag">第 3 列目標</span>
            <span class="clue-val">${this.equations[2].target}</span>
          </div>
        `;
      }
      boardEl.appendChild(slot);
    }

    const currentTheme = this.themes[this.currentThemeIndex];

    // 9 塊拼圖塊 (0~7 可移動，8 勝利時補齊)
    for (let tileId = 0; tileId < 9; tileId++) {
      const def = this.tileDefs[tileId];
      const tileEl = document.createElement('div');
      tileEl.className = 'sliding-tile';
      tileEl.id = `sliding-tile-${tileId}`;
      tileEl.dataset.tileId = tileId;
      tileEl.style.backgroundImage = `url('${currentTheme.file}')`;
      tileEl.style.backgroundPosition = `${def.origCol * 50}% ${def.origRow * 50}%`;
      tileEl.style.width = `calc((100% - 2 * var(--board-pad) - 2 * var(--board-gap)) / 3)`;
      tileEl.style.height = `calc((100% - 2 * var(--board-pad) - 2 * var(--board-gap)) / 3)`;

      tileEl.innerHTML = `
        <div class="tile-badge badge-${def.type}">
          <span class="badge-text">${def.text}</span>
        </div>
      `;

      if (tileId === 8) {
        tileEl.style.display = 'none';
      }

      tileEl.addEventListener('click', () => {
        if (this.isWon) return;
        const currentPos = this.board.indexOf(tileId);
        if (currentPos >= 0) {
          this.moveTileAtPos(currentPos);
        }
      });

      boardEl.appendChild(tileEl);
    }

    this.updateTilesPosition(false);
  },

  updateTilesPosition(animate = true) {
    this.board.forEach((tileId, pos) => {
      if (tileId === 8) return;
      const tileEl = document.getElementById(`sliding-tile-${tileId}`);
      if (!tileEl) return;

      const r = Math.floor(pos / 3);
      const c = pos % 3;

      if (!animate) {
        tileEl.style.transition = 'none';
      } else {
        tileEl.style.transition = 'left 0.22s cubic-bezier(0.2, 0, 0, 1), top 0.22s cubic-bezier(0.2, 0, 0, 1)';
      }

      tileEl.style.left = `calc(var(--board-pad) + ${c} * ((100% - 2 * var(--board-pad) - 2 * var(--board-gap)) / 3 + var(--board-gap)))`;
      tileEl.style.top = `calc(var(--board-pad) + ${r} * ((100% - 2 * var(--board-pad) - 2 * var(--board-gap)) / 3 + var(--board-gap)))`;

      if (!animate) {
        void tileEl.offsetWidth;
        tileEl.style.transition = '';
      }
    });
  },

  moveTileAtPos(pos) {
    if (this.isWon) return;
    const adj = this.getAdjacent(pos);
    if (!adj.includes(this.emptyPos)) {
      return;
    }

    sound.playPop();
    const tileId = this.board[pos];
    this.board[this.emptyPos] = tileId;
    this.board[pos] = 8;
    this.emptyPos = pos;

    this.moves++;
    this.updateMovesDisplay();
    this.updateTilesPosition(true);

    this.checkWin();
  },

  updateMovesDisplay() {
    const el = document.getElementById('sliding-move-count');
    if (el) el.textContent = this.moves;
  },

  checkWin() {
    const won = this.board.every((t, i) => t === i);
    if (won && !this.isWon) {
      this.isWon = true;
      this.triggerWin();
    }
  },

  triggerWin() {
    const boardEl = document.getElementById('sliding-board');
    if (boardEl) boardEl.classList.add('board-won');

    // 補齊第 8 格缺塊
    const tile8 = document.getElementById('sliding-tile-8');
    if (tile8) {
      tile8.style.display = 'flex';
      const r = 2, c = 2;
      tile8.style.left = `calc(var(--board-pad) + ${c} * ((100% - 2 * var(--board-pad) - 2 * var(--board-gap)) / 3 + var(--board-gap)))`;
      tile8.style.top = `calc(var(--board-pad) + ${r} * ((100% - 2 * var(--board-pad) - 2 * var(--board-gap)) / 3 + var(--board-gap)))`;
      tile8.style.opacity = '0';
      tile8.style.transform = 'scale(0.8)';
      setTimeout(() => {
        tile8.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        tile8.style.opacity = '1';
        tile8.style.transform = 'scale(1)';
      }, 80);
    }

    sound.playMonsterSuccess();
    Confetti.burst(60);
    showToast('🎉 太神了！拼圖完整還原！乘法大師！');

    // 依序高亮慶祝三列算式方塊
    for (let row = 0; row < 3; row++) {
      setTimeout(() => {
        sound.playPop();
        for (let c = 0; c < 3; c++) {
          const tileId = row * 3 + c;
          const tileEl = document.getElementById(`sliding-tile-${tileId}`);
          if (tileEl) {
            tileEl.style.transform = 'scale(1.08)';
            setTimeout(() => { tileEl.style.transform = ''; }, 260);
          }
        }
      }, 400 + row * 400);
    }

    // 彈出過關獲勝彈窗
    setTimeout(() => {
      const th = this.themes[this.currentThemeIndex];
      const eqList = this.equations.map(e => `${e.solA} × ${e.solB} = ${e.target}`).join('　|　');
      showVictoryModal(
        '拼圖大成功！乘法神童！',
        `太厲害了！你僅用了 ${this.moves} 步，成功拼出了可愛的【${th.name}】插畫！\n${eqList} 🏆✨`,
        '🖼️',
        () => this.newGame()
      );
    }, 1800);
  },

  cleanup() {
    this.isWon = false;
  }
};
