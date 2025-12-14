import api from './axiosInstance';

export async function obtenerFaltasGraves({
  nombre_policia = "",
  unidad_policial = "",
  tipificacion = "",
  page = 1,
  page_size = 20
} = {}) {
  try {
    const params = {};

    if (nombre_policia) params.nombre_policia = nombre_policia;
    if (unidad_policial) params.unidad_policial = unidad_policial;
    if (tipificacion) params.tipificacion = tipificacion;

    params.page = page;
    params.page_size = page_size;

    const response = await api.get("/faltas_graves/", { params });
    return response.data;

  } catch (error) {
    console.error("Error al obtener faltas graves:", error);
    throw error;
  }
}


export async function crearFaltaGrave(faltaGrave) {
  console.log('Datos de la falta Grave a crear:', faltaGrave);
  try {
    const token = localStorage.getItem('token');
    const response = await api.post('/faltas_graves/', faltaGrave, {
      headers: { 
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear falta Grave:', error);
    throw error;
  }
}

export async function actualizarFaltaGrave(id_falta_grave, datosActualizados) {
  console.log('Datos de la falta grave a actualizar:', datosActualizados);
  try {
    const token = localStorage.getItem('token');
    const response = await api.put(`/faltas_graves/${id_falta_grave}`, datosActualizados, {
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

export async function crearEtapa(datosEtapa) {
  console.log('Datos de la etapa a crear:', datosEtapa);
  try {
    const token = localStorage.getItem('token');
    const response = await api.post('/etapas/', datosEtapa, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear la etapa:', error);
    throw error;
  }
}

export async function modificarEtapa(id_etapa, datosActualizados) {
  console.log('Datos de la etapa a modificar:', datosActualizados);
  try {
    const token = localStorage.getItem('token');
    const response = await api.put(`/etapas/${id_etapa}`, datosActualizados, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error al modificar la etapa ${id_etapa}:`, error);
    throw error;
  }
}

export async function eliminarEtapa(id_etapa, id_usuario) {
  try {
    const token = localStorage.getItem("token");
    const response = await api.delete(`/etapas/${id_etapa}`, {
      params: { id_usuario },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar la etapa ${id_etapa}:`, error);
    throw error;
  }
}

export async function extenderEtapa(id_etapa, id_usuario) {
  try {
    const token = localStorage.getItem("token");
    const response = await api.patch(`/etapas/${id_etapa}/extender`, null, {
      params: { id_usuario },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error al extender la etapa ${id_etapa}:`, error);
    throw error;
  }
}
