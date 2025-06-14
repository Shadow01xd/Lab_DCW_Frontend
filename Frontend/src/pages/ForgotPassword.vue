<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const mensaje = ref('')
const error = ref('')
const cargando = ref(false)

const API_URL = import.meta.env.VITE_API_URL
const router = useRouter()

const solicitarRestablecimiento = async () => {
  cargando.value = true
  mensaje.value = ''
  error.value = ''

  if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    error.value = 'Por favor, introduce un correo válido.'
    cargando.value = false
    return
  }

  try {
    const response = await fetch(`${API_URL}/auth/forgotpassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email.value })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al enviar el correo de restablecimiento.')
    }

    mensaje.value = data.message || 'Instrucciones enviadas correctamente.'

    setTimeout(() => {
      router.push({ name: 'VerifyResetCode', query: { email: email.value } })
    }, 2000)
  } catch (err) {
    console.error('[❌] Error al solicitar restablecimiento:', err)
    error.value = err.message || 'Error al conectar con el servidor.'
  } finally {
    cargando.value = false
  }
}
</script>


<template>
  <section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-rose-100">
    <div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
      <h2 class="text-2xl font-bold text-center text-violet-600 mb-6">¿Olvidaste tu contraseña?</h2>
      <p class="text-center text-gray-600 mb-6">
        Ingresa tu correo electrónico para recibir un código de verificación.
      </p>

      <form @submit.prevent="solicitarRestablecimiento" class="space-y-4">
        <input
          v-model="email"
          type="email"
          placeholder="Correo electrónico"
          required
          class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        <p v-if="error" class="text-red-600 text-sm text-center">{{ error }}</p>
        <p v-if="mensaje" class="text-green-600 text-sm text-center">{{ mensaje }}</p>

        <button
          type="submit"
          class="bg-violet-600 hover:bg-violet-700 text-white p-3 rounded w-full transition-colors duration-300"
          :disabled="cargando"
        >
          {{ cargando ? 'Enviando...' : 'Enviar código de verificación' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-600 mt-4">
        <router-link to="/login" class="text-violet-600 hover:underline font-semibold">
          Volver al inicio de sesión
        </router-link>
      </p>
    </div>
  </section>
</template>
