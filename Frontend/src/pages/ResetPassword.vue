<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const password = ref('')
const confirmPassword = ref('')
const mensaje = ref('')
const error = ref('')
const cargando = ref(false)
const token = ref('')

const API_URL = import.meta.env.VITE_API_URL
const route = useRoute()
const router = useRouter()

onMounted(() => {
  token.value = route.params.resettoken || ''
  if (!token.value) {
    error.value = 'Token de restablecimiento no encontrado en la URL.'
  }
})

const resetearContrasena = async () => {
  mensaje.value = ''
  error.value = ''

  if (!token.value) {
    error.value = 'Token inválido. No se puede continuar.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  if (password.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }

  cargando.value = true

  try {
    const response = await fetch(`${API_URL}/auth/resetpassword/${token.value}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newPassword: password.value })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al restablecer la contraseña.')
    }

    mensaje.value = data.message || 'Contraseña restablecida correctamente.'

    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (err) {
    console.error('❌ Error al restablecer contraseña:', err)
    error.value = err.message || 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-rose-100">
    <div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
      <h2 class="text-2xl font-bold text-center text-violet-600 mb-6">Restablecer Contraseña</h2>
      <p class="text-center text-gray-600 mb-6">Ingresa tu nueva contraseña.</p>

      <form @submit.prevent="resetearContrasena" class="space-y-4">
        <input
          v-model="password"
          type="password"
          placeholder="Nueva Contraseña"
          required
          class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        <input
          v-model="confirmPassword"
          type="password"
          placeholder="Confirmar Contraseña"
          required
          class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        <p v-if="error" class="text-red-600 text-sm text-center">{{ error }}</p>
        <p v-if="mensaje" class="text-green-600 text-sm text-center">{{ mensaje }}</p>

        <button
          type="submit"
          :disabled="cargando"
          class="bg-violet-600 hover:bg-violet-700 text-white p-3 rounded w-full transition-colors duration-300"
        >
          {{ cargando ? 'Restableciendo...' : 'Restablecer Contraseña' }}
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
