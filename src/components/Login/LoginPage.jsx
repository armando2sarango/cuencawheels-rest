import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import LoginView from './LoginView';
import { loginThunk } from '../../store/usuarios/thunks';
import { setAuth } from '../../services/auth';
const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  const handleLogin = async (email, password, rememberMe) => {
    setLoading(true);
    setError(null);
    try {
      const credentials = {
        Email: email,
        Contrasena: password
      };
      const respuestaApi = await dispatch(loginThunk(credentials)).unwrap();

      if (!respuestaApi) {
        throw new Error('Credenciales incorrectas.');
      }
      const usuario = respuestaApi.data || respuestaApi;

      if (!usuario.IdUsuario && !usuario.idUsuario) {
          throw new Error('Error: La respuesta del servidor no contiene un ID de usuario válido.');
      }
      let carritoId = null;
      const links = respuestaApi.links || usuario.Links || [];
      
      if (Array.isArray(links)) {
        const linkCarrito = links.find(l => l.rel === 'carrito');
        if (linkCarrito) {
            carritoId = null; 
        }
      }
      setAuth({
        IdUsuario: usuario.IdUsuario || usuario.idUsuario,
        Email:     usuario.Email || usuario.email,
        Nombre:    usuario.Nombre || usuario.nombre,
        Apellido:  usuario.Apellido || usuario.apellido,
        Rol:       usuario.Rol || usuario.rol,
        carritoId: carritoId 
      });
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      api.success({
        message: 'Ingreso correcto',
        description: `¡Bienvenido ${usuario.Nombre} ${usuario.Apellido}!`,
        placement: 'topRight',
        duration: 3,
      });
      setTimeout(() => {
        navigate('/home');
      }, 500);

    } catch (err) {
      console.error('Error en login:', err);
      const errorMessage = typeof err === 'string' ? err : (err.message || 'Error al iniciar sesión');
      setError(errorMessage);
      api.error({
        message: 'Error de autenticación',
        description: errorMessage,
        placement: 'topRight',
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateRegister = () => {
    navigate('/register');
  };

  return (
    <>
      {contextHolder} 
      <LoginView
        loading={loading}
        error={error}
        onLogin={handleLogin}
        onNavigateRegister={handleNavigateRegister}  
      />
    </>
  );
};

export default LoginPage;