<script setup lang="ts">
import dayjs from 'dayjs'
import { Clock } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

const props = defineProps<{ submitting: boolean, show: boolean }>()
const emit = defineEmits<{
  confirm: []
  saveMore: []
}>()

const note = defineModel<string>('note', { required: true })
const amount = defineModel<number>('amount', { required: true })

const inputStr = ref('0')
const pendingOp = ref<'+' | '-' | '*' | '/' | null>(null)
const prevNum = ref<number | null>(null)
const currentTime = ref(dayjs().format('HH:mm'))

watch(() => props.show, (shown) => {
  if (shown)
    currentTime.value = dayjs().format('HH:mm')
})

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

watch(finalAmount, val => amount.value = val)

const OP_SYMBOL: Record<string, string> = { '+': '+', '-': '-', '*': '×', '/': '÷' }

const exprLabel = computed(() => {
  if (prevNum.value !== null && pendingOp.value)
    return `${prevNum.value} ${OP_SYMBOL[pendingOp.value]} `
  return null
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
      pendingOp.value = secondary
    }
    else {
      prevNum.value = finalAmount.value
      inputStr.value = '0'
    }
  }
  else if (pendingOp.value === secondary) {
    pendingOp.value = primary
  }
  else {
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

function reset() {
  inputStr.value = '0'
  pendingOp.value = null
  prevNum.value = null
}

defineExpose({ reset })
</script>

<template>
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
    </div>
  </div>

  <!-- Numpad -->
  <div
    class="grid grid-cols-4 gap-2 px-3 pb-3 bg-gray-100"
    style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))"
  >
    <!-- Row 1 -->
    <button class="nk-num" @click="onNumpad('1')">1</button>
    <button class="nk-num" @click="onNumpad('2')">2</button>
    <button class="nk-num" @click="onNumpad('3')">3</button>
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
    <button class="nk-num" @click="onNumpad('4')">4</button>
    <button class="nk-num" @click="onNumpad('5')">5</button>
    <button class="nk-num" @click="onNumpad('6')">6</button>
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
    <button class="nk-num" @click="onNumpad('7')">7</button>
    <button class="nk-num" @click="onNumpad('8')">8</button>
    <button class="nk-num" @click="onNumpad('9')">9</button>
    <button class="nk-op text-sm" @click="emit('saveMore')">保存再記</button>
    <!-- Row 4 -->
    <button class="nk-op" @click="onNumpad('.')">.</button>
    <button class="nk-num" @click="onNumpad('0')">0</button>
    <button class="nk-op" @click="onNumpad('del')">⌫</button>
    <button
      v-if="pendingOp"
      class="h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-medium shadow-sm active:opacity-80 transition-opacity"
      style="background: linear-gradient(135deg, #fb923c, #ea580c)"
      @click="evaluate"
    >
      =
    </button>
    <button
      v-else
      class="h-14 rounded-2xl flex items-center justify-center font-medium text-base shadow-sm active:opacity-80 transition-opacity"
      style="background: linear-gradient(135deg, #fb923c, #ea580c); color: white"
      :disabled="submitting"
      @click="emit('confirm')"
    >
      {{ submitting ? '...' : '完成' }}
    </button>
  </div>
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
