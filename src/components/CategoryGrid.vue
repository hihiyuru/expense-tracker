<script setup lang="ts">
import { CATEGORY_ICON } from '../lib/categoryIcons'
import { EXPENSE_CATEGORIES } from '../stores/expense'

const selected = defineModel<string>({ required: true })
</script>

<template>
  <div class="grid grid-cols-4 gap-3 px-4 py-3">
    <button
      v-for="cat in EXPENSE_CATEGORIES"
      :key="cat"
      class="flex flex-col items-center gap-2 rounded-3xl py-4 transition-colors"
      :class="selected === cat ? 'bg-gray-200' : 'bg-gray-100'"
      @click="selected = cat"
    >
      <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center">
        <component :is="CATEGORY_ICON[cat]" :size="22" class="text-gray-600" />
      </div>
      <span class="text-xs text-gray-500">{{ cat }}</span>
    </button>
  </div>
</template>
