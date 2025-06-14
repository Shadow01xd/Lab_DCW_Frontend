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
    <!-- Lista -->
    <div class="bg-gray-900 rounded-lg shadow-lg p-6 text-white">
      <h3 class="text-2xl font-bold mb-4">Servicios Existentes</h3>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-700">
          <thead class="bg-violet-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Imagen</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nombre</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Descripción</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Costo</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Categoría</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-gray-800 divide-y divide-gray-700">
            <tr v-for="s in serviciosPaginados" :key="s._id" class="hover:bg-violet-800 transition">
              <td class="px-6 py-4"><img :src="getImg(s.imagen)" class="h-12 w-12 object-cover rounded" /></td>
              <td class="px-6 py-4">{{ s.nombre }}</td>
              <td class="px-6 py-4">{{ s.descripcion }}</td>
              <td class="px-6 py-4 text-green-400">${{ s.costo }}</td>
              <td class="px-6 py-4 capitalize">{{ categorias.find(c => c.value === s.categoria)?.label || 'N/A' }}</td>
              <td class="px-6 py-4">
                <button @click="modoEdicion = s._id" class="text-violet-300 hover:text-white mr-3">Editar</button>
                <button @click="deleteService(s._id)" class="text-red-400 hover:text-red-200">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="totalPaginas > 1" class="mt-4 flex justify-center gap-2">
      <button @click="paginaActual--" :disabled="paginaActual === 1"
              class="px-3 py-1 rounded bg-violet-600 text-white disabled:opacity-40">Anterior</button>
      <span class="text-white">{{ paginaActual }} / {{ totalPaginas }}</span>
      <button @click="paginaActual++" :disabled="paginaActual === totalPaginas"
              class="px-3 py-1 rounded bg-violet-600 text-white disabled:opacity-40">Siguiente</button>
    </div>

    <!-- Botón para agregar -->
    <div v-if="!mostrarFormulario" class="flex justify-center mt-10">
      <button @click="mostrarFormulario = true"
        class="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-xl shadow">
        Crear Servicio
      </button>
    </div>

    <!-- Formulario -->
    <div v-if="mostrarFormulario" class="bg-gray-900 text-white p-6 rounded-lg shadow-xl max-w-2xl mx-auto animate-fade-in">
      <h3 class="text-2xl font-semibold mb-4">
        Crear nuevo Servicio
      </h3>

      <form @submit.prevent="createService" class="space-y-4">
        <div>
          <label class="block text-sm font-medium">Nombre</label>
          <input v-model="nuevoServicio.nombre" type="text" required
            class="mt-1 block w-full rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-violet-500 focus:border-violet-500">
        </div>

        <div>
          <label class="block text-sm font-medium">Descripción</label>
          <textarea v-model="nuevoServicio.descripcion" rows="3" required
            class="mt-1 block w-full rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-violet-500 focus:border-violet-500"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium">Costo</label>
          <input v-model="nuevoServicio.costo" type="number" required min="0" step="0.01"
            class="mt-1 block w-full rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-violet-500 focus:border-violet-500">
        </div>

        <div>
          <label class="block text-sm font-medium">Categoría</label>
          <select v-model="nuevoServicio.categoria" required
            class="mt-1 block w-full rounded-md bg-gray-800 text-white border border-gray-600 focus:ring-violet-500 focus:border-violet-500">
            <option v-for="cat in categorias" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium">Imagen</label>
          <input type="file" @change="handleImagen" accept="image/*"
            class="mt-1 block w-full text-white file:bg-violet-700 file:text-white file:rounded-md file:px-4 file:py-1" />
        </div>

        <div class="flex justify-end gap-4">
          <button type="submit" class="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2 rounded">
            Agregar
          </button>
          <button type="button" @click="mostrarFormulario = false"
            class="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-2 rounded">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  0% { opacity: 0; transform: translateY(16px); }
  100% { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
</style>



