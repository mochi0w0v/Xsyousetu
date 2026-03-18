const fileInput = document.getElementById('fileInput');
const container = document.getElementById('novel-container');
const resetBtn = document.getElementById('resetBtn');

const STORAGE_TEXT_KEY = 'novelText';
const STORAGE_LIKED_KEY = 'likedBlocks';

// 「。」が3つで1ブロックに分割
function splitText(text) {
  let blocks = [];
  let block = '';
  let dotCount = 0;

  for (let char of text) {
    block += char;
    if (char === '。') dotCount++;
    if (dotCount >= 3) {
      blocks.push(block.trim());
      block = '';
      dotCount = 0;
    }
  }
  if (block) blocks.push(block.trim());
  return blocks;
}

// ブロックを描画
function renderTweets(blocks) {
  container.innerHTML = '';
  let likedIndexes;
  try {
    likedIndexes = JSON.parse(localStorage.getItem(STORAGE_LIKED_KEY)) || [];
    if (!Array.isArray(likedIndexes)) likedIndexes = [];
  } catch (e) {
    likedIndexes = [];
  }

  blocks.forEach((b, i) => {
    const div = document.createElement('div');
    div.className = 'tweet';

    const textSpan = document.createElement('span');
    textSpan.className = 'text';
    textSpan.textContent = b;

    const likeBtn = document.createElement('span');
    likeBtn.className = 'like-btn';
    likeBtn.textContent = '★';

    if (likedIndexes.includes(Number(i))) likeBtn.classList.add('liked');

    likeBtn.addEventListener('click', () => {
      const index = Number(i);
      if (likedIndexes.includes(index)) {
        likedIndexes = likedIndexes.filter(idx => idx !== index);
        likeBtn.classList.remove('liked');
      } else {
        likedIndexes.push(index);
        likeBtn.classList.add('liked');
      }
      localStorage.setItem(STORAGE_LIKED_KEY, JSON.stringify(likedIndexes));
      scrollToLastLiked(likedIndexes);
    });

    div.appendChild(textSpan);
    div.appendChild(likeBtn);
    container.appendChild(div);
  });

  scrollToLastLiked(likedIndexes);
}

// 一番下のいいねまでスクロール
function scrollToLastLiked(likedIndexes) {
  if (likedIndexes.length === 0) return;
  const lastIndex = Math.max(...likedIndexes);
  const el = container.children[lastIndex];
  if (el) el.scrollIntoView({behavior: 'smooth'});
}

// ファイル読み込み
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result;
    localStorage.setItem(STORAGE_TEXT_KEY, text);
    localStorage.removeItem(STORAGE_LIKED_KEY);
    const blocks = splitText(text);
    renderTweets(blocks);
  };
  reader.readAsText(file, 'UTF-8');
});

// ページ読み込み時にlocalStorageに文章があれば表示
window.addEventListener('load', () => {
  const text = localStorage.getItem(STORAGE_TEXT_KEY);
  if (text) {
    const blocks = splitText(text);
    renderTweets(blocks);
  }
});

// リセットボタン
resetBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_TEXT_KEY);
  localStorage.removeItem(STORAGE_LIKED_KEY);
  container.innerHTML = '';
  fileInput.value = '';
});
