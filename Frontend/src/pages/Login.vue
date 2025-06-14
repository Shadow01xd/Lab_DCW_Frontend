<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login as apiLogin } from '@/utils/api'
import { guardarSesion } from '@/utils/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)

const router = useRouter()

const realizarLogin = async () => {
  cargando.value = true
  error.value = ''

  try {
    const data = await apiLogin(email.value, password.value)

    console.log('[📦] Respuesta login:', data)

    if (data?.token && data?.user) {
      guardarSesion(data.token, data.user)

      if (data.user.rol === 'admin') {
        router.push('/admin_dashboard')
      } else {
        router.push('/')
      }
    } else {
      error.value = data.message || 'Correo o contraseña incorrectos.'
    }
  } catch (err) {
    console.error('[❌] Error login:', err)
    error.value = 'Error al conectar con el servidor.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-rose-100">
    <div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
      <h2 class="text-2xl font-bold text-center text-violet-600 mb-6">Iniciar sesión</h2>

      <form @submit.prevent="realizarLogin" class="space-y-4">
        <input
          v-model="email"
          type="email"
          placeholder="Correo electrónico"
          required
          class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Contraseña"
          required
          class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        <p v-if="error" class="text-red-600 text-sm text-center">{{ error }}</p>

        <button
          type="submit"
          class="bg-violet-600 hover:bg-violet-700 text-white p-3 rounded w-full transition-colors duration-300"
          :disabled="cargando"
        >
          {{ cargando ? 'Entrando...' : 'Ingresar' }}
        </button>
      </form>

      <p class="text-center text-sm mt-2">
        <router-link to="/forgotpassword" class="text-violet-600 hover:underline font-semibold">
          ¿Olvidaste tu contraseña?
        </router-link>
      </p>

      <p class="text-center text-sm text-gray-600 mt-4">
        ¿No tienes una cuenta?
        <router-link to="/register" class="text-violet-600 hover:underline font-semibold">
          Regístrate aquí
        </router-link>
      </p>
    </div>
  </section>
</template>
