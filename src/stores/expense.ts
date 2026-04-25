import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { get, post } from '../lib/http'

export interface SheetEntry {
  date: string
  category: string
  amount: number
  paymentMethod: string
  note: string
}

export interface Entry {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  type: 'expense' | 'income'
  category: string
  amount: number
  paymentMethod: string
  note: string
}

export const EXPENSE_CATEGORIES = [
  '餐飲',
  '服飾',
  '日用',
  '美妝',
  '應用軟體',
  '住房',
  '交通',
  '娛樂',
  '醫療',
  '其他',
]
export const PAYMENT_METHODS = ['現金', '中信Visa', '中信信用卡', '國泰信用卡', '永豐信用卡', '富邦信用卡', '轉帳']

export const useExpenseStore = defineStore('expense', () => {
  const scriptUrl = ref(localStorage.getItem('scriptUrl') || '')
  const todayEntries = ref<Entry[]>([])
  const todayFetching = ref(false)
  const todayFetched = ref(false)
  const monthCache = ref<{ month: string, data: SheetEntry[] } | null>(null)

  const todayStr = dayjs().format('YYYY-MM-DD')

  const todayExpense = computed(() =>
    todayEntries.value.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
  )

  const todayIncome = computed(() =>
    todayEntries.value.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0),
  )

  const todayNet = computed(() => todayIncome.value - todayExpense.value)

  function setScriptUrl(url: string) {
    scriptUrl.value = url
    localStorage.setItem('scriptUrl', url)
  }

  async function addEntry(entry: Omit<Entry, 'id'>): Promise<{ ok: boolean, error?: string }> {
    if (!scriptUrl.value)
      return { ok: false, error: 'no scriptUrl' }
    try {
      if (entry.type === 'expense') {
        await post(scriptUrl.value, {
          date: entry.date,
          category: entry.category,
          amount: entry.amount,
          paymentMethod: entry.paymentMethod,
          note: entry.note,
        })
      }
      // Invalidate caches so fresh data is loaded
      todayFetched.value = false
      monthCache.value = null
      await fetchToday()
      return { ok: true }
    }
    catch (e: any) {
      return { ok: false, error: e.message }
    }
  }

  async function fetchToday(): Promise<void> {
    if (!scriptUrl.value || todayFetched.value)
      return
    todayFetching.value = true
    todayFetched.value = true
    try {
      const data = await get<SheetEntry[]>(scriptUrl.value, { type: 'today', date: todayStr })
      todayEntries.value = data.map((d, i) => ({
        id: `sheet-${todayStr}-${i}`,
        date: todayStr,
        time: '00:00',
        type: 'expense' as const,
        category: d.category,
        amount: Number(d.amount),
        paymentMethod: d.paymentMethod || '',
        note: d.note || '',
      }))
    }
    catch (e) {
      console.error('[fetchToday] 失敗', e)
      todayFetched.value = false
    }
    finally {
      todayFetching.value = false
    }
  }

  async function fetchMonth(month: string): Promise<SheetEntry[]> {
    if (!scriptUrl.value)
      return []
    if (monthCache.value?.month === month)
      return monthCache.value.data
    try {
      const data = await get<SheetEntry[]>(scriptUrl.value, { type: 'month', month })
      monthCache.value = { month, data }
      return data
    }
    catch (e) {
      console.error('[fetchMonth] 失敗', e)
      return []
    }
  }

  return {
    scriptUrl,
    todayEntries,
    todayFetching,
    todayExpense,
    todayIncome,
    todayNet,
    setScriptUrl,
    addEntry,
    fetchToday,
    fetchMonth,
  }
})
