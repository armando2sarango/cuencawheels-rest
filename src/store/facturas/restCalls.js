import { makeRequest, HttpMethod } from '../../services/restCall';

export async function getfacturas() {
  try {
    const response = await makeRequest(HttpMethod.GET, '/facturas');
    
    if (!response.success) return [];
    
    // ✅ CORRECCIÓN: Accedemos a response.data.data porque tu backend devuelve un objeto envoltorio
    return response.data?.data || []; 

  } catch (error) {
    return [];
  }
}
export async function getFacturasByUsuario(idUsuario) {
  try {
    const response = await makeRequest(HttpMethod.GET, `/facturas/usuario/${idUsuario}`);
    if (!response.success) return [];
    return response.data?.data || response.data || [];
  } catch (error) {
    throw error;
  }
}
export async function getFacturaById(id) {
  try {
    // ✅ CORRECCIÓN: Usamos 'id', no 'idFactura'
    const response = await makeRequest(HttpMethod.GET, `/facturas/${id}`);
    if (!response.success) return null;
    return response.data; // Aquí usualmente es directo si es un solo objeto, o response.data.data si devuelve array
  } catch (error) {
    return null;
  }
}

export async function createFactura(body) {
  try {
    const response = await makeRequest(HttpMethod.POST, '/facturas', body);
    if (!response.success) return null;
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateFactura(id, body) {
  try {
    // ✅ CORRECCIÓN: Usamos 'id'
    const response = await makeRequest(HttpMethod.PUT, `/facturas/${id}`, body);
    if (!response.success) return null;
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteFactura(id) {
  try {
    // ✅ CORRECCIÓN: Usamos 'id'
    const response = await makeRequest(HttpMethod.DELETE, `/facturas/${id}`);
    return response.success;
  } catch (error) {
    throw error;
  }
}