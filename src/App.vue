<script setup lang="ts">
import { ref } from 'vue'

const active = ref(0)
</script>

<template>
  <div class="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">
    <router-view />
    <van-tabbar v-model="active" fixed safe-area-inset-bottom>
      <van-tabbar-item icon="records" @click="$router.push('/')">
        記帳
      </van-tabbar-item>
      <van-tabbar-item icon="orders-o" @click="$router.push('/history')">
        明細
      </van-tabbar-item>
      <van-tabbar-item icon="setting-o" @click="$router.push('/settings')">
        設定
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>
