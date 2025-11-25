import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import RegisterView from './RegisterView';
import { createUsuarioThunk } from '../../store/usuarios/thunks';
const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const handleRegister = async (data) => {
    setLoading(true);
    try {
      const nuevoUsuario = {
        Nombre: data.nombre,
        Apellido: data.apellido,
        Email: data.email,
        Contrasena: data.password,
        Direccion: data.direccion,
        Pais: data.pais , 
        Edad: data.edad ? parseInt(data.edad) : 18,
        TipoIdentificacion: data.tipoIdentificacion || "Cédula",
        Identificacion: data.identificacion, 
        Rol: "Cliente", 
       UsuarioCorreo: data.email, 
        Links: [] 
      };
      await dispatch(createUsuarioThunk(nuevoUsuario)).unwrap();

      api.success({
        message: 'Usuario creado correctamente',
        description: 'Redirigiendo al login...',
        placement: 'topRight',
        duration: 4,
      });
      setTimeout(() => {
        navigate('/login');
      }, 2500);

    } catch (error) {
      let msg = 'No se pudo crear el usuario.';
      if (typeof error === 'string') msg = error;
      else if (error.message) msg = error.message;
      if (error.ExceptionMessage) msg = error.ExceptionMessage;

      api.error({
        message: 'Error al registrar',
        description: msg,
        placement: 'topRight',
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
  <>
    {contextHolder}
    <RegisterView onRegister={handleRegister} loading={loading} /> 
    </>);
};

export default RegisterPage;