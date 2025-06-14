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
  <div class="space-y-6 text-white animate-fade-in">
    <!-- TABLA -->
    <div class="bg-gray-900 rounded-xl shadow-xl p-6 ring-1 ring-violet-800">
      <h2 class="text-2xl font-bold mb-4 text-violet-400">Servicios Existentes</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-700">
          <thead class="bg-violet-700 text-white">
            <tr>
              <th class="px-4 py-2 text-left text-sm font-semibold">Imagen</th>
              <th class="px-4 py-2 text-left text-sm font-semibold">Nombre</th>
              <th class="px-4 py-2 text-left text-sm font-semibold">Descripción</th>
              <th class="px-4 py-2 text-left text-sm font-semibold">Costo</th>
              <th class="px-4 py-2 text-left text-sm font-semibold">Categoría</th>
              <th class="px-4 py-2 text-center text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700 bg-gray-800">
            <tr v-for="s in serviciosPaginados" :key="s._id" class="hover:bg-violet-800 transition">
              <template v-if="modoEdicion === s._id">
                <td class="px-4 py-2"><input type="file" @change="e => (s.imagen = e.target.files[0])" /></td>
                <td class="px-4 py-2"><input v-model="s.nombre" class="input-dark" /></td>
                <td class="px-4 py-2"><textarea v-model="s.descripcion" class="input-dark" /></td>
                <td class="px-4 py-2"><input v-model="s.costo" type="number" class="input-dark" /></td>
                <td class="px-4 py-2">
                  <select v-model="s.categoria" class="input-dark">
                    <option value="" disabled>— Selecciona —</option>
                    <option v-for="c in categorias" :key="c.value" :value="c.value">{{ c.label }}</option>
                  </select>
                </td>
                <td class="px-4 py-2 text-center space-x-2">
                  <button @click="updateService(s)" class="btn-green">Guardar</button>
                  <button @click="modoEdicion = null" class="btn-gray">Cancelar</button>
                </td>
              </template>
              <template v-else>
                <td class="px-4 py-2"><img :src="getImg(s.imagen)" class="h-12 w-12 rounded object-cover" /></td>
                <td class="px-4 py-2">{{ s.nombre }}</td>
                <td class="px-4 py-2">{{ s.descripcion }}</td>
                <td class="px-4 py-2">${{ s.costo }}</td>
                <td class="px-4 py-2 capitalize">{{ categorias.find(c => c.value === s.categoria)?.label }}</td>
                <td class="px-4 py-2 text-center space-x-2">
                  <button @click="modoEdicion = s._id" class="text-violet-300 hover:text-white">Editar</button>
                  <button @click="deleteService(s._id)" class="text-red-400 hover:text-red-200">Eliminar</button>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="totalPaginas > 1" class="flex justify-center gap-4">
      <button @click="paginaActual--" :disabled="paginaActual === 1" class="btn-violet">Anterior</button>
      <span class="text-white">{{ paginaActual }} / {{ totalPaginas }}</span>
      <button @click="paginaActual++" :disabled="paginaActual === totalPaginas" class="btn-violet">Siguiente</button>
    </div>

    <!-- Botón Crear -->
    <div v-if="!mostrarFormulario" class="flex justify-center">
      <button @click="mostrarFormulario = true" class="btn-violet px-6 py-3">Agregar Servicio</button>
    </div>

    <!-- Formulario Crear -->
    <div v-if="mostrarFormulario" class="bg-gray-900 text-white p-6 rounded-lg shadow-xl max-w-2xl mx-auto animate-fade-in ring-1 ring-violet-700">
      <h3 class="text-2xl font-semibold mb-4">{{ nuevoServicio.nombre ? 'Editar' : 'Agregar nuevo' }} Servicio</h3>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="space-y-3">
          <input v-model="nuevoServicio.nombre" placeholder="Nombre" class="input-dark" />
          <textarea v-model="nuevoServicio.descripcion" placeholder="Descripción" class="input-dark" />
          <input v-model="nuevoServicio.costo" type="number" placeholder="Costo" class="input-dark" />
          <select v-model="nuevoServicio.categoria" class="input-dark">
            <option disabled value="">— Selecciona —</option>
            <option v-for="cat in categorias" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
          </select>
        </div>
        <div class="space-y-4">
          <div class="border border-dashed border-violet-400 rounded-lg p-4 text-center">
            <input id="img-svc" type="file" class="hidden" @change="handleImagen" />
            <label for="img-svc" class="cursor-pointer text-violet-400 hover:text-violet-200">
              {{ imagenPreview ? 'Cambiar imagen' : 'Seleccionar imagen' }}
            </label>
            <img v-if="imagenPreview" :src="imagenPreview" class="mt-3 h-40 mx-auto object-cover rounded shadow" />
          </div>
          <button @click="createService" class="btn-violet w-full">Crear</button>
          <button @click="mostrarFormulario = false" class="btn-gray w-full">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-dark {
  @apply block w-full rounded-md bg-gray-800 text-white border border-gray-600 p-2 focus:ring-violet-500 focus:border-violet-500;
}
.btn-violet {
  @apply px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-700 transition disabled:opacity-50;
}
.btn-gray {
  @apply px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition;
}
.btn-green {
  @apply px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition;
}
@keyframes fade-in {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}
</style>


