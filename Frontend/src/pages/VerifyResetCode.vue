<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'

const router = useRouter()
const route = useRoute()
const codigo = ref('')
const mensaje = ref('')
const error = ref('')
const cargando = ref(false)
const email = ref('')

// Validación del código
const codigoValido = computed(() => {
  return codigo.value.length === 6 && /^\d+$/.test(codigo.value)
})

const formularioValido = computed(() => {
  return codigoValido.value
})

const validarFormulario = () => {
  if (!codigoValido.value) {
    error.value = 'El código debe ser de 6 dígitos'
    return false
  }
  return true
}

const verificarCodigo = async () => {
  if (!validarFormulario()) return

  try {
    cargando.value = true
    error.value = ''
    mensaje.value = ''

    const response = await fetch('https://laboratorio-dcw-production.up.railway.app/api/auth/verify-reset-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value,
        code: codigo.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al verificar el código')
    }

    mensaje.value = 'Código verificado correctamente'
    
    // Redirigir a la página de restablecimiento de contraseña
    setTimeout(() => {
      router.push({
        path: '/reset-password',
        query: { token: data.token }
      })
    }, 1500)
  } catch (err) {
    console.error('Error:', err)
    error.value = err.message || 'Error al verificar el código'
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  email.value = route.query.email
  if (!email.value) {
    error.value = 'Email no proporcionado'
    setTimeout(() => {
      router.push('/forgot-password')
    }, 2000)
  }
})
</script>

<template>
  <Header />
  <div class="min-h-screen flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 class="text-3xl font-extrabold text-violet-700 text-center mb-8">Verificar Código</h2>
      
      <form @submit.prevent="verificarCodigo" class="space-y-6">
        <div>
          <label for="codigo" class="block text-sm font-medium text-gray-700 mb-2">Código de Verificación</label>
          <input 
            id="codigo"
            v-model="codigo"
            type="text"
            maxlength="6"
            class="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition duration-200 text-center text-2xl tracking-widest"
            :class="{
              'border-gray-300': !codigo || codigoValido,
              'border-red-500': codigo && !codigoValido
            }"
            required
            placeholder="000000"
            pattern="\d*"
            inputmode="numeric"
          >
          <p v-if="codigo && !codigoValido" class="mt-1 text-sm text-red-600">
            El código debe ser de 6 dígitos
          </p>
          <p class="mt-2 text-sm text-gray-600">
            Ingresa el código de 6 dígitos que enviamos a tu correo electrónico
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
          {{ cargando ? 'Verificando...' : 'Verificar Código' }}
        </button>

        <div class="text-center space-y-4">
          <p class="text-sm text-gray-600">
            ¿No recibiste el código?
            <button 
              type="button"
              class="text-violet-600 hover:text-violet-700 font-medium"
              @click="router.push('/forgot-password')"
            >
              Solicitar uno nuevo
            </button>
          </p>
          <router-link 
            to="/login" 
            class="text-violet-600 hover:text-violet-700 font-medium block"
          >
            Volver al inicio de sesión
          </router-link>
        </div>
      </form>
    </div>
  </div>
  <Footer />
</template> 