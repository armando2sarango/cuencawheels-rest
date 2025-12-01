import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { notification } from 'antd';
import FacturasView from './facturasView';
import { 
  fetchfacturas, 
  createFacturaThunk, 
  updateFacturaThunk 
} from '../../store/facturas/thunks';
import { fetchUsuarios } from '../../store/usuarios/thunks';
import { fetchReservas } from '../../store/reservas/thunks';
import { isAdmin } from '../../services/auth';

const FacturasPage = () => {
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  
  const { facturas, loading } = useSelector(state => state.facturas);
  const { items: usuarios } = useSelector(state => state.usuarios || { items: [] });
  const { items: reservas } = useSelector(state => state.reservas || { items: [] });
  
  const esAdmin = isAdmin();

  useEffect(() => {
    dispatch(fetchfacturas());
    if (esAdmin) {
      dispatch(fetchUsuarios()); // Cargar usuarios para el select
      dispatch(fetchReservas());  // Cargar reservas para el select
    }
  }, [dispatch, esAdmin]);

  const handleCrear = async (factura) => {
    try {
      // Crear el payload con la estructura que espera el backend
      const payload = {
        IdReserva: factura.IdReserva,
        ValorTotal: factura.ValorTotal
      };

      await dispatch(createFacturaThunk(payload)).unwrap();
      
      api.success({ 
        message: '✅ Factura creada', 
      });
      
      dispatch(fetchfacturas());
      return true;
    } catch (err) {
      console.error(err);
      api.error({ 
        message: ' Error al crear', 
        description: err.message || 'No se pudo crear la factura' 
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
        message: '✅ Factura actualizada', 
        description: 'Los cambios se guardaron correctamente' 
      });
      
      dispatch(fetchfacturas());
      return true;
    } catch (err) {
      console.error(err);
      api.error({ 
        message: '❌ Error al actualizar', 
        description: err.message || 'No se pudo actualizar la factura' 
      });
      return false;
    }
  };

  return (
    <>
      {contextHolder}
      <FacturasView
        facturas={facturas}
        loading={loading}
        usuarios={usuarios}
        reservas={reservas}
        esAdmin={esAdmin}
        onCrear={handleCrear}
        onEditar={handleEditar}
        api={api} 
      />
    </>
  );
};

export default FacturasPage;