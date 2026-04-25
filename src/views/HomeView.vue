<script setup lang="ts">
import dayjs from 'dayjs'
import { showSuccessToast, showToast } from 'vant'
import { computed, ref } from 'vue'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, useExpenseStore } from '../stores/expense'

const store = useExpenseStore()

const today = dayjs()
const todayLabel = today.format('M/D')

const form = ref({
  type: 'expense' as 'expense' | 'income',
  amountStr: '',
  category: '',
  paymentMethod: '',
  date: today.format('YYYY-MM-DD'),
  note: '',
})

const submitting = ref(false)
const showCatPicker = ref(false)
const showPayPicker = ref(false)
const showDatePicker = ref(false)
const dateParts = ref([
  today.format('YYYY'),
  today.format('MM'),
  today.format('DD'),
])

const types = [
  { value: 'expense', label: '支出', activeClass: 'bg-red-50 text-red-500' },
  { value: 'income', label: '收入', activeClass: 'bg-green-50 text-green-500' },
]

const currentCategories = computed(() =>
  (form.value.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(text => ({ text, value: text })),
)

function formatAmt(n: number) {
  return `NT$ ${n.toLocaleString()}`
}

function onCatConfirm({ selectedValues }: { selectedValues: string[] }) {
  form.value.category = selectedValues[0] ?? ''
  showCatPicker.value = false
}

function onPayConfirm({ selectedValues }: { selectedValues: string[] }) {
  form.value.paymentMethod = selectedValues[0] ?? ''
  showPayPicker.value = false
}

function onDateConfirm({ selectedValues }: { selectedValues: (string | undefined)[] }) {
  form.value.date = selectedValues.filter(Boolean).join('-')
  showDatePicker.value = false
}

async function handleSubmit() {
  const amount = Number.parseFloat(form.value.amountStr)
  if (!amount || amount <= 0)
    return showToast('請輸入有效金額')
  if (!form.value.category)
    return showToast('請選擇類別')
  if (form.value.type === 'expense' && !form.value.paymentMethod)
    return showToast('請選擇支付方式')

  submitting.value = true
  const time = dayjs().format('HH:mm')

  const result = await store.addEntry({
    type: form.value.type,
    amount,
    category: form.value.category,
    paymentMethod: form.value.paymentMethod,
    date: form.value.date,
    time,
    note: form.value.note,
  })

  submitting.value = false

  if (result.ok) {
    showSuccessToast('記錄成功')
    form.value.amountStr = ''
    form.value.note = ''
    form.value.category = ''
    form.value.paymentMethod = ''
  }
  else {
    showToast('本地已儲存，試算表同步失敗')
  }
}
</script>

<template>
  <div>
    <van-nav-bar title="每日記帳" />

    <!-- Today Summary -->
    <div class="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
      <p class="text-xs text-gray-400 mb-3">
        {{ todayLabel }} 今日總覽
      </p>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div>
          <p class="text-xs text-gray-400 mb-1">
            支出
          </p>
          <p class="text-lg font-semibold text-red-500">
            {{ formatAmt(store.todayExpense) }}
          </p>
        </div>
        <div class="border-x border-gray-100">
          <p class="text-xs text-gray-400 mb-1">
            收入
          </p>
          <p class="text-lg font-semibold text-green-500">
            {{ formatAmt(store.todayIncome) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 mb-1">
            淨額
          </p>
          <p class="text-lg font-semibold" :class="store.todayNet >= 0 ? 'text-green-500' : 'text-red-500'">
            {{ store.todayNet >= 0 ? '+' : '' }}{{ formatAmt(store.todayNet) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Add Entry Form -->
    <div class="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="p-4 pb-0">
        <p class="text-sm font-medium text-gray-700 mb-3">
          新增記帳
        </p>
        <div class="flex gap-2 mb-4">
          <button
            v-for="t in types" :key="t.value"
            class="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
            :class="form.type === t.value ? t.activeClass : 'bg-gray-100 text-gray-500'"
            @click="form.type = t.value as 'expense' | 'income'"
          >
            {{ t.label }}
          </button>
        </div>
      </div>

      <van-cell-group inset>
        <van-field
          v-model="form.amountStr"
          type="number"
          label="金額"
          placeholder="0"
          input-align="right"
        >
          <template #left-icon>
            <span class="text-gray-400 text-sm mr-1">NT$</span>
          </template>
        </van-field>

        <van-field
          v-model="form.category"
          is-link
          readonly
          label="類別"
          placeholder="請選擇"
          input-align="right"
          @click="showCatPicker = true"
        />

        <van-field
          v-if="form.type === 'expense'"
          v-model="form.paymentMethod"
          is-link
          readonly
          label="支付方式"
          placeholder="請選擇"
          input-align="right"
          @click="showPayPicker = true"
        />

        <van-field
          v-model="form.date"
          is-link
          readonly
          label="日期"
          input-align="right"
          @click="showDatePicker = true"
        />

        <van-field
          v-model="form.note"
          label="備註"
          placeholder="選填"
          input-align="right"
        />
      </van-cell-group>

      <div class="p-4">
        <van-button
          type="primary"
          block
          round
          :loading="submitting"
          loading-text="同步中..."
          @click="handleSubmit"
        >
          記錄並同步試算表
        </van-button>
      </div>
    </div>

    <!-- Today Entries -->
    <div class="mx-4 mt-4 mb-4">
      <p class="text-xs text-gray-400 mb-2 px-1">
        今日記錄
      </p>
      <div v-if="store.todayEntries.length === 0" class="text-center text-sm text-gray-300 py-8">
        今日尚無記錄
      </div>
      <div v-else class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div
          v-for="(entry, i) in store.todayEntries" :key="entry.id"
          class="flex items-center justify-between px-4 py-3"
          :class="i < store.todayEntries.length - 1 ? 'border-b border-gray-50' : ''"
        >
          <div class="flex items-center gap-3">
            <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{{ entry.category }}</span>
            <div>
              <p class="text-sm text-gray-700">
                {{ entry.note || '無備註' }}
              </p>
              <p class="text-xs text-gray-300">
                {{ entry.paymentMethod || entry.time }}
              </p>
            </div>
          </div>
          <span class="text-sm font-semibold" :class="entry.type === 'expense' ? 'text-red-500' : 'text-green-500'">
            {{ entry.type === 'expense' ? '-' : '+' }}{{ formatAmt(entry.amount) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Category Picker -->
    <van-popup v-model:show="showCatPicker" position="bottom" round>
      <van-picker
        :columns="currentCategories"
        title="選擇類別"
        @confirm="onCatConfirm"
        @cancel="showCatPicker = false"
      />
    </van-popup>

    <!-- Payment Method Picker -->
    <van-popup v-model:show="showPayPicker" position="bottom" round>
      <van-picker
        :columns="PAYMENT_METHODS.map(text => ({ text, value: text }))"
        title="選擇支付方式"
        @confirm="onPayConfirm"
        @cancel="showPayPicker = false"
      />
    </van-popup>

    <!-- Date Picker -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="dateParts"
        title="選擇日期"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>
