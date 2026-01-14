import { useEffect } from 'react';
const DEFAULT_EXPIRES_IN = 10 * 60 * 1000;
export const setAuth = ({ IdUsuario, Email, Nombre, Apellido, Rol, carritoId }) => {
  const authData = {
    isAuthenticated: true,
    userId: IdUsuario,      
    userEmail: Email,       
    userName: `${Nombre} ${Apellido}`, 
    userRole: Rol,  
    carritoId: carritoId || null, 
    timestamp: Date.now(),
    expiresIn: DEFAULT_EXPIRES_IN
  };
  localStorage.setItem('auth', JSON.stringify(authData));
};

export const clearAuth = () => {
  localStorage.removeItem('auth');
};

export const isAuthenticated = () => {
  const authData = JSON.parse(localStorage.getItem('auth') || '{}');
  if (!authData.isAuthenticated) return false;
  
  const active = Date.now() - authData.timestamp < authData.expiresIn;
  if (!active) clearAuth();
  
  return active;
};

export const getAuth = () => {
  const authData = JSON.parse(localStorage.getItem('auth') || '{}');
  if (authData.isAuthenticated && Date.now() - authData.timestamp < authData.expiresIn) {
    return authData;
  }
  return null;
};
export const isAdmin = () => {
  const authData = getAuth();
  if (!authData) return false;
  const role = authData.userRole;
  return role=== 'Administrador' || role==='Admin';
};

export const isCliente = () => {
  const authData = getAuth();
  if (!authData) return false;
  const role = authData.userRole;
  return role === 'Cliente';
};

export const getCarritoId = () => {
  const authData = getAuth();
  return authData?.carritoId || null;
};

export const getUserRole = () => {
  const authData = getAuth();
  return authData?.userRole || null;
};

export const getCurrentUser = () => {
  return getAuth();
};

export const getUserId = () => {
    const authData = getAuth();
    return authData?.userId || null;
};

export const setCarritoId = (id) => {
  const authData = JSON.parse(localStorage.getItem('auth') || '{}');
  authData.carritoId = id;
  localStorage.setItem('auth', JSON.stringify(authData));
};
export const useActivityTimeout = (expiresIn = DEFAULT_EXPIRES_IN, onExpire) => { 
  useEffect(() => {
    const updateTimestamp = () => {
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      if (authData.isAuthenticated) {
        authData.timestamp = Date.now();
        localStorage.setItem('auth', JSON.stringify(authData));
      }
    };
    const checkInterval = setInterval(() => {
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      if (authData.isAuthenticated) {
        const now = Date.now();
        if (now - authData.timestamp > expiresIn) {
           clearAuth(); 
           if (onExpire) onExpire(); 
        }
      }
    }, 1000); 
    

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(e => window.addEventListener(e, updateTimestamp));

    return () => {
      clearInterval(checkInterval); 
      events.forEach(e => window.removeEventListener(e, updateTimestamp));
    };
  }, [expiresIn, onExpire]);
};