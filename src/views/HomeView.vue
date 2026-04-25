<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CATEGORY_ICON } from '../lib/categoryIcons'
import { formatAmt } from '../lib/format'
import { type SheetEntry, useExpenseStore } from '../stores/expense'

const router = useRouter()

const store = useExpenseStore()
const now = ref(dayjs())
const monthEntries = ref<SheetEntry[]>([])

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_LABELS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

let timer: ReturnType<typeof setInterval>
onMounted(async () => {
  timer = setInterval(() => {
    now.value = dayjs()
  }, 1000)
  await store.fetchToday()
  monthEntries.value = await store.fetchMonth(now.value.format('YYYY-MM'))
})
onUnmounted(() => {
  clearInterval(timer)
})

const weekDays = computed(() => {
  const startOfWeek = now.value.startOf('week')
  return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
})

const datesWithEntries = computed(() => new Set(monthEntries.value.map(e => e.date)))

const weekExpense = computed(() => {
  const start = now.value.startOf('week').format('YYYY-MM-DD')
  const end = now.value.endOf('week').format('YYYY-MM-DD')
  return monthEntries.value
    .filter(e => e.date >= start && e.date <= end)
    .reduce((s, e) => s + Number(e.amount), 0)
})


</script>

<template>
  <div class="px-4 pt-4 space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <span class="text-lg font-semibold text-gray-800">記帳本</span>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
        :class="store.scriptUrl ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'"
        @click="!store.scriptUrl && router.push('/settings')"
      >
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="store.scriptUrl ? 'bg-green-500' : 'bg-gray-300'"
        />
        {{ store.scriptUrl ? '試算表已連動' : '未連動試算表' }}
      </button>
    </div>

    <!-- Calendar card -->
    <div class="rounded-3xl px-5 py-4 shadow-sm" style="background: #fff7ed">
      <!-- Top: 當前總花費 -->
      <div class="flex items-baseline justify-between mb-4">
        <span class="text-xs text-gray-400 tracking-wide">當前總花費</span>
        <span class="text-2xl font-semibold text-orange-500">{{ formatAmt(weekExpense) }}</span>
      </div>

      <!-- Month + Day -->
      <div class="flex items-baseline justify-between mb-4">
        <span class="text-3xl font-light tracking-wide text-gray-800">{{ MONTH_LABELS[now.month()] }}</span>
        <span class="text-5xl font-light tabular-nums text-gray-800">{{ now.date() }}</span>
      </div>

      <!-- Day-of-week headers -->
      <div class="grid grid-cols-7 text-center mb-1">
        <span v-for="d in WEEKDAY_LABELS" :key="d" class="text-xs text-gray-400">{{ d }}</span>
      </div>

      <!-- Week dates -->
      <div class="grid grid-cols-7 text-center">
        <div
          v-for="day in weekDays"
          :key="day.format('YYYY-MM-DD')"
          class="flex flex-col items-center gap-1"
        >
          <span
            class="w-8 h-8 flex items-center justify-center rounded-full text-sm"
            :class="day.format('YYYY-MM-DD') === now.format('YYYY-MM-DD')
              ? 'bg-orange-500 text-white font-semibold'
              : 'text-gray-600'"
          >
            {{ day.date() }}
          </span>
          <span
            class="w-1 h-1 rounded-full"
            :class="datesWithEntries.has(day.format('YYYY-MM-DD')) ? 'bg-orange-400' : 'bg-transparent'"
          />
        </div>
      </div>
    </div>

    <!-- Entries -->
    <div v-if="store.todayFetching" class="text-center text-sm text-gray-300 py-16">
      載入中...
    </div>
    <div v-else-if="store.todayEntries.length === 0" class="text-center text-sm text-gray-300 py-16">
      今日尚無記錄，點擊下方 + 新增
    </div>
    <div
      v-for="entry in store.todayEntries"
      v-else
      :key="entry.id"
      class="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
    >
      <div
        class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style="background: linear-gradient(135deg, #fb923c, #ea580c)"
      >
        <component :is="CATEGORY_ICON[entry.category]" :size="22" class="text-white" />
      </div>

      <div class="flex-1 min-w-0">
        <p class="font-semibold text-gray-800">
          {{ entry.category }}
        </p>
        <p class="text-xs text-gray-400 truncate">
          {{ entry.note || '—' }}
        </p>
      </div>

      <div class="text-right flex-shrink-0">
        <p class="font-semibold text-gray-800">
          {{ entry.type === 'expense' ? '-' : '+' }}{{ formatAmt(entry.amount) }}
        </p>
        <p class="text-xs text-gray-400">
          {{ entry.paymentMethod }}
        </p>
      </div>
    </div>
  </div>
</template>
