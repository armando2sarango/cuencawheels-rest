import axios from "axios";
import { loaderOn, loaderOff } from "../utils/loaderManager";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
if (!API_BASE_URL) {
  console.error('❌ ERROR: REACT_APP_API_BASE_URL no está definida');
  console.log('Variables disponibles:', Object.keys(process.env).filter(k => k.startsWith('REACT_APP_')));
}
export const apiClient = axios.create({
  baseURL: API_BASE_URL || "https://cuencautosgestion.runasp.net/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 45000,
});

apiClient.interceptors.request.use(
  (config) => {loaderOn();
    return config;
  },
  (error) => {loaderOff();
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {loaderOff(); 
    return response;
  },
  (error) => {loaderOff();
    return Promise.reject(error);
  }
);
