import { makeRequest, HttpMethod } from '../../services/restCall';
export async function getUsuarios() {
  try {
    const response = await makeRequest(HttpMethod.GET, '/usuarios');

    if (!response.success) return [];
    return response.data?.data || [];

  } catch {
    return [];
  }
}
export async function getUsuarioById(id) {
  try {
    const response = await makeRequest(HttpMethod.GET, `/usuarios/${id}`);
    if (!response.success) return null;
    return response.data || null;
  } catch {
    return null;
  }
}

export async function createUsuario(body) {
  try {
    const response = await makeRequest(HttpMethod.POST, '/usuarios', body);
    if (!response.success) return null;
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function login(body) {
  try {
    const response = await makeRequest(HttpMethod.POST, '/usuarios/login', body);
    if (!response.success) return null;
    return response.data;
  } catch (error) {
    throw error;
  }
}
export async function updateUsuario(id, body) {
  try {
    const response = await makeRequest(HttpMethod.PUT, `/usuarios/${id}`, body);
    if (!response.success) return null;
    return response.data;
  } catch (error) {
    throw error;
  }
}
export async function deleteUsuario(id) {
  try {
    const response = await makeRequest(HttpMethod.DELETE, `/usuarios/${id}`);
    return response.success;
  } catch (error) {
    throw error;
  }
}