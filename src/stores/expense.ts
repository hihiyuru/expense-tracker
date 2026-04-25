import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

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

export const EXPENSE_CATEGORIES = ['餐飲', '交通', '娛樂', '購物', '醫療', '日用', '其他']
export const INCOME_CATEGORIES = ['薪資', '獎金', '投資', '兼職', '其他']
export const PAYMENT_METHODS = ['現金', '中信信用卡', '中信Visa', '國泰信用卡', '永豐信用卡', '富邦信用卡', '轉帳']

export const useExpenseStore = defineStore('expense', () => {
  const scriptUrl = ref(localStorage.getItem('scriptUrl') || '')
  const entries = ref<Entry[]>(JSON.parse(localStorage.getItem('entries') || '[]'))

  const todayStr = dayjs().format('YYYY-MM-DD')

  const todayEntries = computed(() =>
    entries.value.filter(e => e.date === todayStr).slice().reverse(),
  )

  const todayExpense = computed(() =>
    todayEntries.value.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
  )

  const todayIncome = computed(() =>
    todayEntries.value.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0),
  )

  const todayNet = computed(() => todayIncome.value - todayExpense.value)

  function saveLocal() {
    localStorage.setItem('entries', JSON.stringify(entries.value))
  }

  function setScriptUrl(url: string) {
    scriptUrl.value = url
    localStorage.setItem('scriptUrl', url)
  }

  async function addEntry(entry: Omit<Entry, 'id'>): Promise<{ ok: boolean, error?: string }> {
    const newEntry: Entry = { ...entry, id: Date.now().toString() }
    entries.value.push(newEntry)
    saveLocal()

    if (!scriptUrl.value)
      return { ok: true }

    try {
      const payload = newEntry.type === 'expense'
        ? { date: newEntry.date, category: newEntry.category, amount: newEntry.amount, paymentMethod: newEntry.paymentMethod, note: newEntry.note }
        : null

      if (payload) {
        await fetch(scriptUrl.value, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      return { ok: true }
    }
    catch (e: any) {
      return { ok: false, error: e.message }
    }
  }

  return {
    scriptUrl,
    entries,
    todayEntries,
    todayExpense,
    todayIncome,
    todayNet,
    setScriptUrl,
    addEntry,
  }
})
