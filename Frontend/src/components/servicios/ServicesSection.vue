<script setup>
import { ref, computed, onMounted } from 'vue'
import icon1 from '@/assets/icon/diseño web.png'
import icon2 from '@/assets/icon/Desarrollo a medida.png'
import icon3 from '@/assets/icon/Optimizacion SEO.png'
import icon4 from '@/assets/icon/mantenimiento.png'
import icon5 from '@/assets/icon/marketing_digital.png'
import icon6 from '@/assets/icon/e-commerce.png'
import ServiceCardAuthenticated from './ServiceCardAuthenticated.vue'
import ServiceDetailModal from './ServiceDetailModal.vue'

const API_URL = import.meta.env.VITE_API_URL

function obtenerToken() {
  return localStorage.getItem('token')
}

const filtro = ref('')
const serviciosDB = ref([])
const cargando = ref(false)
const error = ref('')
const successMessage = ref('')
const errorMessage = ref('')
const showModal = ref(false)
const selectedService = ref(null)

const serviciosEstaticos = [
  { id: 1, titulo: 'Diseño Web', descripcion: 'Diseñamos sitios web modernos y funcionales...', icono: icon1 },
  { id: 2, titulo: 'Desarrollo a Medida', descripcion: 'Construimos soluciones personalizadas...', icono: icon2 },
  { id: 3, titulo: 'Optimización SEO', descripcion: 'Mejoramos la visibilidad de tu sitio...', icono: icon3 },
  { id: 4, titulo: 'Mantenimiento', descripcion: 'Brindamos soporte continuo...', icono: icon4 },
  { id: 5, titulo: 'Marketing Digital', descripcion: 'Implementamos estrategias avanzadas...', icono: icon5 },
  { id: 6, titulo: 'E-commerce', descripcion: 'Desarrollamos plataformas de comercio...', icono: icon6 }
]

const estaAutenticado = computed(() => !!obtenerToken())

const serviciosFiltrados = computed(() => {
  if (estaAutenticado.value) {
    return serviciosDB.value.filter(s => s.nombre.toLowerCase().includes(filtro.value.toLowerCase()))
  } else {
    return serviciosEstaticos.filter(s => s.titulo.toLowerCase().includes(filtro.value.toLowerCase()))
  }
})

const openModal = (service) => {
  selectedService.value = service
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedService.value = null
}

const addToCart = async (serviceData) => {
  try {
    successMessage.value = ''
    errorMessage.value = ''
    const token = obtenerToken()
    if (!token) {
      errorMessage.value = 'Debes iniciar sesión para agregar productos al carrito.'
      return
    }

    const { _id: servicioId, tecnologiasSeleccionadas, precioTotal } = serviceData

    const response = await fetch(`${API_URL}/carrito`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        servicioId,
        cantidad: 1,
        tecnologiasSeleccionadas,
        precioTotal
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Error al agregar al carrito')
    }

    const data = await response.json()
    successMessage.value = data.message || 'Servicio agregado al carrito con éxito!'

    const cartStore = await import('@/utils/cartStore')
    cartStore.fetchCartData()
    closeModal()

    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (error) {
    errorMessage.value = error.message
    console.error('Error al agregar al carrito:', error)
    setTimeout(() => { errorMessage.value = '' }, 5000)
  }
}

const fetchServices = async () => {
  try {
    cargando.value = true
    const token = obtenerToken()
    if (!token) {
      error.value = 'No estás autenticado para ver los servicios de la base de datos.'
      return
    }
    const response = await fetch(`${API_URL}/servicios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('Error al obtener servicios')
    serviciosDB.value = await response.json()
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  if (estaAutenticado.value) fetchServices()
})
</script>


<template>
  <section id="servicios" class="py-24 bg-white">
    <div class="max-w-7xl mx-auto px-4">
      <h2 class="text-4xl text-center text-violet-600 mb-12 font-bold">Nuestros Servicios</h2>
      <p class="text-center text-gray-700 mb-12">En Novaweb Designers, nos especializamos en crear soluciones innovadoras que se adaptan a cada cliente.</p>

      <div v-if="cargando" class="text-center text-violet-600">Cargando servicios...</div>
      <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>

      <!-- Mensajes de éxito/error -->
      <div v-if="successMessage" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
        <span class="block sm:inline">{{ successMessage }}</span>
      </div>
      <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <span class="block sm:inline">{{ errorMessage }}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Si autenticado, mostrar ServiceCardAuthenticated -->
        <template v-if="estaAutenticado">
          <ServiceCardAuthenticated
            v-for="servicio in serviciosFiltrados"
            :key="servicio._id"
            :service="servicio"
            @view-details="openModal" />
        </template>

        <!-- Si NO autenticado, mostrar servicios estáticos -->
        <template v-else>
          <div
            v-for="servicio in serviciosFiltrados"
            :key="servicio.id"
            class="bg-gray-50 p-8 rounded-lg text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
            <img
              :src="servicio.icono"
              :alt="servicio.titulo"
              class="mx-auto w-16 h-16 mb-4" />
            <h3 class="text-2xl mb-4">{{ servicio.titulo }}</h3>
            <p>{{ servicio.descripcion }}</p>
          </div>
        </template>
      </div>
    </div>
  </section>

  <!-- Modal de detalles del servicio -->
  <ServiceDetailModal
    :show="showModal"
    :service="selectedService"
    @close="closeModal"
    @add-to-cart="addToCart" />
</template>