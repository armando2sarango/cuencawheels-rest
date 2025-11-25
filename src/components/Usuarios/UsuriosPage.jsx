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
  const mapearUsuarioDTO = (values, idUsuario = 0) => ({
    IdUsuario: idUsuario,
    Nombre: values.Nombre,
    Apellido: values.Apellido,
    Email: values.Email,
    Contrasena: values.Contrasena,
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
        description: err.message || 'Ocurrió un error.',
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
        description: err.message || 'No se pudo actualizar.',
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
        description: err.message || 'No se pudo eliminar.',
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
