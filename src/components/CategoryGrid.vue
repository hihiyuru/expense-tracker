<script setup lang="ts">
import { CATEGORY_ICON } from '../lib/categoryIcons'
import { EXPENSE_CATEGORIES } from '../stores/expense'

const selected = defineModel<string>({ required: true })
</script>

<template>
  <div class="grid grid-cols-5 gap-y-4 gap-x-1 pt-2">
    <button
      v-for="cat in EXPENSE_CATEGORIES"
      :key="cat"
      class="flex flex-col items-center gap-1.5"
      @click="selected = cat"
    >
      <div
        class="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-colors"
        :class="selected === cat ? 'bg-orange-500' : 'bg-gray-200'"
      >
        <component
          :is="CATEGORY_ICON[cat]"
          :size="22"
          :class="selected === cat ? 'text-white' : 'text-gray-500'"
        />
      </div>
      <span class="text-xs text-gray-500">{{ cat }}</span>
    </button>
  </div>
</template>
