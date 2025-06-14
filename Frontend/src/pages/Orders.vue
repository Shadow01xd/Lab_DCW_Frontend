<template>
  <Header />
  <section class="min-h-screen pt-24 p-8 bg-gray-50">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold text-violet-700 mb-6 flex items-center gap-2">
        <span class="text-4xl">📦</span> Mis Compras
      </h1>

      <div v-if="cargando" class="flex justify-center items-center min-h-[400px]">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-500 text-xl mb-4">❌</div>
        <p class="text-red-500 text-lg">{{ error }}</p>
      </div>

      <div v-else-if="!ordersFiltrados || ordersFiltrados.length === 0" class="text-center py-16">
        <div class="text-6xl mb-6">🛍️</div>
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">No tienes compras aún</h2>
        <p class="text-gray-500 mb-8">¡Explora nuestros servicios y realiza tu primera compra!</p>
        <RouterLink to="/servicios"
          class="inline-block bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors duration-300 font-semibold">
          Ver Servicios
        </RouterLink>
      </div>

      <div v-else class="space-y-6">
        <div v-for="order in ordersFiltrados" :key="order._id" class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">Orden #{{ order._id.slice(-6) }}</h3>
              <p class="text-sm text-gray-500">
                {{ formatearFecha(order.fecha) }}
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div v-for="item in order.items" :key="item._id" class="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <img v-if="item.servicio.imagen" :src="'http://localhost:5000' + item.servicio.imagen"
                :alt="item.servicio.nombre" class="w-20 h-20 object-cover rounded-lg" />
              <div class="flex-grow">
                <h4 class="font-medium text-gray-800">{{ item.servicio.nombre }}</h4>
                <p class="text-sm text-gray-600">Cantidad: {{ item.cantidad }}</p>
                <div v-if="item.tecnologiasSeleccionadas && item.tecnologiasSeleccionadas.length" class="mt-2">
                  <p class="text-sm text-gray-600">Tecnologías:</p>
                  <div class="flex flex-wrap gap-2 mt-1">
                    <span v-for="tech in item.tecnologiasSeleccionadas" :key="tech._id"
                      class="text-xs bg-violet-100 text-violet-800 px-2 py-1 rounded-full">
                      {{ tech.name }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="text-right">
                <p class="font-medium text-gray-800">${{ item.precioUnitario * item.cantidad }}</p>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-gray-100">
            <div class="flex justify-between text-sm text-gray-600 mb-2">
              <span>Subtotal</span>
              <span>${{ order.subtotal }}</span>
            </div>
            <div class="flex justify-between text-sm text-gray-600 mb-2">
              <span>Impuestos (13%)</span>
              <span>${{ order.impuestos }}</span>
            </div>
            <div class="flex justify-between text-lg font-bold text-violet-800">
              <span>Total</span>
              <span>${{ order.total }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <Footer />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { obtenerUsuario } from '@/utils/auth'
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'

const router = useRouter()
const orders = ref([])
const cargando = ref(true)
const error = ref('')
const usuario = ref(null)

// Estados para el modal de detalles
const showModal = ref(false)
const selectedOrder = ref(null)

// Filtros y ordenamiento
const filtroEstado = ref('todos')
const ordenarPor = ref('fecha')
const ordenDescendente = ref(true)

// Computed properties para filtrado y ordenamiento
const ordersFiltrados = computed(() => {
  let resultado = [...orders.value]
  
  // Aplicar filtro por estado
  if (filtroEstado.value !== 'todos') {
    resultado = resultado.filter(order => order.estado === filtroEstado.value)
  }
  
  // Aplicar ordenamiento
  resultado.sort((a, b) => {
    let valorA, valorB
    
    switch (ordenarPor.value) {
      case 'fecha':
        valorA = new Date(a.fecha)
        valorB = new Date(b.fecha)
        break
      case 'total':
        valorA = a.total
        valorB = b.total
        break
      case 'estado':
        valorA = a.estado
        valorB = b.estado
        break
      default:
        valorA = a.fecha
        valorB = b.fecha
    }
    
    return ordenDescendente.value ? 
      (valorB > valorA ? 1 : -1) : 
      (valorA > valorB ? 1 : -1)
  })
  
  return resultado
})

// Función para formatear la fecha
const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Función para formatear el precio
const formatearPrecio = (precio) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(precio)
}

// Función para obtener el color del estado
const getEstadoColor = (estado) => {
  const colores = {
    'pendiente': 'bg-yellow-100 text-yellow-800',
    'procesando': 'bg-blue-100 text-blue-800',
    'completado': 'bg-green-100 text-green-800',
    'cancelado': 'bg-red-100 text-red-800'
  }
  return colores[estado] || 'bg-gray-100 text-gray-800'
}

// Función para abrir el modal de detalles
const verDetalles = (order) => {
  selectedOrder.value = order
  showModal.value = true
}

// Función para cerrar el modal
const cerrarModal = () => {
  showModal.value = false
  selectedOrder.value = null
}

// Función para cargar las órdenes
const cargarOrdenes = async () => {
  try {
    cargando.value = true
    error.value = ''
    
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No hay sesión activa')
    }

    const response = await fetch('https://laboratorio-dcw-production.up.railway.app/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Error al cargar las órdenes')
    }

    const data = await response.json()
    orders.value = data
  } catch (err) {
    console.error('Error:', err)
    error.value = err.message || 'Error al cargar las órdenes'
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
  await cargarOrdenes()
})
</script> 