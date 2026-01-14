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

      // 2. Extraer usuario (En .NET Core suele venir directo, sin .data)
      const usuario = respuestaApi.data || respuestaApi;

      // 3. Buscar el ID (Probamos minúscula 'idUsuario' y mayúscula 'IdUsuario')
      const idUsuarioFinal = usuario.idUsuario || usuario.IdUsuario;
const nombreFinal = usuario.nombre || usuario.Nombre;
const rolFinal = usuario.rol || usuario.Rol;
      if (!idUsuarioFinal) {
          throw new Error('Error: El servidor no devolvió un ID de usuario válido.');
      }

      // 4. Mapear datos al servicio de Auth (Normalizamos a lo que espera tu App)
      setAuth({
  IdUsuario: idUsuarioFinal,
        Nombre: nombreFinal,
                Apellido:  usuario.apellido || usuario.Apellido,
        Rol: rolFinal,
        Email: usuario.email || usuario.Email,
        carritoId: null // Se cargará en la siguiente página

      });

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      api.success({
        message: 'Ingreso correcto',
        description: `¡Bienvenido ${usuario.nombre || usuario.Nombre}!`,
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