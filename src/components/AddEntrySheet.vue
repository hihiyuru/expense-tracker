<script setup lang="ts">
import dayjs from 'dayjs'
import { X } from 'lucide-vue-next'
import { showSuccessToast, showToast } from 'vant'
import { ref } from 'vue'
import { PAYMENT_METHODS, useExpenseStore } from '../stores/expense'
import CategoryGrid from './CategoryGrid.vue'
import Numpad from './Numpad.vue'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ 'update:show': [boolean] }>()

const store = useExpenseStore()

const selectedCategory = ref('')
const note = ref('')
const amount = ref(0)
const paymentMethod = ref('')
const submitting = ref(false)
const showPayPicker = ref(false)
const numpadRef = ref<InstanceType<typeof Numpad> | null>(null)

async function save(keepOpen = false) {
  if (!amount.value || amount.value <= 0)
    return showToast('請輸入有效金額')
  if (!selectedCategory.value)
    return showToast('請選擇類別')
  if (!paymentMethod.value)
    return showToast('請選擇支付方式')

  submitting.value = true
  const result = await store.addEntry({
    type: 'expense',
    amount: amount.value,
    category: selectedCategory.value,
    paymentMethod: paymentMethod.value,
    date: dayjs().format('YYYY-MM-DD'),
    time: dayjs().format('HH:mm'),
    note: note.value,
  })
  submitting.value = false

  if (result.ok)
    showSuccessToast('記錄成功')
  else
    showToast(`記錄失敗：${result.error}`)

  reset()
  if (!keepOpen)
    emit('update:show', false)
}

function reset() {
  selectedCategory.value = ''
  note.value = ''
  amount.value = 0
  paymentMethod.value = ''
  numpadRef.value?.reset()
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
        <CategoryGrid v-model="selectedCategory" />
      </div>

      <Numpad
        ref="numpadRef"
        v-model:note="note"
        v-model:amount="amount"
        :submitting="submitting"
        :show="props.show"
        @confirm="save(false)"
        @save-more="save(true)"
      />
    </div>
  </van-popup>

  <!-- Payment picker -->
  <van-popup v-model:show="showPayPicker" position="bottom" round>
    <van-picker
      :columns="PAYMENT_METHODS.map(m => ({ text: m, value: m }))"
      :default-index="PAYMENT_METHODS.indexOf(paymentMethod)"
      title="選擇支付方式"
      @confirm="({ selectedValues }) => { paymentMethod = selectedValues[0] as string; showPayPicker = false }"
      @cancel="showPayPicker = false"
    />
  </van-popup>
</template>
