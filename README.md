# FishBrowser

**自研纯净浏览器 —— 单文件 EXE，本地运行，内置广告/追踪拦截，无任何统计上报**

用 Electron + 系统 WebView（Chromium 内核）自己写的一个浏览器壳。不收集数据、不推送推荐、不装扩展，打开就是干净的网页。

---

## 功能

| 功能 | 说明 |
|---|---|
| **广告拦截** | 内置 120+ 条广告/追踪域名规则，在**网络层直接取消请求**（不是用 CSS 把元素藏起来——它压根下载不到） |
| **追踪拦截** | 统计、埋点、像素、分析脚本一并拦掉 |
| **拦截计数** | 右上角 🛡 实时显示本次已拦下多少个请求 |
| **无数据收集** | 不上报任何东西，不联网检查更新 |
| **纯本地** | 全部代码在这几个文件里，可以自己审计 |

## 界面

- 深色工具栏：后退 / 前进 / 刷新 / 主页
- 地址栏：输入网址直接打开；输入普通文字自动用必应搜索
- 快捷键：
  - `Ctrl+L` 聚焦地址栏
  - `Ctrl+R` 刷新
  - `Alt+←/→` 前进后退（本浏览器用 `Ctrl+←/→`）

## 用法

### 方式一：下载 EXE 直接跑

下载 `FishBrowser-1.0.0-portable.exe`，双击运行。免安装，绿色版。

### 方式二：从源码跑

```bash
npm install
npm start
```

### 方式三：自己打包

```bash
npm run portable
```

产物在 `dist/FishBrowser-1.0.0-portable.exe`。

---

## 广告拦截规则

规则写在 `main.js` 里，两个数组：

- `AD_HOST_RULES` —— 域名黑名单（双击广告、广告联盟、统计平台）
- `AD_PATH_HINTS` —— URL 路径特征（`/adserver/`、`/adsbygoogle` 等）

命中任何一个 → `session.webRequest.onBeforeRequest` 直接 `cancel: true`。

想加规则：往数组里加一行就行。

### 已覆盖的典型域名

- 国际：doubleclick、googlesyndication、criteo、taboola、outbrain、adnxs…
- 国内：cpro.baidu、pos.baidu、gdt.qq、alimama、tanx、cnzz、umeng、miaozhen…
- 恶意：popads、onclickads、coinhive（挖矿）…

---

## 技术栈

| 组件 | 作用 |
|---|---|
| Electron 33 | 浏览器外壳 + Chromium 渲染内核 |
| `session.webRequest` | 网络层拦截 |
| `<webview>` | 页面容器（独立进程，崩了不影响外壳） |
| `contextIsolation` + `preload` | 安全隔离，网页拿不到 Node |

## 已知限制

- 单标签页（暂未做多标签）
- 广告规则是精简列表，不是完整 EasyList（完整规则有上万条，体积会大很多）
- 不支持扩展、书签同步

## 许可

MIT。Electron 与 Chromium 各自遵循其原有许可。
