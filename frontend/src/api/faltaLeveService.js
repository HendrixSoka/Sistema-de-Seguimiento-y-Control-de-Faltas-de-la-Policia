import api from './axiosInstance';

export async function obtenerFaltasLeves({
  unidad_policial = "",
  nombre_policia = "",
  page = 1,
  page_size = 20
} = {}) {
  try {
    const params = {};

    if (unidad_policial) params.unidad_policial = unidad_policial;
    if (nombre_policia) params.nombre_policia = nombre_policia;

    params.page = page;
    params.page_size = page_size;

    const response = await api.get("/faltas_leves/", { params });
    return response.data;

  } catch (error) {
    console.error("Error al obtener faltas leves:", error);
    throw error;
  }
}


export async function crearFaltaLeve(faltaLeve) {
  console.log('Datos de la falta leve a crear:', faltaLeve);
  try {
    const token = localStorage.getItem('token');
    const response = await api.post('/faltas_leves/', faltaLeve, {
      headers: { 
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear falta leve:', error);
    throw error;
  }
}

export async function actualizarFaltaLeve(id_falta_leve, datosActualizados) {
  console.log('Datos de la falta leve a actualizar:', datosActualizados);
  try {
    const token = localStorage.getItem('token');
    const response = await api.put(`/faltas_leves/${id_falta_leve}`, datosActualizados, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar la falta leve ${id_falta_leve}:`, error);
    throw error;
  }
}