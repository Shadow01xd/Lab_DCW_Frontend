<!-- src/pages/ServiciosAdmin.vue -->
<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { obtenerToken } from '@/utils/auth'

/* Props para refetch externo */
const props = defineProps({ refetch: { type: Number, default: 0 } })

/* Estado principal */
const servicios        = ref([])
const cargando         = ref(true)
const error            = ref('')
const modoEdicion      = ref(null)
const imagenPreview    = ref(null)
const mostrarFormulario= ref(false)

/* Nuevo servicio (form) */
const nuevoServicio = ref({
  nombre: '',
  descripcion: '',
  costo: '',
  categoria: '',
  imagen: null
})

/* Lista fija de categorías */
const categorias = [
  { value: 'pagina_web', label: 'Página Web' },
  { value: 'aplicacion', label: 'Aplicación' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'otros', label: 'Otros' }
]

/* ---------- Paginación ---------- */
const paginaActual = ref(1)
const porPagina    = 5

/* Filtra servicios que vengan completos (evita pantalla en blanco) */
const validServicios = computed(() =>
  servicios.value.filter(s => s && s.nombre && s.categoria)
)

const totalPaginas = computed(() =>
  Math.ceil(validServicios.value.length / porPagina) || 1
)
const serviciosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina
  return validServicios.value.slice(inicio, inicio + porPagina)
})

/* ---------- Fetch & CRUD ---------- */
async function fetchServices () {
  cargando.value = true
  try {
    const token = obtenerToken()
    const res   = await fetch(
      'https://laboratoriodcw-production.up.railway.app/api/servicios',
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) throw new Error('Error al obtener servicios')
    servicios.value = await res.json()
    if (paginaActual.value > totalPaginas.value) paginaActual.value = totalPaginas.value
    error.value = ''
  } catch (e) {
    console.error(e)
    error.value = 'Error al cargar servicios'
  } finally { cargando.value = false }
}
watch(() => props.refetch, fetchServices)

/* Helpers */
const getImg = p =>
  p ? `https://laboratoriodcw-production.up.railway.app${p}` : '/placeholder.png'

/* Crear servicio */
async function createService () {
  try {
    const { nombre, descripcion, costo, categoria, imagen } = nuevoServicio.value
    if (!nombre || !descripcion || !costo || !categoria) {
      error.value = 'Completa todos los campos'
      return
    }
    if (!imagen) {
      error.value = 'Selecciona una imagen'
      return
    }

    const fd = new FormData()
    fd.append('nombre', nombre)
    fd.append('descripcion', descripcion)
    fd.append('costo', costo)
    fd.append('categoria', categoria)
    fd.append('imagen', imagen)

    const token = obtenerToken()
    const res   = await fetch(
      'https://laboratoriodcw-production.up.railway.app/api/servicios',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }
    )
    if (!res.ok) throw new Error('Error al crear servicio')
    await fetchServices()
    resetForm(); mostrarFormulario.value = false
  } catch (e) {
    console.error(e); error.value = e.message || 'Error al crear servicio'
  }
}

/* Actualizar */
async function updateService (s) {
  try {
    const { nombre, descripcion, costo, categoria } = s
    if (!nombre || !descripcion || !costo || !categoria) {
      error.value = 'Completa todos los campos'
      return
    }

    const fd = new FormData()
    fd.append('nombre', nombre)
    fd.append('descripcion', descripcion)
    fd.append('costo', costo)
    fd.append('categoria', categoria)
    if (s.imagen instanceof File) fd.append('imagen', s.imagen)

    const token = obtenerToken()
    const res   = await fetch(
      `https://laboratoriodcw-production.up.railway.app/api/servicios/${s._id}`,
      { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd }
    )
    if (!res.ok) throw new Error('Error al actualizar servicio')
    await fetchServices()
    modoEdicion.value = null; error.value = ''
  } catch (e) {
    console.error(e); error.value = e.message || 'Error al actualizar servicio'
  }
}

/* Eliminar */
async function deleteService (id) {
  if (!confirm('¿Eliminar este servicio?')) return
  try {
    const token = obtenerToken()
    const res   = await fetch(
      `https://laboratoriodcw-production.up.railway.app/api/servicios/${id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) throw new Error('Error al eliminar')
    await fetchServices()
  } catch (e) { console.error(e); error.value = 'Error al eliminar servicio' }
}

/* Imagen nueva (form) */
function handleImagen (e) {
  const file = e.target.files[0]
  if (file) { nuevoServicio.value.imagen = file; imagenPreview.value = URL.createObjectURL(file) }
}

/* Reset form */
function resetForm () {
  nuevoServicio.value = { nombre:'', descripcion:'', costo:'', categoria:'', imagen:null }
  imagenPreview.value = null
}

onMounted(fetchServices)
</script>

<template>
  <div class="space-y-6">
    <!-- Tabla -->
    <div class="bg-gray-900 rounded-lg shadow-lg p-6 text-white">
      <h2 class="text-2xl font-bold mb-4">Servicios Existentes</h2>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-700">
          <thead class="bg-violet-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Imagen</th>
              <th class="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Nombre</th>
              <th class="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Descripción</th>
              <th class="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Costo</th>
              <th class="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Categoría</th>
              <th class="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-gray-800 divide-y divide-gray-700">
            <tr v-for="s in serviciosPaginados" :key="s._id" class="hover:bg-violet-800 transition">
              <td class="px-6 py-4"><img :src="getImg(s.imagen)" class="h-12 w-12 object-cover rounded" /></td>
              <td class="px-6 py-4">{{ s.nombre }}</td>
              <td class="px-6 py-4">{{ s.descripcion }}</td>
              <td class="px-6 py-4 text-green-400 font-semibold">${{ s.costo }}</td>
              <td class="px-6 py-4 capitalize">{{ categorias.find(c => c.value === s.categoria)?.label }}</td>
              <td class="px-6 py-4">
                <button @click="editarServicio(s)" class="text-violet-300 hover:text-white mr-3">Editar</button>
                <button @click="deleteService(s._id)" class="text-red-400 hover:text-red-200">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="totalPaginas > 1" class="flex justify-center gap-2 text-white">
      <button @click="paginaActual--" :disabled="paginaActual === 1"
        class="bg-violet-600 hover:bg-violet-700 text-white px-4 py-1 rounded disabled:opacity-40">Anterior</button>
      <span>{{ paginaActual }} / {{ totalPaginas }}</span>
      <button @click="paginaActual++" :disabled="paginaActual === totalPaginas"
        class="bg-violet-600 hover:bg-violet-700 text-white px-4 py-1 rounded disabled:opacity-40">Siguiente</button>
    </div>

    <!-- Botón Crear -->
    <div class="flex justify-center">
      <button @click="abrirModal()"
        class="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-xl shadow">
        Crear Servicio
      </button>
    </div>

    <!-- Modal Crear/Editar -->
    <div v-if="modalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="bg-gray-900 p-6 rounded-lg shadow-xl w-full max-w-xl animate-fade-in text-white relative">
        <h3 class="text-2xl font-semibold mb-4">{{ modoEdicion ? 'Editar Servicio' : 'Agregar Servicio' }}</h3>

        <form @submit.prevent="modoEdicion ? updateService() : createService()" class="space-y-4">
          <input v-model="form.nombre" placeholder="Nombre"
            class="input-dark" />
          <textarea v-model="form.descripcion" placeholder="Descripción"
            class="input-dark" />
          <input v-model="form.costo" type="number" placeholder="Costo"
            class="input-dark" />
          <select v-model="form.categoria" class="input-dark">
            <option disabled value="">— Selecciona —</option>
            <option v-for="c in categorias" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
          <input type="file" @change="handleImagen" accept="image/*"
            class="text-white file:bg-violet-700 file:text-white file:px-4 file:py-1 file:rounded-md" />

          <div class="flex justify-end gap-4 pt-2">
            <button type="submit" class="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2 rounded">
              {{ modoEdicion ? 'Actualizar' : 'Agregar' }}
            </button>
            <button type="button" @click="cerrarModal"
              class="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-2 rounded">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-dark {
  @apply w-full rounded-md bg-gray-800 text-white border border-gray-600 p-2 focus:ring-violet-500 focus:border-violet-500;
}
@keyframes fade-in {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}
</style>




