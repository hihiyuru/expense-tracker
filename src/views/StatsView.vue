<script setup lang="ts">
import type { Entry } from '../stores/expense'
import dayjs from 'dayjs'
import { computed } from 'vue'
import { useExpenseStore } from '../stores/expense'

const store = useExpenseStore()

const today = dayjs()
const monthStr = today.format('YYYY-MM')

const monthEntries = computed(() =>
  store.entries.filter(e => e.date.startsWith(monthStr)),
)
const monthExpense = computed(() =>
  monthEntries.value.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
)
const monthIncome = computed(() =>
  monthEntries.value.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0),
)

interface GroupData { entries: Entry[], totalExpense: number }
const groupedEntries = computed(() => {
  const groups: Record<string, GroupData> = {}
  const sorted = [...store.entries].sort(
    (a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time),
  )
  for (const entry of sorted) {
    if (!groups[entry.date])
      groups[entry.date] = { entries: [], totalExpense: 0 }
    groups[entry.date]!.entries.push(entry)
    if (entry.type === 'expense')
      groups[entry.date]!.totalExpense += entry.amount
  }
  return groups
})

function formatAmt(n: number) {
  return `NT$ ${n.toLocaleString()}`
}
</script>

<template>
  <div>
    <van-nav-bar title="統計" />

    <!-- Today summary -->
    <div class="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
      <p class="text-xs text-gray-400 mb-3">
        {{ today.format('M/D') }} 今日總覽
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
          <p
            class="text-lg font-semibold"
            :class="store.todayNet >= 0 ? 'text-green-500' : 'text-red-500'"
          >
            {{ store.todayNet >= 0 ? '+' : '' }}{{ formatAmt(store.todayNet) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Month summary -->
    <div class="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm">
      <p class="text-xs text-gray-400 mb-3">
        {{ today.format('M') }} 月總計
      </p>
      <div class="grid grid-cols-2 gap-2 text-center">
        <div>
          <p class="text-xs text-gray-400 mb-1">
            支出
          </p>
          <p class="text-lg font-semibold text-red-500">
            {{ formatAmt(monthExpense) }}
          </p>
        </div>
        <div class="border-l border-gray-100">
          <p class="text-xs text-gray-400 mb-1">
            收入
          </p>
          <p class="text-lg font-semibold text-green-500">
            {{ formatAmt(monthIncome) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Entries list -->
    <div class="mx-4 mt-4 mb-4">
      <p class="text-xs text-gray-400 mb-2 px-1">
        明細記錄
      </p>
      <div v-if="store.entries.length === 0" class="text-center text-sm text-gray-300 py-16">
        尚無任何記錄
      </div>
      <div v-else>
        <div v-for="(group, date) in groupedEntries" :key="date" class="mb-4">
          <div class="flex justify-between items-center px-1 mb-2">
            <p class="text-xs text-gray-400">
              {{ date }}
            </p>
            <p class="text-xs text-gray-400">
              支出 <span class="text-red-400">{{ formatAmt(group.totalExpense) }}</span>
            </p>
          </div>
          <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div
              v-for="(entry, i) in group.entries"
              :key="entry.id"
              class="flex items-center justify-between px-4 py-3"
              :class="i < group.entries.length - 1 ? 'border-b border-gray-50' : ''"
            >
              <div class="flex items-center gap-3">
                <span class="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{{ entry.category }}</span>
                <div>
                  <p class="text-sm text-gray-700">
                    {{ entry.note || '無備註' }}
                  </p>
                  <p class="text-xs text-gray-300">
                    {{ entry.time }}
                  </p>
                </div>
              </div>
              <span
                class="text-sm font-semibold"
                :class="entry.type === 'expense' ? 'text-red-500' : 'text-green-500'"
              >
                {{ entry.type === 'expense' ? '-' : '+' }}{{ formatAmt(entry.amount) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
