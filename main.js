// FishBrowser - 主进程
// 自研纯净浏览器：Electron + 内置广告/追踪拦截
const { app, BrowserWindow, session, ipcMain, shell } = require('electron');
const path = require('path');

// ============================================================
// 广告 / 追踪域名规则
// 命中即取消请求（不是拿 CSS 藏起来，是压根不让它下载）
// ============================================================
const AD_HOST_RULES = [
  // ---- 国际主流广告网络 ----
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'google-analytics.com',
  'googletagmanager.com',
  'googletagservices.com',
  'adservice.google.com',
  'pagead2.googlesyndication.com',
  'adsrvr.org',
  'adnxs.com',
  'advertising.com',
  'criteo.com',
  'criteo.net',
  'taboola.com',
  'outbrain.com',
  'scorecardresearch.com',
  'quantserve.com',
  'zedo.com',
  'openx.net',
  'pubmatic.com',
  'rubiconproject.com',
  'moatads.com',
  'adsafeprotected.com',
  'amazon-adsystem.com',
  'serving-sys.com',
  'adform.net',
  'smartadserver.com',
  'teads.tv',
  'spotxchange.com',
  'yieldmo.com',

  // ---- 国内广告联盟 / 统计 ----
  'cpro.baidu.com',
  'pos.baidu.com',
  'union.baidu.com',
  'eclick.baidu.com',
  'cbjs.baidu.com',
  'hm.baidu.com',
  'tanx.com',
  'alimama.com',
  'atanx.alicdn.com',
  'gdt.qq.com',
  'e.qq.com',
  'pingfore.qq.com',
  'trace.qq.com',
  'miaozhen.com',
  'weimob.com',
  'adchina.com',
  'cnzz.com',
  '51.la',
  '51yes.com',
  'jiathis.com',
  'irs01.com',
  'irs01.net',
  'irs01.cn',
  'umeng.com',
  'umeng.co',
  'growingio.com',
  'sensorsdata.cn',
  'hmcdn.baidu.com',
  'cpro.baidustatic.com',
  'mipcache.bdstatic.com',
  'aos.wall.youku.com',
  'atm.youku.com',
  'store.ixigua.com',
  'ad.bilibili.com',
  'data.bilibili.com',
  'cisum.bilibili.com',
  'adsmind.apdcdn.tc.qq.com',
  'adsmac.inews.qq.com',
  'ad.weibo.com',
  'sax.sina.com.cn',
  'beacon.sina.com.cn',
  'uloginad.zhihu.com',
  'ads.zhihu.com',
  'adcdn.zhihu.com',

  // ---- 弹窗 / 挖矿 / 恶意脚本常见域 ----
  'popads.net',
  'popcash.net',
  'propellerads.com',
  'onclickads.net',
  'coinhive.com',
  'coin-hive.com',
  'crypto-loot.com',
  'webminepool.com'
];

// URL 特征（只在路径/文件名层面匹配，避免误杀正文）
const AD_PATH_HINTS = [
  '/adserver/',
  '/adsystem/',
  '/adservice/',
  '/ad-banner',
  '/bannerads/',
  '/popunder',
  '/popupads',
  '/pagead/',
  '/ad_frame',
  '/adframe.',
  '/adimage/',
  '/adjs/',
  '/adlog.php',
  '/adclick.',
  '/adtrack.',
  '/adsbygoogle',
  'googleads.g.doubleclick',
  '/analytics.js',
  '/gtag/js',
  '/tracking.js',
  '/beacon.js',
  '/collect.gif',
  '/pixel.gif'
];

// 明确放行（防止误杀）
const WHITELIST = [
  'github.com',
  'githubusercontent.com',
  'microsoft.com',
  'apple.com',
  'mozilla.org',
  'bilibili.com/video',
  'zhihu.com/question',
  'baidu.com/s',
  'cn.bing.com'
];

let blockCount = 0;
const recentBlocked = [];

function isWhitelisted(url) {
  const u = url.toLowerCase();
  return WHITELIST.some((w) => u.includes(w));
}

function isAd(url) {
  const u = url.toLowerCase();
  if (isWhitelisted(u)) return false;
  for (const host of AD_HOST_RULES) {
    if (u.includes(host)) return true;
  }
  for (const hint of AD_PATH_HINTS) {
    if (u.includes(hint)) return true;
  }
  return false;
}

function installBlocker(ses) {
  ses.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    const url = details.url;
    if (isAd(url)) {
      blockCount++;
      if (recentBlocked.length >= 60) recentBlocked.shift();
      try {
        recentBlocked.push(new URL(url).hostname);
      } catch (e) {
        /* ignore */
      }
      callback({ cancel: true });
      return;
    }
    callback({});
  });
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 900,
    minHeight: 600,
    title: 'FishBrowser',
    backgroundColor: '#12141a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

  // 外链（target=_blank 之类）走系统浏览器
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  const ses = session.defaultSession;
  ses.setUserAgent(
    ses.getUserAgent().replace(/Electron\/\S+\s/, '').replace(/FishBrowser\/\S+\s/, '')
  );
  installBlocker(ses);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ============================================================
// IPC：UI 取拦截统计
// ============================================================
ipcMain.handle('stats:get', () => {
  return {
    blocked: blockCount,
    recent: recentBlocked.slice(-8).reverse()
  };
});

ipcMain.handle('stats:reset', () => {
  blockCount = 0;
  recentBlocked.length = 0;
  return { blocked: 0, recent: [] };
});
