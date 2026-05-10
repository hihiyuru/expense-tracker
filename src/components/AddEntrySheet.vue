<script setup lang="ts">
import type { Component } from 'vue'
import type { Entry } from '../stores/expense'
import dayjs from 'dayjs'
import { ArrowLeftRight, Banknote, CreditCard, Smartphone, Trash2, X } from 'lucide-vue-next'
import { closeToast, showConfirmDialog, showLoadingToast, showSuccessToast, showToast } from 'vant'
import { computed, markRaw, nextTick, ref, watch } from 'vue'
import { CATEGORY_ICON } from '../lib/categoryIcons'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, useExpenseStore } from '../stores/expense'
import Numpad from './Numpad.vue'

const props = defineProps<{ show: boolean, editingEntry?: Entry | null }>()
const emit = defineEmits<{ 'update:show': [boolean] }>()

const store = useExpenseStore()

const selectedCategory = ref('')
const note = ref('')
const amount = ref(0)
const paymentMethod = ref('')
const submitting = ref(false)
const showPayment = ref(false)
const numpadRef = ref<InstanceType<typeof Numpad> | null>(null)

const isEditing = computed(() => !!props.editingEntry)

watch(() => props.editingEntry, async (entry) => {
  if (entry) {
    selectedCategory.value = entry.category
    paymentMethod.value = entry.paymentMethod
    note.value = entry.note || ''
    amount.value = entry.amount
    showPayment.value = false
    await nextTick()
    numpadRef.value?.setInitialAmount(entry.amount)
  }
})

const PAYMENT_ICON: Record<string, Component> = {
  現金: markRaw(Banknote),
  中信Visa: markRaw(CreditCard),
  中信信用卡: markRaw(CreditCard),
  國泰信用卡: markRaw(CreditCard),
  永豐信用卡: markRaw(CreditCard),
  富邦信用卡: markRaw(CreditCard),
  轉帳: markRaw(ArrowLeftRight),
  'Line Pay': markRaw(Smartphone),
  全支付: markRaw(Smartphone),
}

const COLS = 4

const categoryRows = computed(() => {
  const rows: string[][] = []
  for (let i = 0; i < EXPENSE_CATEGORIES.length; i += COLS)
    rows.push(EXPENSE_CATEGORIES.slice(i, i + COLS))
  return rows
})

const selectedRowIndex = computed(() => {
  if (!selectedCategory.value) return -1
  const idx = EXPENSE_CATEGORIES.indexOf(selectedCategory.value)
  return Math.floor(idx / COLS)
})

function onCategoryClick(cat: string) {
  if (selectedCategory.value === cat) {
    showPayment.value = !showPayment.value
  }
  else {
    selectedCategory.value = cat
    showPayment.value = true
  }
}

function selectPayment(method: string) {
  paymentMethod.value = method
  showPayment.value = false
}

async function save(keepOpen = false) {
  if (!amount.value || amount.value <= 0)
    return showToast('請輸入有效金額')
  if (!selectedCategory.value)
    return showToast('請選擇類別')
  if (!paymentMethod.value)
    return showToast('請選擇支付方式')

  if (isEditing.value && props.editingEntry) {
    const updated = {
      type: 'expense' as const,
      amount: amount.value,
      category: selectedCategory.value,
      paymentMethod: paymentMethod.value,
      date: props.editingEntry.date,
      time: props.editingEntry.time,
      note: note.value,
    }
    reset()
    emit('update:show', false)
    showLoadingToast({ message: '更新中...', forbidClick: true, duration: 0 })
    const result = await store.updateEntry(props.editingEntry.id, updated)
    closeToast()
    if (result.ok)
      showSuccessToast('更新成功')
    else
      showToast(`更新失敗：${result.error}`)
    return
  }

  const entry = {
    type: 'expense' as const,
    amount: amount.value,
    category: selectedCategory.value,
    paymentMethod: paymentMethod.value,
    date: dayjs().format('YYYY-MM-DD'),
    time: dayjs().format('HH:mm'),
    note: note.value,
  }

  reset()
  if (!keepOpen)
    emit('update:show', false)

  showLoadingToast({ message: '記錄中...', forbidClick: true, duration: 0 })
  const result = await store.addEntry(entry)
  closeToast()

  if (result.ok)
    showSuccessToast('記錄成功')
  else
    showToast(`記錄失敗：${result.error}`)
}

async function handleDelete() {
  if (!props.editingEntry) return
  try {
    await showConfirmDialog({ title: '刪除記錄', message: '確定要刪除這筆記錄嗎？' })
  }
  catch {
    return // user cancelled
  }
  const id = props.editingEntry.id
  reset()
  emit('update:show', false)
  showLoadingToast({ message: '刪除中...', forbidClick: true, duration: 0 })
  const result = await store.deleteEntry(id)
  closeToast()
  if (result.ok)
    showSuccessToast('已刪除')
  else
    showToast(`刪除失敗：${result.error}`)
}

function reset() {
  selectedCategory.value = ''
  note.value = ''
  amount.value = 0
  paymentMethod.value = ''
  showPayment.value = false
  numpadRef.value?.reset()
}
</script>

<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    :style="{ height: '92dvh' }"
    @update:show="(v: boolean) => { if (!v) reset(); emit('update:show', v) }"
  >
    <div class="flex flex-col h-full bg-white">
      <!-- Header -->
      <div class="relative flex items-center px-4 py-3">
        <button
          class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
          @click="emit('update:show', false)"
        >
          <X :size="18" class="text-gray-500" />
        </button>
        <span class="absolute left-1/2 -translate-x-1/2 text-base font-medium text-gray-700">{{ isEditing ? '編輯支出' : '支出' }}</span>
        <button
          v-if="isEditing"
          class="ml-auto w-9 h-9 rounded-full bg-red-50 flex items-center justify-center"
          @click="handleDelete"
        >
          <Trash2 :size="18" class="text-red-500" />
        </button>
      </div>

      <!-- Scrollable area -->
      <div class="flex-1 overflow-y-auto px-4 pb-2">
        <template v-for="(row, rowIdx) in categoryRows" :key="rowIdx">
          <!-- Category row -->
          <div class="grid grid-cols-4 gap-3 mb-3">
            <button
              v-for="cat in row"
              :key="cat"
              class="flex flex-col items-center gap-2 rounded-3xl py-4 transition-colors border-2"
              :class="selectedCategory === cat ? 'bg-orange-50 border-orange-400' : 'bg-gray-100 border-transparent'"
              @click="onCategoryClick(cat)"
            >
              <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <component :is="CATEGORY_ICON[cat]" :size="22" :class="selectedCategory === cat ? 'text-orange-500' : 'text-gray-600'" />
              </div>
              <span class="text-xs" :class="selectedCategory === cat ? 'text-orange-500 font-medium' : 'text-gray-500'">{{ cat }}</span>
            </button>
          </div>

          <!-- Payment expanded (after selected row) -->
          <Transition
            enter-active-class="transition-all duration-300 ease-out overflow-hidden"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-[500px] opacity-100"
            leave-active-class="transition-all duration-200 ease-in overflow-hidden"
            leave-from-class="max-h-[500px] opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div v-if="rowIdx === selectedRowIndex && showPayment" class="mb-3 bg-orange-50 rounded-2xl overflow-hidden">
              <button class="w-full flex items-center px-4 py-3 text-left" @click="showPayment = false">
                <CreditCard :size="16" class="text-orange-500 mr-2 flex-shrink-0" />
                <span class="text-base text-gray-700 font-medium flex-1">選擇支付方式</span>
                <span class="w-2 h-2 rounded-full bg-orange-400" />
              </button>
              <div class="border-t border-orange-200 mx-3" />
              <div class="grid grid-cols-2 gap-2 p-3">
                <button
                  v-for="method in PAYMENT_METHODS"
                  :key="method"
                  class="flex items-center gap-2 bg-white rounded-xl px-3 py-3 text-xs text-gray-700 border border-orange-200 active:bg-orange-50 transition-colors"
                  :class="paymentMethod === method ? 'ring-2 ring-orange-400' : ''"
                  @click="selectPayment(method)"
                >
                  <component :is="PAYMENT_ICON[method]" :size="16" class="text-orange-500 flex-shrink-0" />
                  {{ method }}
                </button>
              </div>
            </div>
          </Transition>

          <!-- Payment collapsed summary (after selected row) -->
          <button
            v-if="rowIdx === selectedRowIndex && paymentMethod && !showPayment"
            class="w-full mb-3 bg-orange-50 rounded-2xl px-4 py-3 flex items-center gap-3 active:bg-orange-100 transition-colors"
            @click="showPayment = true"
          >
            <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <component :is="PAYMENT_ICON[paymentMethod]" :size="18" class="text-orange-500" />
            </div>
            <div class="flex-1 text-left">
              <p class="text-xs text-orange-400">支付方式</p>
              <p class="text-sm font-semibold text-gray-800">{{ paymentMethod }}</p>
            </div>
            <span class="text-sm text-orange-500 font-medium">修改</span>
          </button>
        </template>
      </div>

      <Numpad
        ref="numpadRef"
        v-model:note="note"
        v-model:amount="amount"
        :submitting="submitting"
        :show="props.show"
        :editing="isEditing"
        @confirm="save(false)"
        @save-more="save(true)"
      />
    </div>
  </van-popup>
</template>
