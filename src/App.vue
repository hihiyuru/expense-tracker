<script setup lang="ts">
import type { Entry } from './stores/expense'
import { provide, ref } from 'vue'
import AddEntrySheet from './components/AddEntrySheet.vue'
import TabBar from './components/TabBar.vue'

const showAddEntry = ref(false)
const editingEntry = ref<Entry | null>(null)

function openEditEntry(entry: Entry) {
  editingEntry.value = entry
  showAddEntry.value = true
}

function onSheetClose(v: boolean) {
  showAddEntry.value = v
  if (!v)
    editingEntry.value = null
}

provide('openEditEntry', openEditEntry)
</script>

<template>
  <div
    class="max-w-md mx-auto min-h-screen bg-gray-50"
    style="padding-bottom: calc(4.5rem + env(safe-area-inset-bottom))"
  >
    <router-view />
    <TabBar @add="showAddEntry = true" />
    <AddEntrySheet
      :show="showAddEntry"
      :editing-entry="editingEntry"
      @update:show="onSheetClose"
    />
  </div>
</template>
