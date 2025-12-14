import api from './axiosInstance';

export async function crearPolicia(data) {
  const token = localStorage.getItem('token');

  const response = await api.post('/policias/', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function obtenerPolicias(nombre = null, limit = 50) {
  const params = {};

  if (nombre) params.nombre = nombre;
  if (limit) params.limit = limit;

  const response = await api.get('/policias/', { params });
  return response.data;
}


export async function actualizarPolicia(id_policia, data) {
  try {
    const token = localStorage.getItem('token');
    const response = await api.put(`/policias/${id_policia}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar el policía ${id_policia}:`, error);
    throw error;
  }
}