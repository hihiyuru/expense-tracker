<script setup lang="ts">
import { ref } from 'vue'
import AddEntrySheet from './components/AddEntrySheet.vue'
import TabBar from './components/TabBar.vue'

const showAddEntry = ref(false)
</script>

<template>
  <div
    class="max-w-md mx-auto min-h-screen bg-gray-50"
    style="padding-bottom: calc(4.5rem + env(safe-area-inset-bottom))"
  >
    <router-view />
    <TabBar @add="showAddEntry = true" />
    <AddEntrySheet v-model:show="showAddEntry" />
  </div>
</template>
