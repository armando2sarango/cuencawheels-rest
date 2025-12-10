import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { notification } from 'antd'; // 💡 Ya no se importa Modal aquí
import FacturasView from './facturasView';
import { 
  fetchFacturas, 
  createFacturaThunk, 
  updateFacturaThunk,
  deleteFacturaThunk 
} from '../../store/facturas/thunks';
import { fetchUsuarios } from '../../store/usuarios/thunks';
import { fetchReservas } from '../../store/reservas/thunks';
import { isAdmin } from '../../services/auth';

const FacturasPage = () => {
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  // ❌ Se eliminó const [modal, modalContextHolder] = Modal.useModal();
  
  const { facturas, loading } = useSelector(state => state.facturas);
  const { items: usuarios } = useSelector(state => state.usuarios || { items: [] });
  const { items: reservas } = useSelector(state => state.reservas || { items: [] });
  
  const esAdmin = isAdmin();

  useEffect(() => {
    dispatch(fetchFacturas());
    if (esAdmin) {
      dispatch(fetchUsuarios());
      dispatch(fetchReservas());
    }
  }, [dispatch, esAdmin]);

  // ✅ Función helper para extraer mensajes de error
  const getErrorMessage = (error) => {
    let msg = 'Error desconocido.';
    if (typeof error === 'string') msg = error;
    else if (error?.message) msg = error.message;
    if (error?.data?.Message) msg = error.data.Message;
    if (error?.ExceptionMessage) msg = error.ExceptionMessage;
    return msg;
  };

  const handleCrear = async (factura) => {
    try {
      const payload = {
        IdReserva: factura.IdReserva,
        ValorTotal: factura.ValorTotal
      };

      await dispatch(createFacturaThunk(payload)).unwrap();
      
      api.success({ 
        message: 'Factura Creada', 
        description: 'La factura se ha creado exitosamente.',
        placement: 'topRight',
        duration: 3,
      });
      
      dispatch(fetchFacturas());
      return true;
    } catch (error) {
      api.error({ 
        message: 'Error al Crear Factura', 
        description: getErrorMessage(error),
        placement: 'topRight',
        duration: 4,
      });
      return false;
    }
  };

  const handleEliminar = async (idFactura) => {
    try {
      await dispatch(deleteFacturaThunk(idFactura)).unwrap();
      
      api.success({ 
        message: 'Factura Eliminada', 
        description: `La factura #${idFactura} se ha eliminado exitosamente.`,
        placement: 'topRight',
        duration: 3,
      });
      return true;
    } catch (error) {
      api.error({ 
        message: 'Error al Eliminar Factura', 
        description: getErrorMessage(error),
        placement: 'topRight',
        duration: 4,
      });
      return false;
    }
  };

  const handleEditar = async (factura) => {
    try {
      await dispatch(updateFacturaThunk({
        idFactura: factura.IdFactura,
        body: factura
      })).unwrap();

      api.success({ 
        message: 'Factura Actualizada',
        description: 'Los cambios se han guardado correctamente.',
        placement: 'topRight',
        duration: 3,
      });

      dispatch(fetchFacturas());
      return true;
    } catch (error) {
      api.error({ 
        message: 'Error al Actualizar Factura', 
        description: getErrorMessage(error),
        placement: 'topRight',
        duration: 4,
      });
      return false;
    }
  };

  return (
    <>
      {contextHolder}
      {/* ❌ Se eliminó {modalContextHolder} */}
      <FacturasView
        facturas={facturas}
        loading={loading}
        usuarios={usuarios}
        reservas={reservas}
        esAdmin={esAdmin}
        onCrear={handleCrear}
        onEditar={handleEditar}
        api={api}
        onEliminar={handleEliminar}
        // ❌ Se eliminó modalApi={modal}
      />
    </>
  );
};

export default FacturasPage;