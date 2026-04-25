<script setup lang="ts">
import { showSuccessToast } from 'vant'
import { ref } from 'vue'
import { appsScriptCode } from '../lib/appsScript'
import { useExpenseStore } from '../stores/expense'

const store = useExpenseStore()
const scriptUrl = ref(store.scriptUrl)
const copied = ref(false)

async function copyCode() {
  await navigator.clipboard.writeText(appsScriptCode)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}


function save() {
  store.setScriptUrl(scriptUrl.value.trim())
  showSuccessToast('設定已儲存')
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
          :type="copied ? 'success' : 'primary'"
          @click="copyCode"
        >
          {{ copied ? '已複製！' : '複製 Apps Script 程式碼' }}
        </van-button>
      </div>

      <!-- Monthly settle instructions -->
      <p class="text-xs text-gray-400 px-1 mt-6 mb-2">
        如何設定每月自動結算
      </p>
      <div class="bg-white rounded-2xl shadow-sm p-4 space-y-3 text-sm text-gray-600">
        <div class="flex gap-3">
          <span class="w-5 h-5 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
          <p>在 Apps Script 編輯器左側點擊「觸發條件」（鐘錶圖示）</p>
        </div>
        <div class="flex gap-3">
          <span class="w-5 h-5 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
          <p>右下角「新增觸發條件」</p>
        </div>
        <div class="flex gap-3">
          <span class="w-5 h-5 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
          <p>選擇函式：<strong>settleMonth</strong>、事件來源：時間驅動、類型：月計時器、日期：每月 1 號</p>
        </div>
        <p class="text-xs text-gray-400">每月 1 號自動將上個月資料整理成獨立 sheet 並產生圓餅圖</p>
      </div>

    </div>
  </div>
</template>
