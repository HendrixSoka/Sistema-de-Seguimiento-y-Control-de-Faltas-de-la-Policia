import api from "./axiosInstance";
export async function getLogs({ page = 1, limit = 30, id_usuario, tabla, accion }){
  try {
    const response = await api.get("/logs", {
      params: {
        page,
        limit,
        id_usuario,
        tabla,
        accion,
      },
    });

    return response.data; // lista de logs
  } catch (error) {
    console.error("Error obteniendo logs:", error);
    throw error;
  }
};
