const fileInput = document.getElementById('fileInput');
const fileNameSpan = document.getElementById('fileName');
const container = document.getElementById('novel-container');
const resetBtn = document.getElementById('resetBtn');

const STORAGE_TEXT_KEY = 'novelText';
const STORAGE_LIKED_KEY = 'likedBlocks';

let fileAttached = false;

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
  let likedIndexes = [];
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

    if (likedIndexes.includes(i)) likeBtn.classList.add('liked');

    likeBtn.addEventListener('click', () => {
      if (likedIndexes.includes(i)) {
        likedIndexes = likedIndexes.filter(idx => idx !== i);
        likeBtn.classList.remove('liked');
      } else {
        likedIndexes.push(i);
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
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ファイル読み込み（テキスト / PDF対応）
fileInput.addEventListener('change', async (e) => {
  if (fileAttached) return;

  const file = e.target.files[0];
  if (!file) return;

  fileAttached = true;
  fileNameSpan.textContent = file.name;

  // 添付ボタン非表示
  fileInput.style.visibility = 'hidden';
  fileInput.style.pointerEvents = 'none';

  if (file.type === "application/pdf") {
    // PDF読み込み
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join('');
      fullText += pageText;
    }

    localStorage.setItem(STORAGE_TEXT_KEY, fullText);
    localStorage.removeItem(STORAGE_LIKED_KEY);
    renderTweets(splitText(fullText));

  } else {
    // テキストファイル：文字コード自動判定（ANSI/Shift_JIS/UTF-8）
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const encoding = Encoding.detect(uint8) || 'UTF8';
    let text = Encoding.convert(uint8, { to: 'UNICODE', from: encoding });
    text = Encoding.codeToString(text);

    localStorage.setItem(STORAGE_TEXT_KEY, text);
    localStorage.removeItem(STORAGE_LIKED_KEY);
    renderTweets(splitText(text));
  }
});

// 添付後は再選択不可
fileInput.addEventListener('click', (e) => {
  if (fileAttached) e.preventDefault();
});

// ページ読み込み時に保存テキストがあれば表示
window.addEventListener('load', () => {
  const text = localStorage.getItem(STORAGE_TEXT_KEY);
  if (text) renderTweets(splitText(text));
});

// リセット
resetBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_TEXT_KEY);
  localStorage.removeItem(STORAGE_LIKED_KEY);
  container.innerHTML = '';
  fileInput.value = '';
  fileNameSpan.textContent = '';
  fileAttached = false;
  fileInput.style.visibility = 'visible';
  fileInput.style.pointerEvents = 'auto';
});
