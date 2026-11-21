/* ==========================================================================
   js/games/potion.js - 遊戲 3: 魔法藥水調配師 (逆向拆解型)
   給目標能量值，小朋友從 1~9 材料中挑選 2 個因數相乘，培養靈活數感
   ========================================================================== */

import { state } from '../state.js';
import { sound } from '../sound.js';
import { showToast, showVictoryModal, Confetti } from '../effects.js';

export const GamePotion = {
  completedCount: 0,
  targetGoal: 5,
  targetProduct: 24,
  selectedBottles: [],
  potionIcons: ['💧', '🌿', '🍓', '💎', '🍄', '✨', '🍃', '🐉', '🔮'],
  customers: [
    { name: '森林精靈露露', icon: '🧝‍♀️' },
    { name: '魔法貓咪米米', icon: '🐱' },
    { name: '智慧貓頭鷹博士', icon: '🦉' },
    { name: '噴火小萌龍波波', icon: '🐲' },
    { name: '狐狸鍊金術士', icon: '🦊' }
  ],

  start() {
    this.completedCount = 0;
    this.selectedBottles = [];
    this.updateBadge();
    this.nextOrder();
  },

  updateBadge() {
    document.getElementById('potion-score-badge').textContent = `已調配：${this.completedCount} / ${this.targetGoal} 瓶`;
  },

  nextOrder() {
    this.selectedBottles = [];
    const customer = this.customers[this.completedCount % this.customers.length];
    document.getElementById('potion-customer-icon').textContent = customer.icon;

    // 從使用者練習的數字庫中挑選一個，乘上 1~9 作為目標乘積
    const pool = state.selectedNumbers.length > 0 ? state.selectedNumbers : [2, 3, 5];
    const factorA = pool[Math.floor(Math.random() * pool.length)];
    const factorB = Math.floor(Math.random() * 9) + 1;
    this.targetProduct = factorA * factorB;

    document.getElementById('potion-target-val').textContent = `能量 ${this.targetProduct}`;
    document.getElementById('cauldron-status-hint').textContent = `點選下方 2 個材料，相乘等於 ${this.targetProduct}`;
    document.getElementById('cauldron-smoke-emoji').style.opacity = '0';

    this.renderBottles();
  },

  renderBottles() {
    const shelf = document.getElementById('potion-bottles-shelf');
    shelf.innerHTML = '';

    for (let i = 1; i <= 9; i++) {
      const bottle = document.createElement('div');
      bottle.className = 'bottle-item';
      bottle.dataset.num = i;
      bottle.innerHTML = `
        <div class="bottle-icon">${this.potionIcons[i - 1]}</div>
        <div class="bottle-num">${i}</div>
      `;

      bottle.addEventListener('click', () => {
        this.handleBottleClick(i, bottle);
      });

      shelf.appendChild(bottle);
    }
  },

  handleBottleClick(num, bottleEl) {
    sound.playPop();

    // 切換選中狀態
    const idx = this.selectedBottles.indexOf(num);
    if (idx >= 0) {
      this.selectedBottles.splice(idx, 1);
      bottleEl.classList.remove('selected');
    } else {
      if (this.selectedBottles.length < 2) {
        this.selectedBottles.push(num);
        bottleEl.classList.add('selected');
      }
    }

    // 當選取了 2 個材料時，丟進鍋爐調配熬煮
    if (this.selectedBottles.length === 2) {
      const [n1, n2] = this.selectedBottles;
      let disp1 = n1;
      let disp2 = n2;
      if ((disp2 === 2 || disp1 === 2) && state.selectedNumbers.includes(2)) {
        disp1 = 2;
        disp2 = (n1 === 2 ? n2 : n1);
      }
      const currentProd = n1 * n2;

      if (currentProd === this.targetProduct) {
        // 成功調配！
        sound.playCorrect();
        Confetti.burst(40);
        const smoke = document.getElementById('cauldron-smoke-emoji');
        smoke.textContent = '🌟💖✨';
        smoke.style.opacity = '1';
        showToast(`太棒了！${disp1} × ${disp2} = ${this.targetProduct}，調配成功！`);

        this.completedCount++;
        this.updateBadge();

        setTimeout(() => {
          if (this.completedCount >= this.targetGoal) {
            showVictoryModal({
              title: '五星級魔藥大師！',
              desc: '太棒了！你成功為所有森林夥伴調配出了完美藥水！🧪✨',
              emoji: '✨',
              onReplay: () => this.start(),
              onMenu: () => window.appNavigate('menu')
            });
          } else {
            this.nextOrder();
          }
        }, 1200);

      } else {
        // 乘積不符，冒黑煙提示
        sound.playBoing();
        const smoke = document.getElementById('cauldron-smoke-emoji');
        smoke.textContent = '💨';
        smoke.style.opacity = '1';

        document.getElementById('cauldron-status-hint').textContent = `目前能量是 ${disp1} × ${disp2} = ${currentProd} 喔，再試試！`;
        showToast(`目前的能量是 ${currentProd} 喔，再試試看！`);

        setTimeout(() => {
          smoke.style.opacity = '0';
          this.selectedBottles = [];
          document.querySelectorAll('.bottle-item').forEach(b => b.classList.remove('selected'));
        }, 1200);
      }
    }
  },

  cleanup() {}
};
