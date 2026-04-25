# 每日記帳 PWA

個人每日記帳 App，支援同步 Google 試算表，可安裝至手機主畫面。

## 功能

- 記錄支出與收入，含類別、支付方式、備註
- 首頁顯示今日支出 / 收入 / 淨額總覽
- 明細頁依日期分組瀏覽所有記錄
- 支出記錄自動同步至 Google 試算表（收入僅存本地）
- 資料存於 localStorage，離線可用
- PWA：可安裝至手機主畫面

## 技術棧

- Vue 3 + TypeScript
- Tailwind CSS v4
- Vant 4（行動端 UI）
- Vite 8 + vite-plugin-pwa
- Pinia（狀態管理）
- Vue Router 5

## 本地開發

```bash
pnpm install
pnpm dev
```

其他指令：

```bash
pnpm build        # 型別檢查 + 建置
pnpm preview      # 預覽建置結果
pnpm lint:fix     # 自動修正 lint 問題
```

## 部署到 GitHub Pages

1. 建立 GitHub repository
2. 推上去後，到 Settings → Pages → Source 選 **GitHub Actions**
3. 之後每次 `git push` 自動部署

## 連結 Google 試算表

> 只有**支出**記錄會同步至試算表，收入記錄僅存於本地。

### Step 1：建立試算表

建立名為 `每日消費` 的工作表，第一列可加入標題（選填）：

```
日期 | 類別 | 金額 | 支付方式 | 備註
```

### Step 2：建立 Apps Script

1. 試算表 → 擴充功能 → Apps Script
2. 貼上以下程式碼並儲存：

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName('每日消費');
  const d = JSON.parse(e.postData.contents);

  sheet.appendRow([
    d.date, d.category, d.amount,
    d.paymentMethod, d.note
  ]);

  // 依日期分組交替底色
  const lastRow = sheet.getLastRow();
  const numCols = 5;
  const COLOR_A = '#f1f5f9';
  const COLOR_B = '#eff6ff';

  let color = COLOR_A;
  if (lastRow > 2) {
    const prevDate = sheet.getRange(lastRow - 1, 1).getDisplayValue();
    const prevColor = sheet.getRange(lastRow - 1, 1).getBackground();
    color = prevDate === d.date
      ? prevColor
      : (prevColor === COLOR_A ? COLOR_B : COLOR_A);
  }
  sheet.getRange(lastRow, 1, 1, numCols).setBackground(color);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
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

## 預設類別與支付方式

**支出類別：** 餐飲、交通、娛樂、購物、醫療、日用、其他

**收入類別：** 薪資、獎金、投資、兼職、其他

**支付方式：** 現金、中信信用卡、中信Visa、國泰信用卡、永豐信用卡、富邦信用卡、轉帳

## 專案結構

```
src/
├── main.ts              # 入口，Router + Pinia + Vant
├── App.vue              # 底部導覽列（記帳 / 明細 / 設定）
├── style.css            # 全域樣式（Tailwind）
├── stores/
│   └── expense.ts       # 資料邏輯 + Google 試算表同步
└── views/
    ├── HomeView.vue     # 記帳首頁（新增記帳 + 今日總覽）
    ├── HistoryView.vue  # 歷史明細（依日期分組）
    └── SettingsView.vue # 設定頁（Script URL + 清除資料）
```
