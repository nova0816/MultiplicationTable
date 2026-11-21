/* ==========================================================================
   js/app.js - 應用程式主入口與路由控制器 (App Controller)
   ========================================================================== */

import { state, toggleNumber, setNumbers, subscribeStateChange } from './state.js';
import { sound } from './sound.js';
import { Confetti, showToast, closeVictoryModal } from './effects.js';

import { GameMonster } from './games/monster.js';
import { GameFrog } from './games/frog.js';
import { GamePotion } from './games/potion.js';
import { GameSpace } from './games/space.js';
import { GameCards } from './games/cards.js';

const gamesMap = {
  monster: GameMonster,
  frog: GameFrog,
  potion: GamePotion,
  space: GameSpace,
  cards: GameCards
};

let activeGame = null;

// 切換遊戲畫面
export function navigateTo(viewName) {
  sound.playPop();
  closeVictoryModal();

  if (activeGame && activeGame.cleanup) {
    activeGame.cleanup();
  }

  state.currentView = viewName;
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));

  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.add('active');

  const backBtn = document.getElementById('btn-back-home');
  if (viewName === 'menu') {
    backBtn.style.display = 'none';
    activeGame = null;
  } else {
    backBtn.style.display = 'flex';
    activeGame = gamesMap[viewName];
    if (activeGame && activeGame.start) {
      activeGame.start();
    }
  }
}

// 掛載至全域以供彈窗或按鈕呼叫
window.appNavigate = navigateTo;

// 更新頂部練習中數字指示文字
function updateNumbersHeader() {
  const text = state.selectedNumbers.join(', ');
  const el = document.getElementById('header-nums-text');
  if (el) el.textContent = text || '未選擇';
}

// 渲染 1~9 數字膠囊切換鈕
function renderNumberSelector() {
  const container = document.getElementById('num-selector-grid');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 1; i <= 9; i++) {
    const pill = document.createElement('div');
    pill.className = `num-pill ${state.selectedNumbers.includes(i) ? 'selected' : ''}`;
    pill.textContent = i;

    pill.addEventListener('click', () => {
      sound.playPop();
      const success = toggleNumber(i);
      if (!success) {
        showToast('請至少保留 1 個數字練習喔！');
      }
    });

    container.appendChild(pill);
  }
  updateNumbersHeader();
}

// 綁定全域事件
function setupEventListeners() {
  // 返回主選單按鈕
  document.getElementById('btn-back-home').addEventListener('click', () => {
    navigateTo('menu');
  });

  // 音效開關切換
  document.getElementById('btn-toggle-sound').addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    const icon = document.getElementById('sound-icon');
    icon.textContent = state.soundEnabled ? '🔊' : '🔇';
    if (state.soundEnabled) sound.playPop();
  });

  // 數字預設值按鈕
  document.getElementById('btn-preset-all').addEventListener('click', () => {
    sound.playPop();
    setNumbers([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  document.getElementById('btn-preset-basic').addEventListener('click', () => {
    sound.playPop();
    setNumbers([2, 3, 5]);
  });

  document.getElementById('btn-preset-adv').addEventListener('click', () => {
    sound.playPop();
    setNumbers([6, 7, 8, 9]);
  });

  // 主選單 5 大遊戲卡片點擊
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const game = card.getAttribute('data-game');
      navigateTo(game);
    });
  });

  // 當使用者在 iPad 或手機第一次觸碰螢幕時，喚醒解鎖 Web Audio Context
  window.addEventListener('pointerdown', () => {
    sound.init();
  }, { once: true });
}

// 應用程式初始化
window.addEventListener('DOMContentLoaded', () => {
  Confetti.init(document.getElementById('confetti-canvas'));
  renderNumberSelector();
  setupEventListeners();

  // 訂閱狀態變更，自動同步選取狀態
  subscribeStateChange(() => {
    renderNumberSelector();
  });
});
