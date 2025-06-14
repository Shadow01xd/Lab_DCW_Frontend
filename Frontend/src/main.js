import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import api from './config/axios'

import './assets/main.css' 

const app = createApp(App)

// Hacer disponible la instancia de axios globalmente
app.config.globalProperties.$api = api

app.use(router).mount('#app')
