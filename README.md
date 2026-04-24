# 每日記帳 PWA

個人每日記帳 App，支援同步 Google 試算表，可安裝至手機主畫面。

## 技術棧

- Vue 3 + TypeScript
- Tailwind CSS
- Vant（行動端 UI）
- Vite + vite-plugin-pwa
- Pinia（狀態管理）

## 本地開發

```bash
npm install
npm run dev
```

## 部署到 GitHub Pages

1. 建立 GitHub repository
2. 推上去後，到 Settings → Pages → Source 選 **GitHub Actions**
3. 之後每次 `git push` 自動部署

## 連結 Google 試算表

### Step 1：建立試算表

第一列設定標題（選填，純粹方便閱讀）：
```
日期 | 時間 | 類型 | 類別 | 金額 | 備註
```

### Step 2：建立 Apps Script

1. 試算表 → 擴充功能 → Apps Script
2. 貼上以下程式碼：

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet()
  const d = JSON.parse(e.postData.contents)
  sheet.appendRow([d.date, d.time, d.type, d.category, d.amount, d.note])
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON)
}
```

3. 部署 → 新增部署 → 網路應用程式
4. 執行身份：**我**，存取權：**任何人**
5. 複製 URL

### Step 3：填入 App

打開 App → 設定頁 → 貼上 URL → 儲存

## 手機安裝方式

### iOS Safari
網址列 → 分享 → 加入主畫面

### Android Chrome
右上角選單 → 加入主畫面（或安裝應用程式）

## 專案結構

```
src/
├── main.ts          # 入口，Router + Pinia
├── App.vue          # 底部導覽列
├── stores/
│   └── expense.ts   # 資料邏輯 + Google 試算表同步
└── views/
    ├── HomeView.vue     # 記帳首頁
    ├── HistoryView.vue  # 歷史明細
    └── SettingsView.vue # 設定頁
```
