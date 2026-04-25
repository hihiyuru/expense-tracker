import { createPinia } from 'pinia'
import Vant from 'vant'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import HomeView from './views/HomeView.vue'
import SettingsView from './views/SettingsView.vue'
import StatsView from './views/StatsView.vue'
import './style.css'
import 'vant/lib/index.css'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView },
    { path: '/stats', component: StatsView },
    { path: '/settings', component: SettingsView },
  ],
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Vant)
app.mount('#app')
