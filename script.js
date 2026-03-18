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

// ファイル読み込み（テキスト / PDF対応）
fileInput.addEventListener('change', async (e) => {
  if (fileAttached) return;

  const file = e.target.files[0];
  if (!file) return;

  fileAttached = true;
  fileNameSpan.textContent = file.name;

  // 添付ボタン非表示
  fileInput.style.display = 'none';

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
    const blocks = splitText(fullText);
    renderTweets(blocks);

  } else {
    // テキストファイル：UTF-8優先、失敗時Shift_JIS
    const arrayBuffer = await file.arrayBuffer();
    let text;
    try {
      text = new TextDecoder('utf-8').decode(arrayBuffer);
    } catch (e) {
      try {
        text = new TextDecoder('shift-jis').decode(arrayBuffer);
      } catch {
        alert("文字コードが不明です。UTF-8またはShift_JIS形式のファイルを使用してください。");
        fileAttached = false;
        fileInput.value = '';
        fileNameSpan.textContent = '';
        fileInput.style.display = 'inline-block';
        return;
      }
    }

    localStorage.setItem(STORAGE_TEXT_KEY, text);
    localStorage.removeItem(STORAGE_LIKED_KEY);
    const blocks = splitText(text);
    renderTweets(blocks);
  }
});

// 添付後は再度選択不可
fileInput.addEventListener('click', (e) => {
  if (fileAttached) e.preventDefault();
});

// ページ読み込み時に保存テキストがあれば表示
window.addEventListener('load', () => {
  const text = localStorage.getItem(STORAGE_TEXT_KEY);
  if (text) {
    const blocks = splitText(text);
    renderTweets(blocks);
  }
});

// リセット
resetBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_TEXT_KEY);
  localStorage.removeItem(STORAGE_LIKED_KEY);
  container.innerHTML = '';
  fileInput.value = '';
  fileNameSpan.textContent = '';
  fileAttached = false;
  fileInput.style.display = 'inline-block';
});
