<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { obtenerUsuario } from '@/utils/auth'
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'

const router = useRouter()
const usuario = ref(null)
const carrito = ref([])
const cargando = ref(true)
const error = ref('')
const mensaje = ref('')
const API_URL = 'https://laboratorio-dcw-production.up.railway.app/api'

// Computed properties para cálculos del carrito
const subtotal = computed(() => {
  return carrito.value.reduce((total, item) => total + (item.precio * item.cantidad), 0)
})

const impuestos = computed(() => {
  return subtotal.value * 0.12 // 12% de impuestos
})

const total = computed(() => {
  return subtotal.value + impuestos.value
})

// Función para formatear el precio
const formatearPrecio = (precio) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(precio)
}

// Función para actualizar la cantidad de un item
const actualizarCantidad = async (itemId, nuevaCantidad) => {
  if (nuevaCantidad < 1) return

  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No hay sesión activa')
    }

    const response = await fetch(`${API_URL}/cart/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        itemId,
        cantidad: nuevaCantidad
      })
    })

    if (!response.ok) {
      throw new Error('Error al actualizar la cantidad')
    }

    // Actualizar el carrito localmente
    const itemIndex = carrito.value.findIndex(item => item._id === itemId)
    if (itemIndex !== -1) {
      carrito.value[itemIndex].cantidad = nuevaCantidad
    }
  } catch (err) {
    console.error('Error:', err)
    error.value = err.message || 'Error al actualizar la cantidad'
  }
}

// Función para eliminar un item del carrito
const eliminarItem = async (itemId) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No hay sesión activa')
    }

    const response = await fetch(`${API_URL}/cart/remove`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ itemId })
    })

    if (!response.ok) {
      throw new Error('Error al eliminar el item')
    }

    // Actualizar el carrito localmente
    carrito.value = carrito.value.filter(item => item._id !== itemId)
    mensaje.value = 'Item eliminado del carrito'
    setTimeout(() => {
      mensaje.value = ''
    }, 3000)
  } catch (err) {
    console.error('Error:', err)
    error.value = err.message || 'Error al eliminar el item'
  }
}

// Función para vaciar el carrito
const vaciarCarrito = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No hay sesión activa')
    }

    const response = await fetch(`${API_URL}/cart/clear`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Error al vaciar el carrito')
    }

    carrito.value = []
    mensaje.value = 'Carrito vaciado correctamente'
    setTimeout(() => {
      mensaje.value = ''
    }, 3000)
  } catch (err) {
    console.error('Error:', err)
    error.value = err.message || 'Error al vaciar el carrito'
  }
}

// Función para proceder al checkout
const procederAlCheckout = () => {
  if (carrito.value.length === 0) {
    error.value = 'El carrito está vacío'
    return
  }
  router.push('/checkout')
}

// Función para cargar el carrito
const cargarCarrito = async () => {
  try {
    cargando.value = true
    error.value = ''
    
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No hay sesión activa')
    }

    const response = await fetch(`${API_URL}/cart`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Error al cargar el carrito')
    }

    const data = await response.json()
    carrito.value = data
  } catch (err) {
    console.error('Error:', err)
    error.value = err.message || 'Error al cargar el carrito'
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  usuario.value = obtenerUsuario()
  if (!usuario.value) {
    router.push('/login')
    return
  }
  await cargarCarrito()
})
</script>

<template>
  <Header />
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Carrito de Compras</h1>
        <p class="mt-2 text-sm text-gray-600">Revisa y gestiona los items en tu carrito</p>
      </div>

      <!-- Estado de carga y error -->
      <div v-if="cargando" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Cargando carrito...</p>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-600 bg-red-100 p-4 rounded-lg">
          {{ error }}
        </div>
      </div>

      <div v-else-if="carrito.length === 0" class="text-center py-12">
        <div class="text-6xl mb-6">🛒</div>
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">Tu carrito está vacío</h2>
        <p class="text-gray-600 mb-8">Agrega algunos servicios para comenzar</p>
        <router-link 
          to="/servicios"
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700"
        >
          Ver Servicios
        </router-link>
      </div>

      <div v-else class="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        <!-- Lista de items -->
        <div class="lg:col-span-7">
          <div class="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
            <div 
              v-for="item in carrito" 
              :key="item._id"
              class="p-6 flex items-center space-x-4"
            >
              <img 
                :src="`${API_URL.replace('/api', '')}${item.imagen}`"
                :alt="item.nombre"
                class="w-24 h-24 object-cover rounded-lg"
              >
              <div class="flex-1">
                <h3 class="text-lg font-medium text-gray-900">{{ item.nombre }}</h3>
                <p class="mt-1 text-sm text-gray-500">{{ item.descripcion }}</p>
                <div class="mt-4 flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <button 
                      @click="actualizarCantidad(item._id, item.cantidad - 1)"
                      class="text-gray-500 hover:text-gray-700"
                      :disabled="item.cantidad <= 1"
                    >
                      -
                    </button>
                    <span class="text-gray-900">{{ item.cantidad }}</span>
                    <button 
                      @click="actualizarCantidad(item._id, item.cantidad + 1)"
                      class="text-gray-500 hover:text-gray-700"
                    >
                      +
                    </button>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-medium text-gray-900">
                      {{ formatearPrecio(item.precio * item.cantidad) }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ formatearPrecio(item.precio) }} c/u
                    </p>
                  </div>
                </div>
              </div>
              <button 
                @click="eliminarItem(item._id)"
                class="text-gray-400 hover:text-red-500"
              >
                <span class="sr-only">Eliminar</span>
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <div class="mt-6">
            <button 
              @click="vaciarCarrito"
              class="text-sm text-red-600 hover:text-red-700"
            >
              Vaciar carrito
            </button>
          </div>
        </div>

        <!-- Resumen del pedido -->
        <div class="mt-8 lg:mt-0 lg:col-span-5">
          <div class="bg-white shadow-sm rounded-lg p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-6">Resumen del Pedido</h2>
            
            <div class="space-y-4">
              <div class="flex justify-between">
                <span class="text-gray-600">Subtotal</span>
                <span class="text-gray-900">{{ formatearPrecio(subtotal) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Impuestos (12%)</span>
                <span class="text-gray-900">{{ formatearPrecio(impuestos) }}</span>
              </div>
              <div class="border-t border-gray-200 pt-4">
                <div class="flex justify-between">
                  <span class="text-lg font-medium text-gray-900">Total</span>
                  <span class="text-lg font-medium text-gray-900">{{ formatearPrecio(total) }}</span>
                </div>
              </div>
            </div>

            <div class="mt-6">
              <button 
                @click="procederAlCheckout"
                class="w-full bg-violet-600 text-white py-3 px-4 rounded-lg hover:bg-violet-700 transition-colors duration-300"
              >
                Proceder al Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensaje de éxito -->
      <div 
        v-if="mensaje"
        class="fixed bottom-4 right-4 bg-green-100 text-green-700 px-4 py-2 rounded-lg shadow-lg"
      >
        {{ mensaje }}
      </div>
    </div>
  </div>
  <Footer />
</template> 