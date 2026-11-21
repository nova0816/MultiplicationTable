/* ==========================================================================
   js/state.js - 全局狀態管理與題目生成器
   ========================================================================== */

export const state = {
  selectedNumbers: [2, 3, 5], // 預設練習 2, 3, 5
  currentView: 'menu',
  soundEnabled: true,
  listeners: []
};

// 訂閱狀態變更通知
export function subscribeStateChange(callback) {
  state.listeners.push(callback);
}

function notifyStateChange() {
  state.listeners.forEach(cb => cb(state));
}

// 設定自選數字
export function setNumbers(nums) {
  if (Array.isArray(nums) && nums.length > 0) {
    state.selectedNumbers = [...nums].sort((a, b) => a - b);
    notifyStateChange();
  }
}

// 切換特定數字選取狀態 (1 ~ 9)
export function toggleNumber(num) {
  if (state.selectedNumbers.includes(num)) {
    if (state.selectedNumbers.length > 1) {
      state.selectedNumbers = state.selectedNumbers.filter(n => n !== num);
      notifyStateChange();
      return true;
    }
    return false; // 至少保留 1 個數字
  } else {
    state.selectedNumbers.push(num);
    state.selectedNumbers.sort((a, b) => a - b);
    notifyStateChange();
    return true;
  }
}

// 根據使用者選取的數字庫產生算式題目（被乘數固定放前面）
// 特別規則：若選到 2 的乘法，2 必定放最前面（只能 2 × 7，不能 7 × 2）
export function getRandomQuestion() {
  const pool = state.selectedNumbers.length > 0 ? state.selectedNumbers : [2, 3, 5];
  // 隨機選擇使用者指定的一個乘法表數字
  const a = pool[Math.floor(Math.random() * pool.length)];
  // 乘數 1 ~ 9
  const b = Math.floor(Math.random() * 9) + 1;

  let num1 = a;
  let num2 = b;

  // 若有選到 2 的乘法，且算式中出現 2，保證 2 必定放最前面 (只能 2 × 7，不能 7 × 2)
  if ((num2 === 2 || num1 === 2) && state.selectedNumbers.includes(2)) {
    num1 = 2;
    num2 = (a === 2 ? b : a);
  }

  return {
    a: num1,
    b: num2,
    ans: num1 * num2,
    text: `${num1} × ${num2}`
  };
}

// 生成干擾答案（貼近正確答案、但保證不同，符合兒童認知）
export function getDistractorAnswers(correctAnswer, count = 2) {
  const options = new Set([correctAnswer]);
  let attempts = 0;
  while (options.size < count + 1 && attempts < 50) {
    attempts++;
    const delta = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
    let fake = correctAnswer + delta;
    if (fake > 0 && fake <= 81 && fake !== correctAnswer) {
      options.add(fake);
    }
  }
  while (options.size < count + 1) {
    options.add(correctAnswer + options.size * 2);
  }
  const arr = Array.from(options);
  // 洗牌
  return arr.sort(() => Math.random() - 0.5);
}
