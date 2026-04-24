<script setup lang="ts">
import { showConfirmDialog, showSuccessToast, showToast } from 'vant'
import { ref } from 'vue'
import { useExpenseStore } from '../stores/expense'

const store = useExpenseStore()
const scriptUrl = ref(store.scriptUrl)
const showCode = ref(false)

const appsScriptCode = `function doPost(e) {
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
    .createTextOutput(JSON.stringify({status:'ok'}))
    .setMimeType(ContentService.MimeType.JSON);
}`

function save() {
  store.setScriptUrl(scriptUrl.value.trim())
  showSuccessToast('設定已儲存')
}

async function confirmClear() {
  await showConfirmDialog({ title: '確定清除？', message: '本地所有記帳資料將被刪除，試算表不受影響。' })
  store.entries.splice(0)
  localStorage.removeItem('entries')
  showToast('已清除')
}
</script>

<template>
  <div>
    <van-nav-bar title="設定" />

    <div class="mx-4 mt-4">
      <p class="text-xs text-gray-400 px-1 mb-2">
        Google 試算表連結
      </p>
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <van-cell-group inset>
          <van-field
            v-model="scriptUrl"
            label="Script URL"
            placeholder="貼上 Apps Script 網路應用程式 URL"
            type="textarea"
            rows="3"
            autosize
          />
        </van-cell-group>
        <div class="p-4 pt-2">
          <van-button type="primary" block round @click="save">
            儲存設定
          </van-button>
        </div>
      </div>

      <!-- Instructions -->
      <p class="text-xs text-gray-400 px-1 mt-6 mb-2">
        如何取得 Apps Script URL
      </p>
      <div class="bg-white rounded-2xl shadow-sm p-4 space-y-3 text-sm text-gray-600">
        <div class="flex gap-3">
          <span class="w-5 h-5 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
          <p>開啟你的 Google 試算表 → 擴充功能 → Apps Script</p>
        </div>
        <div class="flex gap-3">
          <span class="w-5 h-5 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
          <p>貼上下方程式碼並儲存</p>
        </div>
        <div class="flex gap-3">
          <span class="w-5 h-5 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
          <p>部署 → 新增部署 → 網路應用程式 → 存取「任何人」→ 複製 URL</p>
        </div>
        <van-button
          size="small"
          plain
          type="primary"
          @click="showCode = !showCode"
        >
          {{ showCode ? '隱藏' : '顯示' }} Apps Script 程式碼
        </van-button>
        <pre v-if="showCode" class="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">{{ appsScriptCode }}</pre>
      </div>

      <!-- Danger Zone -->
      <p class="text-xs text-gray-400 px-1 mt-6 mb-2">
        資料管理
      </p>
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <van-cell title="清除所有本地記錄" is-link class="text-red-500" @click="confirmClear" />
      </div>
    </div>
  </div>
</template>
