<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { obtenerUsuario } from '@/utils/auth'
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'

const router = useRouter()
const usuario = ref(null)
const cargando = ref(true)
const error = ref('')

// Estados para las diferentes secciones
const activeTab = ref('dashboard')
const orders = ref([])
const users = ref([])
const services = ref([])

// Estados para el modal de detalles
const showModal = ref(false)
const selectedItem = ref(null)
const modalType = ref('')

// Filtros y ordenamiento
const filtroEstado = ref('todos')
const ordenarPor = ref('fecha')
const ordenDescendente = ref(true)

// Computed properties para estadísticas
const estadisticas = computed(() => ({
  totalOrdenes: orders.value.length,
  ordenesPendientes: orders.value.filter(o => o.estado === 'pendiente').length,
  ordenesCompletadas: orders.value.filter(o => o.estado === 'completado').length,
  totalUsuarios: users.value.length,
  totalServicios: services.value.length,
  ingresosTotales: orders.value.reduce((sum, order) => sum + order.total, 0)
}))

// Computed properties para filtrado y ordenamiento
const ordersFiltrados = computed(() => {
  let resultado = [...orders.value]
  
  if (filtroEstado.value !== 'todos') {
    resultado = resultado.filter(order => order.estado === filtroEstado.value)
  }
  
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

// Funciones de utilidad
const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatearPrecio = (precio) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(precio)
}

const getEstadoColor = (estado) => {
  const colores = {
    'pendiente': 'bg-yellow-100 text-yellow-800',
    'procesando': 'bg-blue-100 text-blue-800',
    'completado': 'bg-green-100 text-green-800',
    'cancelado': 'bg-red-100 text-red-800'
  }
  return colores[estado] || 'bg-gray-100 text-gray-800'
}

// Funciones para el modal
const verDetalles = (item, type) => {
  selectedItem.value = item
  modalType.value = type
  showModal.value = true
}

const cerrarModal = () => {
  showModal.value = false
  selectedItem.value = null
  modalType.value = ''
}

// Funciones para cargar datos
const cargarDatos = async () => {
  try {
    cargando.value = true
    error.value = ''
    
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No hay sesión activa')
    }

    // Cargar órdenes
    const ordersResponse = await fetch('https://laboratorio-dcw-production.up.railway.app/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!ordersResponse.ok) throw new Error('Error al cargar órdenes')
    orders.value = await ordersResponse.json()

    // Cargar usuarios
    const usersResponse = await fetch('https://laboratorio-dcw-production.up.railway.app/api/usuarios', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!usersResponse.ok) throw new Error('Error al cargar usuarios')
    users.value = await usersResponse.json()

    // Cargar servicios
    const servicesResponse = await fetch('https://laboratorio-dcw-production.up.railway.app/api/servicios', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!servicesResponse.ok) throw new Error('Error al cargar servicios')
    services.value = await servicesResponse.json()

  } catch (err) {
    console.error('Error:', err)
    error.value = err.message || 'Error al cargar los datos'
  } finally {
    cargando.value = false
  }
}

// Función para actualizar el estado de una orden
const actualizarEstadoOrden = async (orderId, nuevoEstado) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`https://laboratorio-dcw-production.up.railway.app/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado: nuevoEstado })
    })

    if (!response.ok) throw new Error('Error al actualizar el estado')

    // Actualizar la orden localmente
    const orderIndex = orders.value.findIndex(o => o._id === orderId)
    if (orderIndex !== -1) {
      orders.value[orderIndex].estado = nuevoEstado
    }
  } catch (err) {
    console.error('Error:', err)
    error.value = err.message || 'Error al actualizar el estado'
  }
}

onMounted(async () => {
  usuario.value = obtenerUsuario()
  if (!usuario.value || usuario.value.rol !== 'admin') {
    router.push('/login')
    return
}
  await cargarDatos()
})
</script>

<template>
  <Header />
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Título y pestañas -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <div class="mt-4 border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button 
              v-for="tab in ['dashboard', 'orders', 'users', 'services']" 
              :key="tab"
              @click="activeTab = tab"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm',
                activeTab === tab
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Estado de carga y error -->
      <div v-if="cargando" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Cargando datos...</p>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-600 bg-red-100 p-4 rounded-lg">
          {{ error }}
        </div>
      </div>

      <!-- Contenido de las pestañas -->
      <div v-else>
        <!-- Dashboard -->
        <div v-if="activeTab === 'dashboard'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900">Órdenes</h3>
            <div class="mt-4 space-y-4">
              <div class="flex justify-between">
                <span class="text-gray-500">Total</span>
                <span class="font-medium">{{ estadisticas.totalOrdenes }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Pendientes</span>
                <span class="font-medium">{{ estadisticas.ordenesPendientes }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Completadas</span>
                <span class="font-medium">{{ estadisticas.ordenesCompletadas }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900">Usuarios</h3>
            <div class="mt-4">
              <div class="flex justify-between">
                <span class="text-gray-500">Total</span>
                <span class="font-medium">{{ estadisticas.totalUsuarios }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900">Servicios</h3>
            <div class="mt-4">
              <div class="flex justify-between">
                <span class="text-gray-500">Total</span>
                <span class="font-medium">{{ estadisticas.totalServicios }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6 col-span-full">
            <h3 class="text-lg font-medium text-gray-900">Ingresos</h3>
            <div class="mt-4">
              <div class="flex justify-between">
                <span class="text-gray-500">Total</span>
                <span class="font-medium">{{ formatearPrecio(estadisticas.ingresosTotales) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Órdenes -->
        <div v-if="activeTab === 'orders'" class="space-y-6">
          <div class="flex flex-wrap gap-4 items-center">
            <select 
              v-model="filtroEstado"
              class="rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="procesando">Procesando</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <select 
              v-model="ordenarPor"
              class="rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
            >
              <option value="fecha">Fecha</option>
              <option value="total">Total</option>
              <option value="estado">Estado</option>
            </select>

            <button 
              @click="ordenDescendente = !ordenDescendente"
              class="text-sm text-violet-600 hover:text-violet-700"
            >
              {{ ordenDescendente ? '↓ Descendente' : '↑ Ascendente' }}
            </button>
          </div>

          <div class="bg-white shadow rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="order in ordersFiltrados" :key="order._id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{{ order._id.slice(-6) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatearFecha(order.fecha) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      :class="[
                        'px-2 py-1 text-xs font-medium rounded-full',
                        getEstadoColor(order.estado)
                      ]"
                    >
                      {{ order.estado }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatearPrecio(order.total) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      @click="verDetalles(order, 'order')"
                      class="text-violet-600 hover:text-violet-900"
                    >
                      Ver detalles
                    </button>
                    <select 
                      v-model="order.estado"
                      @change="actualizarEstadoOrden(order._id, order.estado)"
                      class="text-sm border-gray-300 rounded-md"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="procesando">Procesando</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Usuarios -->
        <div v-if="activeTab === 'users'" class="bg-white shadow rounded-lg overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in users" :key="user._id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ user.nombre }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ user.email }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ user.rol }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    @click="verDetalles(user, 'user')"
                    class="text-violet-600 hover:text-violet-900"
                  >
                    Ver detalles
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Servicios -->
        <div v-if="activeTab === 'services'" class="bg-white shadow rounded-lg overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="service in services" :key="service._id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ service.nombre }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatearPrecio(service.precio) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    @click="verDetalles(service, 'service')"
                    class="text-violet-600 hover:text-violet-900"
                  >
                    Ver detalles
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de detalles -->
  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-start mb-6">
          <h3 class="text-xl font-semibold text-gray-900">
            {{ modalType === 'order' ? 'Detalles de la Orden' : 
               modalType === 'user' ? 'Detalles del Usuario' : 
               'Detalles del Servicio' }}
            </h3>
          <button 
            @click="cerrarModal"
            class="text-gray-400 hover:text-gray-500"
          >
            <span class="sr-only">Cerrar</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Contenido del modal según el tipo -->
        <div v-if="modalType === 'order' && selectedItem" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-gray-500">ID</p>
              <p class="mt-1">{{ selectedItem._id }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Fecha</p>
              <p class="mt-1">{{ formatearFecha(selectedItem.fecha) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Estado</p>
              <p class="mt-1">
                <span :class="['px-2 py-1 rounded-full text-sm font-medium', getEstadoColor(selectedItem.estado)]">
                  {{ selectedItem.estado }}
                </span>
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Total</p>
              <p class="mt-1 text-lg font-semibold">{{ formatearPrecio(selectedItem.total) }}</p>
            </div>
            </div>

          <div>
            <h4 class="text-lg font-medium text-gray-900 mb-4">Items</h4>
            <div class="space-y-4">
              <div 
                v-for="item in selectedItem.items" 
                :key="item._id"
                class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <img 
                  :src="`https://laboratorio-dcw-production.up.railway.app${item.imagen}`"
                  :alt="item.nombre"
                  class="w-16 h-16 object-cover rounded"
                >
                <div class="flex-1">
                  <h5 class="font-medium text-gray-900">{{ item.nombre }}</h5>
                  <p class="text-sm text-gray-600">Cantidad: {{ item.cantidad }}</p>
                </div>
                <div class="text-right">
                  <p class="font-medium text-gray-900">
                    {{ formatearPrecio(item.precio * item.cantidad) }}
                  </p>
                  <p class="text-sm text-gray-600">
                    {{ formatearPrecio(item.precio) }} c/u
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="modalType === 'user' && selectedItem" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-gray-500">Nombre</p>
              <p class="mt-1">{{ selectedItem.nombre }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Email</p>
              <p class="mt-1">{{ selectedItem.email }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Rol</p>
              <p class="mt-1">{{ selectedItem.rol }}</p>
            </div>
          </div>
        </div>

        <div v-else-if="modalType === 'service' && selectedItem" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-gray-500">Nombre</p>
              <p class="mt-1">{{ selectedItem.nombre }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Precio</p>
              <p class="mt-1">{{ formatearPrecio(selectedItem.precio) }}</p>
            </div>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Descripción</p>
            <p class="mt-1">{{ selectedItem.descripcion }}</p>
          </div>
          <div v-if="selectedItem.imagen">
            <p class="text-sm font-medium text-gray-500 mb-2">Imagen</p>
            <img 
              :src="`https://laboratorio-dcw-production.up.railway.app${selectedItem.imagen}`"
              :alt="selectedItem.nombre"
              class="w-full h-48 object-cover rounded-lg"
            >
          </div>
        </div>
      </div>
    </div>
  </div>

  <Footer />
</template>
