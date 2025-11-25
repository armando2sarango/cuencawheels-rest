import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { notification } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import CarritoView from './carritoView';
import { fetchCarritos, deleteCarritoThunk } from '../../store/carrito/thunks'; 
import { createReservaThunk } from '../../store/reservas/thunks';
import { getCarritoId, getUserId } from '../../services/auth'; 

const CarritoPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items = [], loading = false, error = null } = useSelector((state) => state.carritos || {}); 
  const [total, setTotal] = useState(0);
  const [api, contextHolder] = notification.useNotification();
  useEffect(() => {cargarCarrito(); }, []);
  useEffect(() => {calcularTotal();}, [items]);

  const cargarCarrito = () => {
    let idParaBuscar = getCarritoId();
    if (!idParaBuscar) {
      idParaBuscar = getUserId();
    }
    if (idParaBuscar) {
      dispatch(fetchCarritos(idParaBuscar));
    } else {
      console.warn("⛔ No se encontró ni ID Carrito ni ID Usuario.");
    }
  };

  const calcularTotal = () => {
    if (!items || !Array.isArray(items)) {
      setTotal(0);
      return;
    }
    const sumaTotal = items.reduce((acumulador, item) => {
      return acumulador + (item.Subtotal || 0);
    }, 0);

    setTotal(sumaTotal);
  };

  const handleEliminar = async (idItem) => {
    try {
      await dispatch(deleteCarritoThunk(idItem)).unwrap();
      api.success({
        message: 'Elemento eliminado',
        description: 'El vehículo ha sido removido del carrito.',
        placement: 'topRight',
        duration: 3,
      });
      cargarCarrito();
    } catch (error) {
      let msg = 'No se pudo eliminar el elemento.';
      if (typeof error === 'string') msg = error;
      else if (error.message) msg = error.message;
      if (error.ExceptionMessage) msg = error.ExceptionMessage;

      api.error({
        message: 'Error al eliminar',
        description: msg,
        placement: 'topRight',
        duration: 4,
      });
    }
  };

  const handleReservar = async () => {
    const idUsuario = getUserId();
    if (!idUsuario) {
      api.warning({
        message: 'Sesión requerida',
        description: 'Debes iniciar sesión para poder realizar reservas.',
        placement: 'topRight',
        duration: 4,
      });
      return;
    }

    if (!items || items.length === 0) {
      api.info({
        message: 'Carrito vacío',
        description: 'No hay vehículos en tu carrito para reservar.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    try {
      api.info({
        key: 'reserva_proc',
        message: 'Procesando reservas...',
        description: `Generando ${items.length} reserva${items.length > 1 ? 's' : ''}...`,
        placement: 'topRight',
        duration: 0,
      });

      // 1. Recorremos cada auto en el carrito
      for (const item of items) {
        const nuevaReserva = {
          IdUsuario: idUsuario,
          IdVehiculo: item.IdVehiculo,
          FechaInicio: item.FechaInicio,
          FechaFin: item.FechaFin,
          Total: item.Subtotal,
          Estado: "Pendiente",
          FechaReserva: new Date().toISOString(),
          UsuarioCorreo: "", 
          Links: []
        };

        // 2. Creamos la reserva
        await dispatch(createReservaThunk(nuevaReserva)).unwrap();

        // 3. Borramos del carrito
        await dispatch(deleteCarritoThunk(item.IdItem));
      }

      api.success({
        key: 'reserva_proc',
        message: '¡Reservas generadas con éxito!',
        description: `Se crearon ${items.length} reserva${items.length > 1 ? 's' : ''}. Redirigiendo...`,
        placement: 'topRight',
        duration: 4,
      });
      
      // 4. Limpiamos y redirigimos
      cargarCarrito(); 
      setTimeout(() => navigate('/reservas'), 2000);

    } catch (error) {
      console.error(error);
      let msg = 'Hubo un error al procesar las reservas.';
      if (typeof error === 'string') msg = error;
      else if (error.message) msg = error.message;
      if (error.ExceptionMessage) msg = error.ExceptionMessage;

      api.error({
        key: 'reserva_proc',
        message: 'Error al procesar reservas',
        description: msg,
        placement: 'topRight',
        duration: 5,
      });
    }
  };

  return (
    <>
      {contextHolder}
      <CarritoView 
        items={items} 
        loading={loading} 
        error={error} 
        totalGeneral={total} 
        onEliminar={handleEliminar} 
        onReservar={handleReservar}
      />
    </>
  );
};

export default CarritoPage;