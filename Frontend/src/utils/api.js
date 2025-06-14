const API_URL = 'https://laboratorio-dcw-production.up.railway.app/api' // Railway Production URL

// 🟢 Login de usuario
export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  return await res.json()
}

// 🟣 Registro: permite enviar rol y token opcional para crear admin
export async function register(nombre, email, password, rol = 'cliente', token = null) {
  const headers = {
    'Content-Type': 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ nombre, email, password, rol })
  })

  return await res.json()
}

// 🔵 Obtener lista de servicios (sin autenticación)
export async function getServicios() {
  const res = await fetch(`${API_URL}/productos`)
  return await res.json()
}

// 🟡 Función helper para peticiones autenticadas
export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Sesión expirada')
  }

  return await res.json()
}
