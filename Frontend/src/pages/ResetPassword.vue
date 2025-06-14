<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'

const router = useRouter()
const route = useRoute()
const password = ref('')
const confirmPassword = ref('')
const mensaje = ref('')
const error = ref('')
const cargando = ref(false)

// Validación de campos
const validaciones = computed(() => ({
  password: password.value.length >= 6,
  passwordsCoinciden: password.value === confirmPassword.value
}))

const formularioValido = computed(() => {
  return validaciones.value.password && validaciones.value.passwordsCoinciden
})

const validarFormulario = () => {
  if (!validaciones.value.password) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return false
  }
  if (!validaciones.value.passwordsCoinciden) {
    error.value = 'Las contraseñas no coinciden'
    return false
  }
  return true
}

const restablecerPassword = async () => {
  if (!validarFormulario()) return

  try {
    cargando.value = true
    error.value = ''
    mensaje.value = ''

    const token = route.query.token
    if (!token) {
      throw new Error('Token de restablecimiento no válido')
    }

    const response = await fetch('https://laboratorio-dcw-production.up.railway.app/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        password: password.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al restablecer la contraseña')
    }

    mensaje.value = 'Contraseña restablecida correctamente'
    
    // Redirigir al login después de 2 segundos
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err) {
    console.error('Error:', err)
    error.value = err.message || 'Error al restablecer la contraseña'
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  const token = route.query.token
  if (!token) {
    error.value = 'Token de restablecimiento no válido'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }
})
</script>

<template>
  <Header />
  <div class="min-h-screen flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 class="text-3xl font-extrabold text-violet-700 text-center mb-8">Restablecer Contraseña</h2>
      
      <form @submit.prevent="restablecerPassword" class="space-y-6">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
          <input 
            id="password"
            v-model="password"
            type="password"
            class="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition duration-200"
            :class="{
              'border-gray-300': !password || validaciones.password,
              'border-red-500': password && !validaciones.password
            }"
            required
            minlength="6"
            placeholder="Ingresa tu nueva contraseña"
          >
          <p v-if="password && !validaciones.password" class="mt-1 text-sm text-red-600">
            La contraseña debe tener al menos 6 caracteres
          </p>
        </div>

        <div>
          <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña</label>
          <input 
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            class="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition duration-200"
            :class="{
              'border-gray-300': !confirmPassword || validaciones.passwordsCoinciden,
              'border-red-500': confirmPassword && !validaciones.passwordsCoinciden
            }"
            required
            minlength="6"
            placeholder="Confirma tu nueva contraseña"
          >
          <p v-if="confirmPassword && !validaciones.passwordsCoinciden" class="mt-1 text-sm text-red-600">
            Las contraseñas no coinciden
          </p>
        </div>

        <div v-if="mensaje" class="text-green-700 bg-green-100 p-3 rounded-lg font-medium border border-green-200">
          {{ mensaje }}
        </div>
        <div v-if="error" class="text-red-700 bg-red-100 p-3 rounded-lg font-medium border border-red-200">
          {{ error }}
        </div>

        <button 
          type="submit"
          class="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
          :disabled="cargando || !formularioValido"
        >
          {{ cargando ? 'Procesando...' : 'Restablecer Contraseña' }}
        </button>

        <div class="text-center">
          <router-link 
            to="/login" 
            class="text-violet-600 hover:text-violet-700 font-medium"
          >
            Volver al inicio de sesión
          </router-link>
        </div>
      </form>
    </div>
  </div>
  <Footer />
</template> 