import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { message } from 'antd';
import FacturasView from './facturasView';
import { fetchfacturas,createFacturaThunk,updateFacturaThunk, } from '../../store/facturas/thunks';
const FacturasPage = () => {
  const dispatch = useDispatch();
  
  const { facturas, loading, error } = useSelector(state => state.facturas);

  useEffect(() => {
    dispatch(fetchfacturas());
  }, [dispatch]);

  const handleCrear = async (factura) => {
    try {
      await dispatch(createFacturaThunk(factura)).unwrap();
      message.success("Factura creada correctamente");
      dispatch(fetchfacturas());
      return true;
    } catch (err) {
      console.error(err);
      message.error("Error al crear factura");
      return false;
    }
  };

  const handleEditar = async (factura) => {
    try {
      await dispatch(updateFacturaThunk({
        idFactura: factura.IdFactura,
        body: factura
      })).unwrap();
      message.success("Factura actualizada correctamente");
      dispatch(fetchfacturas());
      return true;
    } catch (err) {
      console.error(err);
      message.error("Error al actualizar factura");
      return false;
    }
  };
  return (
    <FacturasView
      facturas={facturas}
      loading={loading}
      error={error}
      onCrear={handleCrear}
      onEditar={handleEditar}
    />
  );
};

export default FacturasPage;