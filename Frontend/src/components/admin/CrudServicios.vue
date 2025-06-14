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
  <div class="space-y-8 bg-gray-50 p-6 rounded-xl shadow-md">

    <p v-if="error" class="text-center text-red-600 font-medium">{{ error }}</p>

    <!-- Tabla -->
    <div class="overflow-x-auto rounded-lg shadow ring-1 ring-gray-300 bg-white">
      <table
        v-if="!cargando && validServicios.length"
        class="w-full min-w-[800px] text-sm text-gray-700"
      >
        <thead class="bg-violet-600 text-white text-xs uppercase sticky top-0 z-10">
          <tr>
            <th class="p-3 text-left">Imagen</th>
            <th class="p-3 text-left">Nombre</th>
            <th class="p-3 text-left">Descripción</th>
            <th class="p-3 text-left">Costo</th>
            <th class="p-3 text-left">Categoría</th>
            <th class="p-3 text-center">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="s in serviciosPaginados"
            :key="s._id"
            class="border-b hover:bg-violet-50 transition"
          >
            <!-- Edición -->
            <template v-if="modoEdicion === s._id">
              <td class="p-2"><input type="file" @change="e => (s.imagen = e.target.files[0])" /></td>
              <td class="p-2"><input v-model="s.nombre" class="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400" /></td>
              <td class="p-2"><textarea v-model="s.descripcion" class="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400" /></td>
              <td class="p-2"><input v-model="s.costo" type="number" class="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400" /></td>
              <td class="p-2">
                <select v-model="s.categoria" class="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="" disabled>— Selecciona —</option>
                  <option v-for="c in categorias" :key="c.value" :value="c.value">{{ c.label }}</option>
                </select>
              </td>
              <td class="p-2 text-center space-x-2">
                <button @click="updateService(s)" class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Guardar</button>
                <button @click="modoEdicion = null" class="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500">Cancelar</button>
              </td>
            </template>

            <!-- Vista normal -->
            <template v-else>
              <td class="p-2">
                <img :src="getImg(s.imagen)" class="h-16 w-16 rounded object-cover shadow-sm" />
              </td>
              <td class="p-2 font-medium">{{ s.nombre }}</td>
              <td class="p-2">{{ s.descripcion }}</td>
              <td class="p-2 font-semibold text-green-700">${{ s.costo }}</td>
              <td class="p-2 capitalize">{{ categorias.find(c => c.value === s.categoria)?.label || 'Sin categoría' }}</td>
              <td class="p-2 text-center space-x-2">
                <button @click="modoEdicion = s._id" class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Editar</button>
                <button @click="deleteService(s._id)" class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Eliminar</button>
              </td>
            </template>
          </tr>
        </tbody>
      </table>

      <!-- Sin servicios -->
      <div v-else-if="!cargando && !validServicios.length" class="py-12 text-center text-gray-500 text-lg">
        No hay servicios registrados.
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="totalPaginas > 1" class="flex justify-center items-center gap-3 mt-4">
      <button @click="paginaActual--" :disabled="paginaActual === 1"
              class="rounded px-4 py-1 bg-violet-600 text-white disabled:opacity-50 hover:bg-violet-700">
        Anterior
      </button>
      <span class="font-medium text-violet-800">{{ paginaActual }} / {{ totalPaginas }}</span>
      <button @click="paginaActual++" :disabled="paginaActual === totalPaginas"
              class="rounded px-4 py-1 bg-violet-600 text-white disabled:opacity-50 hover:bg-violet-700">
        Siguiente
      </button>
    </div>

    <!-- Botón Crear -->
    <div v-if="!mostrarFormulario" class="text-center">
      <button @click="mostrarFormulario = true"
              class="rounded-xl bg-violet-600 px-6 py-3 text-white font-semibold shadow hover:bg-violet-700">
        Crear Servicio
      </button>
    </div>

    <!-- Formulario Crear -->
    <div v-else class="rounded-xl bg-white p-6 shadow-xl border border-gray-200">
      <h3 class="mb-4 text-xl font-bold text-violet-700">Crear nuevo servicio</h3>
      <div class="grid gap-6 md:grid-cols-2">
        <div class="space-y-4">
          <input v-model="nuevoServicio.nombre" placeholder="Nombre"
                 class="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          <textarea v-model="nuevoServicio.descripcion" placeholder="Descripción"
                    class="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          <input v-model="nuevoServicio.costo" type="number" placeholder="Costo"
                 class="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-violet-400" />
          <select v-model="nuevoServicio.categoria"
                  class="w-full rounded border p-2 focus:outline-none focus:ring-2 focus:ring-violet-400">
            <option value="" disabled>— Selecciona —</option>
            <option v-for="c in categorias" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>
        <div class="space-y-4">
          <div class="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
            <input id="img-input" type="file" @change="handleImagen" accept="image/*" class="hidden" />
            <label for="img-input" class="cursor-pointer text-violet-600 hover:text-violet-800 font-medium">
              {{ imagenPreview ? 'Cambiar imagen' : 'Seleccionar imagen' }}
            </label>
            <img v-if="imagenPreview" :src="imagenPreview" class="mx-auto mt-2 max-h-48 rounded shadow-md" />
          </div>
          <button @click="createService"
                  class="w-full rounded bg-violet-600 py-2 font-semibold text-white hover:bg-violet-700">
            Crear
          </button>
          <button @click="mostrarFormulario = false"
                  class="w-full rounded bg-gray-300 py-2 font-semibold text-gray-800 hover:bg-gray-400">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

