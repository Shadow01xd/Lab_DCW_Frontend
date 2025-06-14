import { API_URL } from '../config/api';

// 🟢 Login de usuario
export const login = async (credentials) => {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  return res.json();
};

// 🟣 Registro: permite enviar rol y token opcional para crear admin
export const register = async (userData) => {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return res.json();
};

// 🔵 Obtener lista de servicios (sin autenticación)
export const getProducts = async () => {
  const res = await fetch(`${API_URL}/api/productos`);
  return res.json();
};
