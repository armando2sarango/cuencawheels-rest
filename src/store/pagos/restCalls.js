import { makeRequest, HttpMethod } from '../../services/restCall';

// GET: Listar todos (Admin)
export async function getPagos() {
  try {
    const response = await makeRequest(HttpMethod.GET, '/pagos');
    if (!response.success) return [];
    // El backend devuelve { data: [...] }
    return response.data?.data || []; 
  } catch (error) {
    return [];
  }
}

// GET: Por ID
export async function getPagoById(id) {
  try {
    const response = await makeRequest(HttpMethod.GET, `/pagos/${id}`);
    if (!response.success) return null;
    return response.data?.data || response.data;
  } catch (error) {
    return null;
  }
}

// GET: Por Reserva
export async function getPagosByReserva(idReserva) {
  try {
    const response = await makeRequest(HttpMethod.GET, `/pagos/reserva/${idReserva}`);
    if (!response.success) return [];
    return response.data?.data || [];
  } catch (error) {
    return [];
  }
}

// ✅ GET: Por Usuario (NUEVO - Para el historial del cliente)
export async function getPagosByUsuario(idUsuario) {
  try {
    const response = await makeRequest(HttpMethod.GET, `/pagos/usuario/${idUsuario}`);
    if (!response.success) return [];
    return response.data?.data || [];
  } catch (error) {
    return [];
  }
}

// POST: Crear Pago (Pagar Reserva)
export async function createPago(body) {
  try {
    const response = await makeRequest(HttpMethod.POST, '/pagos', body);
    
    if (!response.success) {
        // Lanzamos el mensaje exacto que manda el backend (ej: "Sin fondos")
        throw new Error(response.error || "Error al procesar el pago");
    }
    return response.data;
  } catch (error) {
    throw error;
  }
}

// PUT: Actualizar
export async function updatePago(id, body) {
  try {
    const response = await makeRequest(HttpMethod.PUT, `/pagos/${id}`, body);
    if (!response.success) return null;
    return response.data;
  } catch (error) {
    throw error;
  }
}

// DELETE: Eliminar
export async function deletePago(id) {
  try {
    const response = await makeRequest(HttpMethod.DELETE, `/pagos/${id}`);
    return response.success;
  } catch (error) {
    throw error;
  }
}