import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import UsuariosView from './UsuariosView';
import { notification } from 'antd';
import {fetchUsuarios,createUsuarioThunk,updateUsuarioThunk,deleteUsuarioThunk } from '../../store/usuarios/thunks';

const UsuariosPage = () => {

  const dispatch = useDispatch();
  const { usuarios, loading, error } = useSelector(state => state.usuarios);
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    dispatch(fetchUsuarios());
  }, [dispatch]);

  // ✅ FUNCIÓN DE LIMPIEZA DE ERRORES (Importante para eliminar rutas de servidor)
  const getErrorMessage = (error) => {
    let rawMsg = 'Error al procesar la solicitud.';
    
    // 1. Obtener el mensaje completo del objeto de error o string
    if (typeof error === 'string') rawMsg = error;
    else if (error?.message) rawMsg = error.message;
    else if (error?.data?.Message) rawMsg = error.data.Message;
    else if (error?.ExceptionMessage) rawMsg = error.ExceptionMessage;

    // 2. Limpiar la ruta del servidor (filtra cualquier texto después de 'en C:\' o primer salto de línea)
    let cleanedMsg = rawMsg.split('en C:\\')[0].trim();
    cleanedMsg = cleanedMsg.split('\n')[0].trim(); 
    
    // 3. Quitar el prefijo de error SOAP si aún existe
    if (cleanedMsg.includes('System.Web.Services.Protocols.SoapException:')) {
        cleanedMsg = cleanedMsg.replace('System.Web.Services.Protocols.SoapException:', '').trim();
    }
    
    // 4. Si el mensaje final está vacío o es demasiado corto, usar el predeterminado
    return cleanedMsg || 'Ocurrió un error desconocido.';
  };
  
  const mapearUsuarioDTO = (values, IdUsuario = 0) => ({
    IdUsuario: IdUsuario,
    Nombre: values.Nombre,
    Apellido: values.Apellido,
    Email: values.Email,
    Contrasena: values.Contrasena || "12345",
    Direccion: values.Direccion,
    Edad: values.Edad ? parseInt(values.Edad) : null,
    Pais: values.Pais,
    TipoIdentificacion: values.TipoIdentificacion,
    Identificacion: values.Identificacion,
    UsuarioCorreo: values.UsuarioCorreo || values.Email,
    Rol: values.Rol
  });
  
  const handleCrear = async (formValues) => {
    try {
      const nuevoUsuario = mapearUsuarioDTO(formValues, 0);
      await dispatch(createUsuarioThunk(nuevoUsuario)).unwrap();

      api.success({
        message: 'Usuario creado correctamente',
        placement: 'topRight',
        duration: 3,
      });

      dispatch(fetchUsuarios());
      return true;

    } catch (err) {
      api.error({
        message: 'Error al crear usuario',
        // ✅ USAMOS getErrorMessage AQUÍ
        description: getErrorMessage(err), 
        placement: 'topRight',
        duration: 4,
      });
      return false;
    }
  };
  
  const handleEditar = async (formValues) => {
    try {
      const usuarioEditado = mapearUsuarioDTO(
        formValues, 
        formValues.IdUsuario
      );

      await dispatch(updateUsuarioThunk({
        id: usuarioEditado.IdUsuario,
        body: usuarioEditado,
      })).unwrap();

      api.success({
        message: 'Usuario actualizado correctamente',
        placement: 'topRight',
        duration: 3,
      });

      dispatch(fetchUsuarios());
      return true;

    } catch (err) {
      api.error({
        message: 'Error al actualizar usuario',
        // ✅ USAMOS getErrorMessage AQUÍ
        description: getErrorMessage(err),
        placement: 'topRight',
        duration: 4,
      });
      return false;
    }
  };
  
  const handleEliminar = async (id) => {
    try {
      const result = await dispatch(deleteUsuarioThunk(id)).unwrap();

      if (result.success) {
        api.success({
          message: 'Usuario eliminado correctamente',
          placement: 'topRight',
          duration: 3,
        });
      } else {
        // Este caso debería ocurrir raramente si el backend lanza SoapException al fallar
        api.error({
          message: 'El servidor no eliminó el usuario',
          placement: 'topRight',
          duration: 4,
        });
      }

      dispatch(fetchUsuarios());
      return true;

    } catch (err) {
      api.error({
        message: 'Error al eliminar usuario',
        // ✅ USAMOS getErrorMessage AQUÍ
        description: getErrorMessage(err),
        placement: 'topRight',
        duration: 4,
      });
      return false;
    }
  };

  return (
    <>
      {contextHolder}

      <UsuariosView
        usuarios={usuarios}
        loading={loading}
        error={error}
        onCrear={handleCrear}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
      />
    </>
  );
};

export default UsuariosPage;