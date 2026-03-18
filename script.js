const fileInput = document.getElementById('fileInput');
const fileNameSpan = document.getElementById('fileName');
const container = document.getElementById('novel-container');
const resetBtn = document.getElementById('resetBtn');

const STORAGE_TEXT_KEY = 'novelText';
const STORAGE_LIKED_KEY = 'likedBlocks';
const STORAGE_FILE_NAME = 'attachedFileName';

let fileAttached = false;

// 「。」が3つで1ブロックに分割
function splitText(text){
  let blocks=[], block='', dot=0;
  for(let c of text){
    block += c;
    if(c==='。') dot++;
    if(dot>=3){ blocks.push(block.trim()); block=''; dot=0; }
  }
  if(block) blocks.push(block.trim());
  return blocks;
}

// ブロック描画
function renderTweets(blocks){
  container.innerHTML='';
  let likedIndexes=[];
  try{ likedIndexes = JSON.parse(localStorage.getItem(STORAGE_LIKED_KEY))||[]; if(!Array.isArray(likedIndexes)) likedIndexes=[]; } catch(e){ likedIndexes=[]; }

  blocks.forEach((b,i)=>{
    const div=document.createElement('div'); div.className='tweet';
    const textSpan=document.createElement('span'); textSpan.className='text'; textSpan.textContent=b;

    const likeBtn=document.createElement('span'); likeBtn.className='like-btn'; likeBtn.textContent='★';
    if(likedIndexes.includes(i)) likeBtn.classList.add('liked');

    likeBtn.addEventListener('click',()=>{
      if(likedIndexes.includes(i)){
        likedIndexes = likedIndexes.filter(x=>x!==i);
        likeBtn.classList.remove('liked');
      }else{
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

// 一番下までスクロール
function scrollToLastLiked(likedIndexes){
  if(likedIndexes.length===0) return;
  const lastIndex = Math.max(...likedIndexes);
  const el = container.children[lastIndex];
  if(el) el.scrollIntoView({behavior:'smooth'});
}

// DOMContentLoaded でファイル状態復元
document.addEventListener('DOMContentLoaded', ()=>{
  const fileName = localStorage.getItem(STORAGE_FILE_NAME);
  const text = localStorage.getItem(STORAGE_TEXT_KEY);

  if(fileName){
    fileNameSpan.textContent = fileName;
    fileInput.style.display = 'none';
    fileAttached = true;
  } else {
    fileInput.style.display = 'inline-block';
  }

  if(text) renderTweets(splitText(text));
});

// ファイル読み込み
fileInput.addEventListener('change', async (e)=>{
  if(fileAttached) return;
  const file = e.target.files[0]; if(!file) return;

  fileAttached = true;
  fileNameSpan.textContent = file.name;
  localStorage.setItem(STORAGE_FILE_NAME, file.name);

  fileInput.style.display='none';

  if(file.type==="application/pdf"){
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
    let fullText='';
    for(let i=1;i<=pdf.numPages;i++){
      const page = await pdf.getPage(i);
      const items = await page.getTextContent();
      fullText += items.items.map(it=>it.str).join('');
    }
    localStorage.setItem(STORAGE_TEXT_KEY, fullText);
    localStorage.removeItem(STORAGE_LIKED_KEY);
    renderTweets(splitText(fullText));
  }else{
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const enc = Encoding.detect(uint8) || 'UTF8';
    let text = Encoding.convert(uint8,{to:'UNICODE',from:enc});
    text = Encoding.codeToString(text);
    localStorage.setItem(STORAGE_TEXT_KEY, text);
    localStorage.removeItem(STORAGE_LIKED_KEY);
    renderTweets(splitText(text));
  }
});

// 添付後は再選択不可
fileInput.addEventListener('click',(e)=>{ if(fileAttached) e.preventDefault(); });

// リセット
resetBtn.addEventListener('click',()=>{
  localStorage.removeItem(STORAGE_TEXT_KEY);
  localStorage.removeItem(STORAGE_LIKED_KEY);
  localStorage.removeItem(STORAGE_FILE_NAME);
  container.innerHTML='';
  fileInput.value='';
  fileNameSpan.textContent='';
  fileAttached=false;
  fileInput.style.display='inline-block';
});
