import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { notification, Modal } from 'antd'; // Importamos Modal
import { ExclamationCircleOutlined } from '@ant-design/icons';
import AutosView from './AutosView';
import { createCarritoThunk } from '../../store/carrito/thunks';
import { fetchVehiculos,createVehiculoThunk, updateVehiculoThunk, deleteVehiculoThunk, buscarVehiculosThunk } from '../../store/autos/thunks';
import { getUserId, setCarritoId, isAdmin, isAuthenticated } from '../../services/auth';
const AutosPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [modal, contextHolderModal] = Modal.useModal();
  const autosState = useSelector((state) => state.autos);
  
  let vehicles = [];
  if (autosState?.items) {
    if (Array.isArray(autosState.items)) {
      vehicles = autosState.items;
    } else if (autosState.items && typeof autosState.items === 'object') {
      vehicles = [autosState.items];
    }
  }
  const esAdministrador = isAdmin(); 
  const loading = autosState?.loading || false;
  const error = autosState?.error || null;

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const cargarVehiculos = () => {
    dispatch(fetchVehiculos());
  };

  const getErrorMessage = (error) => {
    let msg = 'Error desconocido.';
    if (typeof error === 'string') msg = error;
    else if (error?.message) msg = error.message;
    if (error?.ExceptionMessage) msg = error.ExceptionMessage;
    return msg;
  };
  const handleCheckAuthAndOpenModal = () => {
    const isAuth = isAuthenticated();
    if (!isAuth) {
      modal.confirm({
        title: 'Iniciar sesión requerido',
        icon: <ExclamationCircleOutlined />,
        content: 'Para reservar un vehículo necesitas acceder a tu cuenta. ¿Deseas ir a iniciar sesión ahora?',
        okText: 'Sí, ir al Login',
        cancelText: 'Seguir viendo',
        onOk: () => {
          navigate('/login');
        },
        onCancel: () => {
        },
      });
      
      return false; 
    }
    
    return true;
  };
  const handleAgregarCarrito = async (idVehiculo, fechas) => {
    const idUsuario = getUserId(); 
    if (!idUsuario) {
        console.error("Error lógico: handleAgregarCarrito llamado sin usuario");
        return false; 
    }

    try {
      const respuesta = await dispatch(createCarritoThunk({
          IdUsuario: idUsuario, 
          IdVehiculo: idVehiculo, 
      })).unwrap();
      const idCarritoNuevo = respuesta.IdCarrito || respuesta.idCarrito || (respuesta.data && respuesta.data.IdCarrito);

      if (idCarritoNuevo) {
          setCarritoId(idCarritoNuevo); 
      } 

      api.success({
        message: 'Agregado al carrito',
        description: 'El vehículo se ha añadido a tu carrito exitosamente.',
        placement: 'topRight',
        duration: 3,
      });
      return true;

    } catch (error) {
       api.error({
        message: 'Error al agregar',
        description: getErrorMessage(error),
        placement: 'topRight',
        duration: 4,
      });
       return false;
    }
  };
  const handleBuscar = async (filtros) => {
    try { await dispatch(buscarVehiculosThunk(filtros)).unwrap(); } 
    catch (error) { api.error({ message: 'Error búsqueda', description: getErrorMessage(error) }); }
  };
  const handleCrear = async (d) => { try { await dispatch(createVehiculoThunk(d)).unwrap(); dispatch(fetchVehiculos()); api.success({ message: 'Creado', description: 'Éxito' }); return true; } catch (e) { api.error({ message: 'Error', description: getErrorMessage(e) }); return false; } };
  const handleEditar = async (id, d) => { try { await dispatch(updateVehiculoThunk({id, body: d})).unwrap(); dispatch(fetchVehiculos()); api.success({ message: 'Editado', description: 'Éxito' }); return true; } catch (e) { api.error({ message: 'Error', description: getErrorMessage(e) }); return false; } };
  const handleEliminar = async (id) => { try { await dispatch(deleteVehiculoThunk(id)).unwrap(); dispatch(fetchVehiculos()); api.success({ message: 'Eliminado', description: 'Éxito' }); return true; } catch (e) { api.error({ message: 'Error', description: getErrorMessage(e) }); return false; } };

  return (
    <>
      {contextHolder} 
      {contextHolderModal}
      
      <AutosView
        autos={vehicles}
        loading={loading}
        error={error}
        onCrear={handleCrear}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
        onRefresh={cargarVehiculos}
        onAgregarCarrito={handleAgregarCarrito}
        onBuscar={handleBuscar}
        isAdmin={esAdministrador}
        checkAuth={handleCheckAuthAndOpenModal} 
        navigate={navigate}
        api={api}
      />
    </>
  );
};

export default AutosPage;