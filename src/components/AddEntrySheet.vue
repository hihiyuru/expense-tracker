<script setup lang="ts">
import dayjs from 'dayjs'
import { Clock, X } from 'lucide-vue-next'
import { showSuccessToast, showToast } from 'vant'
import { computed, ref, watch } from 'vue'
import { CATEGORY_ICON } from '../lib/categoryIcons'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, useExpenseStore } from '../stores/expense'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ 'update:show': [boolean] }>()

const store = useExpenseStore()

const selectedCategory = ref('')
const inputStr = ref('0')
const pendingOp = ref<'+' | '-' | '*' | '/' | null>(null)
const prevNum = ref<number | null>(null)
const note = ref('')
const paymentMethod = ref('')
const submitting = ref(false)
const showPayPicker = ref(false)
const currentTime = ref(dayjs().format('HH:mm'))

const finalAmount = computed(() => {
  const curr = Number.parseFloat(inputStr.value) || 0
  if (prevNum.value !== null && pendingOp.value) {
    switch (pendingOp.value) {
      case '+': return prevNum.value + curr
      case '-': return Math.max(0, prevNum.value - curr)
      case '*': return prevNum.value * curr
      case '/': return curr !== 0 ? Number.parseFloat((prevNum.value / curr).toFixed(2)) : prevNum.value
    }
  }
  return curr
})

const OP_SYMBOL: Record<string, string> = { '+': '+', '-': '-', '*': '×', '/': '÷' }

const exprLabel = computed(() => {
  if (prevNum.value !== null && pendingOp.value)
    return `${prevNum.value} ${OP_SYMBOL[pendingOp.value]} `
  return null
})

watch(() => props.show, (shown) => {
  if (shown)
    currentTime.value = dayjs().format('HH:mm')
})

function onNumpad(key: string) {
  if (key === 'del') {
    inputStr.value = inputStr.value.length <= 1 ? '0' : inputStr.value.slice(0, -1)
    return
  }
  if (key === '.') {
    if (!inputStr.value.includes('.'))
      inputStr.value += '.'
    return
  }
  if (inputStr.value.includes('.')) {
    const dec = inputStr.value.split('.')[1]
    if (dec && dec.length >= 2)
      return
  }
  inputStr.value = inputStr.value === '0' ? key : inputStr.value + key
}

function onOpBtn(primary: '+' | '-', secondary: '*' | '/') {
  if (pendingOp.value === primary) {
    if (inputStr.value === '0') {
      // 未輸入新數字 → 切換到次要符號
      pendingOp.value = secondary
    }
    else {
      // 已輸入新數字 → 自動計算累計，繼續同一符號
      prevNum.value = finalAmount.value
      inputStr.value = '0'
    }
  }
  else if (pendingOp.value === secondary) {
    // 次要符號狀態 → 切回主符號
    pendingOp.value = primary
  }
  else {
    // 全新開始
    prevNum.value = finalAmount.value
    pendingOp.value = primary
    inputStr.value = '0'
  }
}

function evaluate() {
  const result = finalAmount.value
  inputStr.value = result % 1 === 0 ? String(result) : result.toFixed(2)
  pendingOp.value = null
  prevNum.value = null
}

async function save(keepOpen = false) {
  const amount = finalAmount.value
  if (!amount || amount <= 0)
    return showToast('請輸入有效金額')
  if (!selectedCategory.value)
    return showToast('請選擇類別')
  if (!paymentMethod.value)
    return showToast('請選擇支付方式')

  submitting.value = true
  const result = await store.addEntry({
    type: 'expense',
    amount,
    category: selectedCategory.value,
    paymentMethod: paymentMethod.value,
    date: dayjs().format('YYYY-MM-DD'),
    time: currentTime.value,
    note: note.value,
  })
  submitting.value = false

  if (result.ok)
    showSuccessToast('記錄成功')
  else
    showToast('本地已儲存，試算表同步失敗')

  reset()
  if (!keepOpen)
    emit('update:show', false)
}

function reset() {
  inputStr.value = '0'
  pendingOp.value = null
  prevNum.value = null
  note.value = ''
  selectedCategory.value = ''
}
</script>

<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    :style="{ height: '92dvh' }"
    @update:show="emit('update:show', $event)"
  >
    <div class="flex flex-col h-full bg-gray-100">
      <!-- Header -->
      <div class="relative flex items-center px-4 py-3 bg-gray-100">
        <button
          class="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm"
          @click="emit('update:show', false)"
        >
          <X :size="18" class="text-gray-500" />
        </button>
        <span class="absolute left-1/2 -translate-x-1/2 text-base font-medium text-gray-700">支出</span>
        <button
          class="ml-auto px-3 py-1.5 rounded-full bg-white shadow-sm"
          @click="showPayPicker = true"
        >
          <span class="text-gray-400 text-xs">{{ paymentMethod || '選擇支付方式' }}</span>
        </button>
      </div>

      <!-- Category grid -->
      <div class="flex-1 overflow-y-auto px-2 pb-2">
        <div class="grid grid-cols-5 gap-y-4 gap-x-1 pt-2">
          <button
            v-for="cat in EXPENSE_CATEGORIES"
            :key="cat"
            class="flex flex-col items-center gap-1.5"
            @click="selectedCategory = cat"
          >
            <div
              class="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-colors"
              :class="selectedCategory === cat ? 'bg-orange-500' : 'bg-gray-200'"
            >
              <component
                :is="CATEGORY_ICON[cat]"
                :size="22"
                :class="selectedCategory === cat ? 'text-white' : 'text-gray-500'"
              />
            </div>
            <span class="text-xs text-gray-500">{{ cat }}</span>
          </button>
        </div>
      </div>

      <!-- Amount card -->
      <div class="mx-3 mb-2 bg-white rounded-2xl px-4 py-3 shadow-sm">
        <div class="text-4xl font-bold text-orange-500 tabular-nums">
          {{ exprLabel }}{{ inputStr === '0' && !exprLabel ? '0' : inputStr }}
        </div>
        <div class="flex items-center gap-2 mt-2">
          <Clock :size="13" class="text-gray-400 flex-shrink-0" />
          <span class="text-sm text-gray-400">{{ currentTime }}</span>
          <span class="text-gray-200">|</span>
          <input
            v-model="note"
            class="flex-1 text-sm text-gray-500 outline-none bg-transparent placeholder-gray-300"
            placeholder="點擊填寫備注"
            maxlength="10"
          >
          <span class="text-[10px] text-orange-400 flex-shrink-0 tabular-nums">{{ note.length }}/10</span>
        </div>
      </div>

      <!-- Numpad -->
      <div
        class="grid grid-cols-4 gap-2 px-3 pb-3 bg-gray-100"
        style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))"
      >
        <!-- Row 1 -->
        <button class="nk-num" @click="onNumpad('1')">
          1
        </button>
        <button class="nk-num" @click="onNumpad('2')">
          2
        </button>
        <button class="nk-num" @click="onNumpad('3')">
          3
        </button>
        <button
          class="nk-op"
          :class="{ 'ring-2 ring-orange-400 bg-orange-50': pendingOp === '+' || pendingOp === '*' }"
          @click="onOpBtn('+', '*')"
        >
          <span :class="pendingOp === '+' ? 'text-orange-500 font-bold' : 'text-gray-500'">+</span>
          <span class="mx-0.5 text-gray-300">·</span>
          <span :class="pendingOp === '*' ? 'text-orange-500 font-bold' : 'text-gray-500'">×</span>
        </button>
        <!-- Row 2 -->
        <button class="nk-num" @click="onNumpad('4')">
          4
        </button>
        <button class="nk-num" @click="onNumpad('5')">
          5
        </button>
        <button class="nk-num" @click="onNumpad('6')">
          6
        </button>
        <button
          class="nk-op"
          :class="{ 'ring-2 ring-orange-400 bg-orange-50': pendingOp === '-' || pendingOp === '/' }"
          @click="onOpBtn('-', '/')"
        >
          <span :class="pendingOp === '-' ? 'text-orange-500 font-bold' : 'text-gray-500'">-</span>
          <span class="mx-0.5 text-gray-300">·</span>
          <span :class="pendingOp === '/' ? 'text-orange-500 font-bold' : 'text-gray-500'">÷</span>
        </button>
        <!-- Row 3 -->
        <button class="nk-num" @click="onNumpad('7')">
          7
        </button>
        <button class="nk-num" @click="onNumpad('8')">
          8
        </button>
        <button class="nk-num" @click="onNumpad('9')">
          9
        </button>
        <button class="nk-op text-sm" @click="save(true)">
          保存再記
        </button>
        <!-- Row 4 -->
        <button class="nk-op" @click="onNumpad('.')">
          .
        </button>
        <button class="nk-num" @click="onNumpad('0')">
          0
        </button>
        <button class="nk-op" @click="onNumpad('del')">
          ⌫
        </button>
        <button
          v-if="pendingOp"
          class="h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-medium shadow-sm active:opacity-80 transition-opacity"
          style="background: linear-gradient(135deg, #fb923c, #ea580c); color: white"
          @click="evaluate"
        >
          =
        </button>
        <button
          v-else
          class="h-14 rounded-2xl flex items-center justify-center font-medium text-base shadow-sm active:opacity-80 transition-opacity"
          style="background: linear-gradient(135deg, #fb923c, #ea580c); color: white"
          :disabled="submitting"
          @click="save(false)"
        >
          {{ submitting ? '...' : '完成' }}
        </button>
      </div>
    </div>
  </van-popup>

  <!-- Payment picker -->
  <van-popup v-model:show="showPayPicker" position="bottom" round>
    <div class="px-5 pt-5 pb-8" style="padding-bottom: calc(2rem + env(safe-area-inset-bottom))">
      <p class="text-sm text-gray-400 mb-4">
        選擇支付方式
      </p>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="method in PAYMENT_METHODS"
          :key="method"
          class="px-4 py-2.5 rounded-2xl text-sm transition-colors"
          :class="paymentMethod === method
            ? 'bg-orange-500 text-white'
            : 'bg-gray-100 text-gray-500 active:bg-gray-200'"
          @click="paymentMethod = method; showPayPicker = false"
        >
          {{ method }}
        </button>
      </div>
    </div>
  </van-popup>
</template>

<style scoped>
@reference "tailwindcss";

.nk-num {
  @apply h-14 rounded-2xl bg-white flex items-center justify-center text-2xl text-gray-800 shadow-sm active:bg-gray-50 transition-colors;
}

.nk-op {
  @apply h-14 rounded-2xl bg-gray-200 flex items-center justify-center text-lg text-gray-600 active:bg-gray-300 transition-colors;
}
</style>
