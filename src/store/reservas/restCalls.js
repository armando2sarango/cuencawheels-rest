import { makeRequest, HttpMethod } from '../../services/restCall';

// ============================================================
// 🔵 GET - Listar todas las reservas
// ============================================================
export async function getReservas() {
  try {
    const response = await makeRequest(HttpMethod.GET, '/reservas');
    if (!response.success) return [];
    const datos = response.data;
    if (Array.isArray(datos)) return datos;
    if (datos && Array.isArray(datos.Items)) return datos.Items;
    
    return []; 
  } catch (error) {
    return [];
  }
}
export async function getReservaByIdUsuario(idUsuario) {
  try {
    const response = await makeRequest(HttpMethod.GET, `/reservas/usuario/${idUsuario}`);
    if (!response.success) return []; 
    const datos = response.data;
    if (Array.isArray(datos)) return datos;
    if (datos && Array.isArray(datos.Items)) return datos.Items;

    return [];
  } catch (error) {
    return [];
  }
}
export async function getReservaById(id) {
  try {
    const response = await makeRequest(HttpMethod.GET, `/reservas/${id}`);
    if (!response.success) return null;
    return response.data;
  } catch (error) {
    throw error;
  }
}
export async function createReserva(body) {
  try {
    const response = await makeRequest(HttpMethod.POST, '/reservas', body);
    if (!response.success) {
      const mensajeError = response.error || 'Error al crear la reserva';
      throw new Error(mensajeError);
    }
    
    return response.data;
    
  } catch (error) {
    throw error;
  }
}
export async function updateReserva(id, body) {
  try {
    const response = await makeRequest(HttpMethod.PUT, `/reservas/${id}`, body);
    
    if (!response.success) {
      const mensajeError = response.error || 'Error al actualizar la reserva';
      throw new Error(mensajeError);
    }
    
    return response.data;
    
  } catch (error) {
    throw error;
  }
}
export async function updateEstado(idReserva, nuevoEstado, body = {}) {
  try {
    const response = await makeRequest(HttpMethod.PATCH, `/reservas/${idReserva}/estado/${nuevoEstado}`, body);
    
    if (!response.success) {
      const mensajeError = response.error || 'Error al cambiar el estado';
      throw new Error(mensajeError);
    }
    
    return response.data;
    
  } catch (error) {
    throw error;
  }
}
export async function deleteReserva(id) {
  try {
    const response = await makeRequest(HttpMethod.DELETE, `/reservas/${id}`);
    
    if (!response.success) {
      const mensajeError = response.error || 'Error al eliminar la reserva';
      throw new Error(mensajeError);
    }
    
    return response.success;
    
  } catch (error) {
    throw error;
  }
}