<script setup lang="ts">
import type { Entry } from '../stores/expense'
import { computed } from 'vue'
import { useExpenseStore } from '../stores/expense'

const store = useExpenseStore()

interface GroupData {
  entries: Entry[]
  totalExpense: number
}

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
    <van-nav-bar title="消費明細" />
    <div class="mx-4 mt-4">
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
              v-for="(entry, i) in group.entries" :key="entry.id"
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
              <span class="text-sm font-semibold" :class="entry.type === 'expense' ? 'text-red-500' : 'text-green-500'">
                {{ entry.type === 'expense' ? '-' : '+' }}{{ formatAmt(entry.amount) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
