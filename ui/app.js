// FishBrowser UI 控制层
const view = document.getElementById('view');
const addr = document.getElementById('addr');
const btnBack = document.getElementById('btn-back');
const btnForward = document.getElementById('btn-forward');
const btnReload = document.getElementById('btn-reload');
const btnHome = document.getElementById('btn-home');
const blockedEl = document.getElementById('blocked');
const progressEl = document.getElementById('progress');
const toastEl = document.getElementById('toast');
const schemeEl = document.getElementById('scheme');

const HOME = 'https://cn.bing.com';

// ---------- 工具 ----------
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove('show'), 1600);
}

function normalize(input) {
  let u = String(input || '').trim();
  if (!u) return '';
  // 已经是完整 URL
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(u)) return u;
  // 裸域名 / IP
  if (/^[\w-]+(\.[\w-]+)+([\/?#].*)?$/.test(u) || /^\d{1,3}(\.\d{1,3}){3}(:\d+)?/.test(u)) {
    return 'https://' + u;
  }
  // localhost
  if (/^localhost(:|\/|$)/.test(u)) return 'http://' + u;
  // 其余当搜索词
  return 'https://cn.bing.com/search?q=' + encodeURIComponent(u);
}

function currentUrl() {
  try {
    return view.getURL() || '';
  } catch (e) {
    return '';
  }
}

function displayUrl(url) {
  if (!url) return '';
  return url.replace(/^https?:\/\//, '');
}

// ---------- 导航 ----------
function go(input) {
  const url = normalize(input);
  if (!url) return;
  view.loadURL(url);
}

addr.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    go(addr.value);
    addr.blur();
  } else if (e.key === 'Escape') {
    addr.value = displayUrl(currentUrl());
    addr.blur();
  }
});

addr.addEventListener('focus', () => {
  addr.select();
});

// 快捷键
document.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return;
  if (e.key === 'l') { e.preventDefault(); addr.focus(); addr.select(); }
  else if (e.key === 'r') { e.preventDefault(); view.reload(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); if (view.canGoBack()) view.goBack(); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); if (view.canGoForward()) view.goForward(); }
});

// ---------- 按钮 ----------
btnBack.onclick = () => { if (view.canGoBack()) view.goBack(); };
btnForward.onclick = () => { if (view.canGoForward()) view.goForward(); };
btnReload.onclick = () => view.reload();
btnHome.onclick = () => view.loadURL(HOME);

// ---------- 状态同步 ----------
function syncButtons() {
  try {
    btnBack.disabled = !view.canGoBack();
    btnForward.disabled = !view.canGoForward();
  } catch (e) { /* 未就绪 */ }
}

function syncAddr(url) {
  const u = url || currentUrl();
  if (document.activeElement !== addr) {
    addr.value = displayUrl(u);
  }
  schemeEl.textContent = u.startsWith('https://') ? '🔒' : (u ? '⚠️' : '🔒');
}

function startProgress() {
  progressEl.classList.add('active');
  progressEl.style.width = '25%';
  setTimeout(() => { progressEl.style.width = '70%'; }, 150);
}

function endProgress() {
  progressEl.style.width = '100%';
  setTimeout(() => {
    progressEl.classList.remove('active');
    progressEl.style.width = '0';
  }, 200);
}

// webview 事件
view.addEventListener('did-start-loading', () => {
  startProgress();
  syncButtons();
});

view.addEventListener('did-stop-loading', () => {
  endProgress();
  syncButtons();
  syncAddr();
});

view.addEventListener('did-navigate', (e) => {
  syncAddr(e.url);
  syncButtons();
});

view.addEventListener('did-navigate-in-page', (e) => {
  syncAddr(e.url);
  syncButtons();
});

view.addEventListener('page-title-updated', (e) => {
  document.title = (e.title ? e.title + ' — ' : '') + 'FishBrowser';
});

view.addEventListener('new-window', (e) => {
  e.preventDefault();
  view.loadURL(e.url);
});

// ---------- 广告拦截计数 ----------
let lastBlocked = 0;
async function pollStats() {
  try {
    const s = await window.fishapi.stats();
    if (s.blocked !== lastBlocked) {
      lastBlocked = s.blocked;
      blockedEl.textContent = s.blocked;
    }
  } catch (e) { /* ignore */ }
}
setInterval(pollStats, 1200);
pollStats();

// ---------- 启动 ----------
window.addEventListener('DOMContentLoaded', () => {
  syncAddr(HOME);
  syncButtons();
});
