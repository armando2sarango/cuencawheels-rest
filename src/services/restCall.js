// services/restCall.js
import { apiClient } from './apiClient';

export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

export async function makeRequest(method, url, body) {
  try {
    const response = await apiClient.request({
      method,
      url,
      data: body,
    });

    return { success: true, data: response.data };
    
  } catch (error) {
    console.error('API Error:', error);
    console.error('API Error Response:', error.response);
    console.error('API Error Data:', error.response?.data);
    
    // ✅ EXTRAER EL MENSAJE DEL BACKEND
    let mensajeError = 'Error en la petición';
    let errorData = null;
    
    if (error.response) {
      // El servidor respondió con un código de error (4xx, 5xx)
      const data = error.response.data;
      errorData = data;
      
      // Intentamos extraer el mensaje en diferentes formatos
      if (typeof data === 'string') {
        mensajeError = data;
      } else if (data.message) {
        mensajeError = data.message;
      } else if (data.Message) {
        mensajeError = data.Message;
      } else if (data.error) {
        if (typeof data.error === 'string') {
          mensajeError = data.error;
        } else if (data.error.message || data.error.Message) {
          mensajeError = data.error.message || data.error.Message;
        }
      } else {
        // Si no encontramos un mensaje, usamos el status
        mensajeError = `Error ${error.response.status}: ${error.response.statusText || 'Error del servidor'}`;
      }
      
      console.log('🔴 Mensaje extraído del backend:', mensajeError);
      
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      mensajeError = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      console.error('📡 Sin respuesta del servidor');
      
    } else {
      // Error al configurar la petición
      mensajeError = error.message || 'Error desconocido';
      console.error('⚙️ Error de configuración:', error.message);
    }
    
    // ✅ DEVOLVEMOS OBJETO CON success: false Y EL MENSAJE DE ERROR
    return { 
      success: false, 
      error: mensajeError,  // ⬅️ ESTO ES CRÍTICO: String con el mensaje
      errorData: errorData, // Datos adicionales si los necesitas
      status: error.response?.status || 0
    };
  }
}