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

// ============================================================
// 🔵 GET - Listar reservas por usuario
// ============================================================
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

// ============================================================
// 🔍 GET - Obtener una reserva por ID
// ============================================================
export async function getReservaById(id) {
  try {
    const response = await makeRequest(HttpMethod.GET, `/reservas/${id}`);
    if (!response.success) return null;
    return response.data;
  } catch (error) {
    throw error;
  }
}

// ============================================================
// 🟢 POST - Crear nueva reserva
// ============================================================
export async function createReserva(body) {
  try {
    const response = await makeRequest(HttpMethod.POST, '/reservas', body);
    
    console.log('📥 Respuesta de makeRequest:', response);
    
    // ✅ SI NO ES EXITOSO, LANZAMOS ERROR CON EL MENSAJE DEL BACKEND
    if (!response.success) {
      // makeRequest ahora devuelve response.error como string con el mensaje
      const mensajeError = response.error || 'Error al crear la reserva';
      console.log('🔴 Error del backend:', mensajeError);
      throw new Error(mensajeError);
    }
    
    return response.data;
    
  } catch (error) {
    console.error('🔴 Error en createReserva:', error);
    // Propagamos el error tal cual (ya tiene el mensaje correcto)
    throw error;
  }
}

// ============================================================
// 🟠 PUT - Actualizar reserva existente
// ============================================================
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

// ============================================================
// 🔧 PATCH - Actualizar estado de reserva
// ============================================================
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

// ============================================================
// 🔴 DELETE - Eliminar reserva
// ============================================================
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