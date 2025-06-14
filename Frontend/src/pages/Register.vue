<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/utils/api'
import { guardarSesion } from '@/utils/auth'

const router = useRouter()
const nombre = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const exito = ref(false)
const cargando = ref(false)

const registrar = async () => {
  console.log('[✔] Se ejecutó la función registrar')

  cargando.value = true
  error.value = ''
  exito.value = false

  try {
    const data = await register(nombre.value, email.value, password.value)
    console.log('[📦] Respuesta del backend:', data)

    if (data.token) {
      guardarSesion(data.token, data.user)
      exito.value = true
      // Esperar 2 segundos antes de redirigir para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } else {
      error.value = data.message || 'Error al registrarse'
    }
  } catch (err) {
    console.error('[❌] Error en la solicitud:', err)
    error.value = err.message || 'Error al conectar con el servidor'
  }

  cargando.value = false
}
</script>

<template>
  <section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-rose-100">
    <div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
      <h2 class="text-2xl font-bold text-center text-violet-600 mb-6">Crear cuenta</h2>

      <form @submit.prevent="registrar" class="space-y-4">
        <div>
          <input v-model="nombre" type="text" placeholder="Nombre" required
                 class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500">
        </div>
        <div>
          <input v-model="email" type="email" placeholder="Correo electrónico" required
                 class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500">
        </div>
        <div>
          <input v-model="password" type="password" placeholder="Contraseña" required minlength="6"
                 class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500">
        </div>

        <p v-if="error" class="text-red-600 text-sm text-center">{{ error }}</p>
        <p v-if="exito" class="text-green-600 text-sm text-center">¡Registro exitoso! Redirigiendo...</p>

        <button type="submit" 
                class="bg-violet-600 text-white p-3 rounded w-full hover:bg-violet-700 transition-colors"
                :disabled="cargando">
          {{ cargando ? 'Registrando...' : 'Registrarse' }}
        </button>
      </form>

      <p class="text-sm mt-4 text-center">
        ¿Ya tienes cuenta?
        <router-link to="/login" class="text-violet-600 hover:underline font-semibold">Inicia sesión</router-link>
      </p>
    </div>
  </section>
</template>
