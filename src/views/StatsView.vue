<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'
import { formatAmt } from '../lib/format'
import { type SheetEntry, useExpenseStore } from '../stores/expense'

const store = useExpenseStore()
const today = dayjs()
const monthStr = today.format('YYYY-MM')

const monthLoading = ref(false)
const monthTotal = ref(0)
const categoryStats = ref<{ category: string, total: number }[]>([])
const monthEntries = ref<SheetEntry[]>([])

onMounted(async () => {
  monthLoading.value = true
  store.fetchToday()
  const data = await store.fetchMonth(monthStr)
  monthEntries.value = data
  const map: Record<string, number> = {}
  let total = 0
  for (const entry of data) {
    const amt = Number(entry.amount)
    map[entry.category] = (map[entry.category] || 0) + amt
    total += amt
  }
  monthTotal.value = total
  categoryStats.value = Object.entries(map)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
  monthLoading.value = false
})

const todayLabel = today.format('M月D日')

const groupedEntries = computed(() => {
  const groups: Record<string, { entries: SheetEntry[], totalExpense: number }> = {}
  const sorted = [...monthEntries.value].sort((a, b) => b.date.localeCompare(a.date))
  for (const entry of sorted) {
    if (!groups[entry.date])
      groups[entry.date] = { entries: [], totalExpense: 0 }
    groups[entry.date]!.entries.push(entry)
    groups[entry.date]!.totalExpense += Number(entry.amount)
  }
  return groups
})


</script>

<template>
  <div>
    <van-nav-bar title="統計" />

    <!-- Today summary -->
    <div class="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
      <p class="text-xs text-gray-400 mb-3">
        {{ todayLabel }} 今日
      </p>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div>
          <p class="text-xs text-gray-400 mb-1">
            支出
          </p>
          <p class="text-base font-semibold text-gray-800">
            {{ formatAmt(store.todayExpense) }}
          </p>
        </div>
        <div class="border-x border-gray-100">
          <p class="text-xs text-gray-400 mb-1">
            收入
          </p>
          <p class="text-base font-semibold text-green-500">
            {{ formatAmt(store.todayIncome) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 mb-1">
            淨額
          </p>
          <p class="text-base font-semibold" :class="store.todayNet >= 0 ? 'text-green-500' : 'text-gray-800'">
            {{ store.todayNet >= 0 ? '+' : '' }}{{ formatAmt(store.todayNet) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Monthly stats from Sheets -->
    <div class="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm">
      <div class="flex items-baseline justify-between mb-3">
        <p class="text-xs text-gray-400">
          {{ today.format('M') }} 月消費統計
        </p>
        <p class="text-base font-semibold text-gray-800">
          {{ formatAmt(monthTotal) }}
        </p>
      </div>

      <div v-if="monthLoading" class="text-center text-xs text-gray-300 py-4">
        載入中...
      </div>
      <div v-else-if="!store.scriptUrl" class="text-center text-xs text-gray-300 py-4">
        未連動試算表
      </div>
      <div v-else-if="categoryStats.length === 0" class="text-center text-xs text-gray-300 py-4">
        本月尚無記錄
      </div>
      <div v-else class="space-y-3">
        <div v-for="stat in categoryStats" :key="stat.category">
          <div class="flex justify-between text-xs text-gray-600 mb-1">
            <span>{{ stat.category }}</span>
            <span>{{ formatAmt(stat.total) }}</span>
          </div>
          <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full"
              style="background: linear-gradient(90deg, #fb923c, #ea580c)"
              :style="{ width: `${(stat.total / monthTotal) * 100}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Entry history -->
    <div class="mx-4 mt-4 mb-4">
      <p class="text-xs text-gray-400 mb-2 px-1">
        本月明細
      </p>
      <div v-if="monthLoading" class="text-center text-sm text-gray-300 py-16">
        載入中...
      </div>
      <div v-else-if="monthEntries.length === 0" class="text-center text-sm text-gray-300 py-16">
        尚無任何記錄
      </div>
      <div v-else>
        <div v-for="(group, date) in groupedEntries" :key="date" class="mb-4">
          <div class="flex justify-between items-center px-1 mb-2">
            <p class="text-xs text-gray-400">
              {{ date }}
            </p>
            <p class="text-xs text-gray-400">
              支出 <span class="text-gray-600">{{ formatAmt(group.totalExpense) }}</span>
            </p>
          </div>
          <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div
              v-for="(entry, i) in group.entries"
              :key="i"
              class="flex items-center justify-between px-4 py-3"
              :class="i < group.entries.length - 1 ? 'border-b border-gray-50' : ''"
            >
              <div class="flex items-center gap-3">
                <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{{ entry.category }}</span>
                <p class="text-sm text-gray-600">
                  {{ entry.note || '—' }}
                </p>
              </div>
              <span class="text-sm font-semibold text-gray-800">
                -{{ formatAmt(Number(entry.amount)) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
