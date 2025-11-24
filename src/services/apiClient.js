import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
if (!API_BASE_URL) {
  console.error('❌ ERROR: REACT_APP_API_BASE_URL no está definida');
  console.log('Variables disponibles:', Object.keys(process.env).filter(k => k.startsWith('REACT_APP_')));
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL || 'https://cuencautosgestion.runasp.net/api/v1', 
  headers: {
    'Content-Type': 'application/json', 
    Accept: 'application/json',
  },
  timeout: 15000, 
});

apiClient.interceptors.request.use(
  (config) => {
    console.log('📡 Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);