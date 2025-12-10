import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { notification, Modal } from 'antd'; 
import { ExclamationCircleOutlined } from '@ant-design/icons';
import AutosView from './AutosView';
// 🆕 Asegúrate de importar fetchCarritoItems si existe en tu thunks de carrito
import { createCarritoThunk, fetchCarritos } from '../../store/carrito/thunks'; 
import { fetchVehiculos,createVehiculoThunk, updateVehiculoThunk, deleteVehiculoThunk, buscarVehiculosThunk } from '../../store/autos/thunks';
import { getUserId, setCarritoId, isAdmin, isAuthenticated } from '../../services/auth';


const AutosPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [modal, contextHolderModal] = Modal.useModal();
  
  // Estados de Redux
  const autosState = useSelector((state) => state.autos);
  // 🆕 OBTENER ESTADO DEL CARRITO PARA LA VERIFICACIÓN DE DUPLICADOS
  const carritoState = useSelector((state) => state.carrito); 
  
  let vehicles = [];
  if (autosState?.items) {
    if (Array.isArray(autosState.items)) {
      vehicles = autosState.items;
    } else if (autosState.items && typeof autosState.items === 'object') {
      vehicles = [autosState.items];
    }
  }

  // 🆕 Extraer ítems del carrito (asumiendo que están en carritoState.items)
  const carritoItems = carritoState?.items || [];
  
  const esAdministrador = isAdmin(); 
  const loading = autosState?.loading || false;
  const error = autosState?.error || null;
  
  // 🆕 Función auxiliar para recargar el carrito
  const cargarCarrito = () => {
      const idUsuario = getUserId();
      // Solo cargamos el carrito si el usuario está logueado
      if (idUsuario && fetchCarritos) { 
          dispatch(fetchCarritos(idUsuario));
      }
  };

  useEffect(() => {
    cargarVehiculos();
    // 🆕 Cargar ítems del carrito al montar la página para tener la lista actual
    cargarCarrito();
  }, [dispatch]); // Dependencia solo en dispatch para evitar loops

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

  // 🆕 LÓGICA CORREGIDA PARA AGREGAR AL CARRITO (CON VERIFICACIÓN DE DUPLICADOS)
  const handleAgregarCarrito = async (idVehiculo) => {
    const idUsuario = getUserId(); 
    if (!idUsuario) {
        console.error("Error lógico: handleAgregarCarrito llamado sin usuario");
        return false; 
    }

    // 🛑 VERIFICACIÓN DE DUPLICADOS (Frontend)
    // Usamos parseFloat para asegurar que los IDs sean tratados como números.
    const idVehiculoNum = parseFloat(idVehiculo);
    
    const vehiculoYaEnCarrito = carritoItems.some(item => 
        parseFloat(item.IdVehiculo) === idVehiculoNum
    );

    if (vehiculoYaEnCarrito) {
        api.warning({
            message: 'Ya está en el carrito',
            description: 'Este vehículo ya se encuentra en tu lista de deseos.',
            placement: 'topRight',
            duration: 3,
        });
        return true; 
    }
    // 🛑 FIN VERIFICACIÓN DE DUPLICADOS

    try {
      const respuesta = await dispatch(createCarritoThunk({
          IdUsuario: idUsuario, 
          IdVehiculo: idVehiculoNum, 
      })).unwrap();
      
      // 🛡️ CORRECCIÓN: Solo intentar leer propiedades si 'respuesta' existe
      if (respuesta) { 
          const idCarritoNuevo = respuesta.IdCarrito || respuesta.idCarrito || (respuesta.data && respuesta.data.IdCarrito);
  
          if (idCarritoNuevo) {
              setCarritoId(idCarritoNuevo); 
          } 
      } else {
          // Si el unwrap() no lanzó error, pero la respuesta es nula, forzamos un error local
          // (Esto es raro, pero necesario para el manejo seguro)
          throw new Error('La respuesta del servidor fue vacía.');
      }
      
      // Actualizar el estado del carrito en Redux después de añadir con éxito
      cargarCarrito(); 

      api.success({
        message: 'Agregado al carrito',
        description: 'El vehículo se ha añadido a tu carrito exitosamente.',
        placement: 'topRight',
        duration: 3,
      });
      return true;

    } catch (error) {
        // Este catch ahora captura:
        // 1. Errores de red/timeout.
        // 2. El error de duplicado lanzado por el servidor C# (400 Bad Request).
        
       api.error({
        message: 'Error al agregar',
        description: getErrorMessage(error), // Muestra el mensaje de duplicado del backend
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
  
  // Funciones CRUD
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