<template>
  <div
    class="bg-gray-50 p-8 rounded-lg text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer"
    @click="$emit('view-details', service)"
  >
    <img
      v-if="service.imagen"
      :src="getImageUrl(service.imagen)"
      :alt="service.nombre"
      class="mx-auto w-24 h-24 mb-4 object-cover rounded-full border border-gray-200 shadow-sm"
    />
    <h3 class="text-2xl mb-4 font-semibold text-violet-700">{{ service.nombre }}</h3>
    <button
      class="mt-4 bg-violet-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-violet-700 transition"
    >
      Ver más
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  service: { type: Object, required: true }
})

const emit = defineEmits(['view-details'])

// ✅ URL dinámica para producción
const API_URL = import.meta.env.VITE_API_URL

function getImageUrl(imagenPath) {
  if (!imagenPath) return ''
  return imagenPath.startsWith('http')
    ? imagenPath
    : `${API_URL}${imagenPath}`
}
</script>
