<script setup lang="ts">
import { BarChart3, Home, Settings2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AddEntrySheet from './components/AddEntrySheet.vue'

const route = useRoute()
const router = useRouter()
const showAddEntry = ref(false)

const isHome = computed(() => route.path === '/')
</script>

<template>
  <div
    class="max-w-md mx-auto min-h-screen bg-gray-50"
    style="padding-bottom: calc(4.5rem + env(safe-area-inset-bottom))"
  >
    <router-view />

    <!-- Tab bar -->
    <div class="fixed bottom-0 inset-x-0 max-w-md mx-auto">
      <!-- Floating + button (only when on home) -->
      <Transition
        enter-active-class="transition-all duration-200"
        enter-from-class="scale-0 opacity-0"
        enter-to-class="scale-100 opacity-100"
        leave-active-class="transition-all duration-200"
        leave-from-class="scale-100 opacity-100"
        leave-to-class="scale-0 opacity-0"
      >
        <div v-if="isHome" class="absolute left-1/2 -translate-x-1/2 -top-7 z-10">
          <button
            class="w-16 h-16 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform"
            style="background: linear-gradient(135deg, #fb923c, #ea580c)"
            @click="showAddEntry = true"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </Transition>

      <div
        class="bg-white border-t border-gray-100 flex items-center justify-around px-12 pt-3"
        style="padding-bottom: calc(1rem + env(safe-area-inset-bottom))"
      >
        <!-- 統計 -->
        <button class="flex flex-col items-center gap-1" @click="router.push('/stats')">
          <BarChart3
            :size="24"
            :class="route.path === '/stats' ? 'text-orange-500' : 'text-gray-400'"
          />
          <span class="text-xs" :class="route.path === '/stats' ? 'text-orange-500' : 'text-gray-400'">統計</span>
        </button>

        <!-- Center: spacer (home page) or home button (other pages) -->
        <div v-if="isHome" class="w-16" />
        <button v-else class="flex flex-col items-center gap-1" @click="router.push('/')">
          <Home :size="24" class="text-gray-400" />
          <span class="text-xs text-gray-400">首頁</span>
        </button>

        <!-- 設定 -->
        <button class="flex flex-col items-center gap-1" @click="router.push('/settings')">
          <Settings2
            :size="24"
            :class="route.path === '/settings' ? 'text-orange-500' : 'text-gray-400'"
          />
          <span class="text-xs" :class="route.path === '/settings' ? 'text-orange-500' : 'text-gray-400'">設定</span>
        </button>
      </div>
    </div>

    <AddEntrySheet v-model:show="showAddEntry" />
  </div>
</template>
