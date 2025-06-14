const API_URL = import.meta.env.VITE_API_URL // <-- Debe terminar en /api

// 🟢 Login de usuario
export async function login(email, password) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[❌] Error en login:', res.status, text)
      throw new Error(`Error ${res.status}: ${text}`)
    }

    return await res.json()
  } catch (err) {
    console.error('[❌] Error inesperado en login:', err.message)
    throw err
  }
}

// 🟣 Registro: permite enviar rol y token opcional para crear admin
export async function register(nombre, email, password, rol = 'cliente', token = null) {
  const headers = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ nombre, email, password, rol })
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[❌] Error en registro:', res.status, text)
      throw new Error(`Error ${res.status}: ${text}`)
    }

    return await res.json()
  } catch (err) {
    console.error('[❌] Error inesperado en registro:', err.message)
    throw err
  }
}

// 🔵 Obtener lista de servicios (sin autenticación)
export async function getServicios() {
  try {
    const res = await fetch(`${API_URL}/productos`)
    if (!res.ok) {
      const text = await res.text()
      console.error('[❌] Error al obtener servicios:', res.status, text)
      throw new Error(`Error ${res.status}: ${text}`)
    }
    return await res.json()
  } catch (err) {
    console.error('[❌] Error inesperado al obtener servicios:', err.message)
    throw err
  }
}
