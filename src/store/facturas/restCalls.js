// store/facturas/restCalls.js
import { makeRequest, HttpMethod } from '../../services/restCall';

export async function getfacturas() {
  try {
    const response = await makeRequest(HttpMethod.GET, '/facturas');
    
    if (!response.success) return [];
    
    // ✅ Si devuelve array envuelto en data
    return response.data?.data || response.data || []; 

  } catch (error) {
    return [];
  }
}

export async function getFacturasByUsuario(idUsuario) {
  try {
    const response = await makeRequest(HttpMethod.GET, `/facturas/usuario/${idUsuario}`);
    if (!response.success) return [];
    // ✅ Puede devolver array o objeto envuelto
    return response.data?.data || response.data || [];
  } catch (error) {
    throw error;
  }
}

export async function getFacturaHtmlContent(id) {
  try {
    const response = await makeRequest(HttpMethod.GET, `/facturas/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Error al obtener el contenido HTML.');
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getFacturaById(idFactura) {
  try {
    const response = await makeRequest(HttpMethod.GET, `/facturas/${idFactura}`);
    if (!response.success) return null;
    
    // ✅ CORRECCIÓN: Extraer el objeto data cuando es una factura individual
    return response.data?.data || response.data;
  } catch (error) {
    return null;
  }
}

export async function createFactura(body) {
  try {
    const response = await makeRequest(HttpMethod.POST, '/facturas', body);
    if (!response.success) return null;
    
    // ✅ Extraer data si viene envuelto
    return response.data?.data || response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateFactura(id, body) {
  try {
    const response = await makeRequest(HttpMethod.PUT, `/facturas/${id}`, body);
    if (!response.success) return null;
    
    // ✅ Extraer data si viene envuelto
    return response.data?.data || response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteFactura(id) {
  try {
    const response = await makeRequest(HttpMethod.DELETE, `/facturas/${id}`);
    return response.success;
  } catch (error) {
    throw error;
  }
}