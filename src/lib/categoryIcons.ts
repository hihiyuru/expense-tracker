import type { Component } from 'vue'
import {
  Activity,
  Gamepad2,
  Home,
  LayoutGrid,
  MoreHorizontal,
  Package,
  Shirt,
  Sparkles,
  Train,
  Utensils,
} from 'lucide-vue-next'
import { markRaw } from 'vue'

export const CATEGORY_ICON: Record<string, Component> = {
  餐飲: markRaw(Utensils),
  服飾: markRaw(Shirt),
  日用: markRaw(Package),
  美妝: markRaw(Sparkles),
  應用軟體: markRaw(LayoutGrid),
  住房: markRaw(Home),
  交通: markRaw(Train),
  娛樂: markRaw(Gamepad2),
  醫療: markRaw(Activity),
  其他: markRaw(MoreHorizontal),
}
