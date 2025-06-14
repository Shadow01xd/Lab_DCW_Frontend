<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'

const router = useRouter()
const email = ref('')
const mensaje = ref('')
const error = ref('')
const cargando = ref(false)

// Validación de email
const emailValido = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
})

const formularioValido = computed(() => {
  return emailValido.value
})

const enviarSolicitud = async () => {
  if (!formularioValido.value) {
    error.value = 'Por favor, ingresa un email válido'
    return
  }

  try {
    cargando.value = true
    error.value = ''
    mensaje.value = ''

    const response = await fetch('https://laboratorio-dcw-production.up.railway.app/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email.value })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al procesar la solicitud')
    }

    mensaje.value = 'Se ha enviado un correo con las instrucciones para restablecer tu contraseña'
    email.value = ''
    
    // Redirigir al login después de 3 segundos
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (err) {
    console.error('Error:', err)
    error.value = err.message || 'Error al procesar la solicitud'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <Header />
  <div class="min-h-screen flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 class="text-3xl font-extrabold text-violet-700 text-center mb-8">Recuperar Contraseña</h2>
      
      <form @submit.prevent="enviarSolicitud" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input 
            id="email"
            v-model="email"
            type="email"
            class="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition duration-200"
            :class="{
              'border-gray-300': !email || emailValido,
              'border-red-500': email && !emailValido
            }"
            required
            placeholder="Ingresa tu email"
          >
          <p v-if="email && !emailValido" class="mt-1 text-sm text-red-600">
            Ingresa un email válido
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
          {{ cargando ? 'Enviando...' : 'Enviar Solicitud' }}
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