import api from './axiosInstance';
import { jwtDecode } from 'jwt-decode';

export async function obtenerUsuarios() {
  try {
    const token = localStorage.getItem('token');
    const res = await api.get('/usuarios',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  }catch (err) {
    console.error('Error al obtener usuarios:', err);
    throw err;
  }
}

export async function registrarUsuario(datos) {
  try{
    const token = localStorage.getItem('token');
    const res = await api.post('/usuarios/', datos,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  }catch (err) {
    console.error('Error al registrar usuario:', err);
    throw err;
  }
}

export async function actualizarUsuario(id, datos) {
  try {
    const token = localStorage.getItem('token');
    const res = await api.put(`/usuarios/${id}`, datos,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error(`Error al actualizar usuario ${id}:`, err);
    throw err;
  }
}

export async function eliminarUsuario(id) {
  try {
    const token = localStorage.getItem('token');
    const res = await api.delete(`/usuarios/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error(`Error al eliminar usuario ${id}:`, err);
    throw err;
  }
}

export async function loginUser(username, secret_name) {
  try {
    const response = await api.post('/login/', {
      username: username,
      secret_name: secret_name
    });

    const { access_token } = response.data;

    if (access_token) {
      localStorage.setItem('token', access_token);
    }

    return response.data;
  } catch (error) {
    console.error("Error al iniciar sesión:", error.response?.data || error.message);
    localStorage.removeItem('token');
    throw error;
  }
}


export function getUserDataFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    const isExpired = decoded.exp * 1000 < Date.now();

    if (isExpired) {
      console.warn("Token expirado");
      localStorage.removeItem("token");
      return null;
    }

    return {
      id: decoded.sub,
      rol: decoded.rol,
      nombre: decoded.nombre,
      cargo: decoded.cargo
    };
  } catch (err) {
    console.error('Token inválido', err);
    localStorage.removeItem("token");
    return null;
  }
}