import api from './axiosInstance';

export async function getConteoPorPolicia({ nombre = "", page = 1, size = 10 ,fecha_inicio, fecha_fin} = {}) {
  try {
    const params = {};

    if (nombre && nombre.trim() !== "") params.nombre = nombre;
    if (page) params.page = page;
    if (size) params.size = size;
    if (fecha_inicio) params.fecha_inicio = fecha_inicio;
    if (fecha_fin) params.fecha_fin = fecha_fin;

    const response = await api.get('/conteo-por-policia', { params });

    return response.data; 
  } catch (error) {
    console.error('Error al obtener conteo por policía:', error);
    throw error;
  }
}


export async function getPorcentajeSancionesFaltaLeve() {
  try {
    const response = await api.get('/porcentaje-sanciones-faltaleve');
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener porcentaje de sanciones:', error);
    throw error;
  }
}
export async function getRankingDelitos() {
  try {
    const response = await api.get('/ranking-delitos');
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener ranking de delitos:', error);
    throw error;
  }
}
export async function getEtapaContar() {
  try {
    const response = await api.get('/etapa_contar/');
    return response.data;  // tu endpoint ya devuelve la lista directamente
  } catch (error) {
    console.error('Error al obtener conteo por etapa:', error);
    throw error;
  }
}
