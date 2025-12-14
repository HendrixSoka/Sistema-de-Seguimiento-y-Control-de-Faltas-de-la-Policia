import api from './axiosInstance';

export async function crearDelito(data) {
  try {
    const token = localStorage.getItem('token');
    const response = await api.post('/delitos/', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear delito:', error);
    throw error;
  }
}

export async function obtenerDelitos({
  nombre_policia = "",
  unidad_policial = "",
  tipo_penal = "",
  page = 1,
  page_size = 20
} = {}) {
  try {
    const params = {};

    if (nombre_policia) params.nombre_policia = nombre_policia;
    if (unidad_policial) params.unidad_policial = unidad_policial;
    if (tipo_penal) params.tipo_penal = tipo_penal;

    params.page = page;
    params.page_size = page_size;

    const response = await api.get('/delitos/', { params });
    return response.data;

  } catch (error) {
    console.error("Error al obtener delitos:", error);
    throw error;
  }
}


export async function actualizarDelito(id_delito, datosDelito) {
  try {
    const token = localStorage.getItem('token');
    const response = await api.put(`/delitos/${id_delito}`, datosDelito, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar el delito ${id_delito}:`, error);
    throw error;
  }
}