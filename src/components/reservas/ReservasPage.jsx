import React, { useEffect, useState } from 'react'; 
import { useDispatch, useSelector } from 'react-redux';
import { message, notification, Modal, Button, Table, Tag, Empty, Typography } from 'antd'; 
import { FilePdfOutlined } from '@ant-design/icons';
import ReservasView from './ReservasView';
import { fetchReservas, fetchReservasIdUsuario, deleteReservaThunk, updateEstadoReservaThunk } from '../../store/reservas/thunks';
import { fetchFacturasByUsuarioThunk } from '../../store/facturas/thunks';
import { updateVehiculoThunk, fetchVehiculoById } from '../../store/autos/thunks';
import { getUserId, isAdmin } from '../../services/auth'; 
import dayjs from 'dayjs';

const { Text } = Typography;

const ReservasPage = () => {
  const dispatch = useDispatch();
  const { items = [], loading = false } = useSelector((state) => state.reservas || {});
  const [api, contextHolder] = notification.useNotification();
  const esAdministrador = isAdmin();
  const idUsuario = getUserId();
  
  const [pagosDeReserva, setPagosDeReserva] = useState(null);
  const [modalPagosVisible, setModalPagosVisible] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = () => {
    if (esAdministrador) {
      dispatch(fetchReservas());
    } else if (idUsuario) {
      dispatch(fetchReservasIdUsuario(idUsuario));
    } else {
      message.warning("Inicia sesión para ver tus reservas.");
    }
  };

  const handleEliminar = async (idReserva) => {
    try {
      await dispatch(deleteReservaThunk(idReserva)).unwrap();
      message.success("Reserva eliminada/cancelada correctamente");
      cargarDatos(); 
    } catch (error) {
      message.error("No se pudo eliminar la reserva.");
    }
  };

  const handleVerPagos = async (idReserva, idUsuario) => {
    setPagosDeReserva(null);
    setModalPagosVisible(true);
    
    try {
      message.loading({ content: 'Cargando facturas...', key: 'fetch_facturas' });
      const facturas = await dispatch(fetchFacturasByUsuarioThunk(idUsuario)).unwrap();
      
      const facturasDeReserva = facturas.filter(f => f.IdReserva === idReserva);
      
      setPagosDeReserva(facturasDeReserva);
      message.success({ content: 'Facturas cargadas', key: 'fetch_facturas' });
    } catch (error) {
      setPagosDeReserva([]);
      message.error({ content: 'Error al cargar facturas', key: 'fetch_facturas' });
    }
  };

  const handleCambiarEstado = async (idReserva, nuevoEstado, registro) => {
    try {
      message.loading({ content: 'Procesando...', key: 'estado_update' });

      await dispatch(updateEstadoReservaThunk({ 
        id: idReserva, 
        estado: nuevoEstado 
      })).unwrap();

      let nuevoEstadoVehiculo = null;
      
      if (nuevoEstado === 'Confirmada') {
        nuevoEstadoVehiculo = 'Rentado';
      } else if (nuevoEstado === 'Finalizada') {
        nuevoEstadoVehiculo = 'Disponible';
      } else if (nuevoEstado === 'Rechazada') {
        nuevoEstadoVehiculo = 'Disponible';
      }

      if (nuevoEstadoVehiculo && registro?.IdVehiculo) {
        console.log('🔍 Obteniendo datos del vehículo:', registro.IdVehiculo);
        
        const vehiculoCompleto = await dispatch(fetchVehiculoById(registro.IdVehiculo)).unwrap();
        
        if (vehiculoCompleto) {
          const payloadVehiculo = {
            ...vehiculoCompleto,
            Estado: nuevoEstadoVehiculo
          };

          console.log('🔄 Actualizando vehículo a estado:', nuevoEstadoVehiculo);
          
          await dispatch(updateVehiculoThunk({ 
            id: registro.IdVehiculo, 
            body: payloadVehiculo 
          })).unwrap();

          console.log('✅ Vehículo actualizado correctamente');
        }
      }

      message.success({ 
        content: `Reserva ${nuevoEstado.toLowerCase()} correctamente`, 
        key: 'estado_update' 
      });

      cargarDatos();
      return true;

    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
      message.error({ 
        content: error.message || 'Error al procesar', 
        key: 'estado_update' 
      });
      return false;
    }
  };

  return (
    <>
      {contextHolder} 
      
      <ReservasView 
        reservas={Array.isArray(items) ? items : []}
        loading={loading}
        esAdmin={esAdministrador}
        onRefresh={cargarDatos}
        onEliminar={handleEliminar}
        onCambiarEstado={handleCambiarEstado}
        onVerPagos={handleVerPagos} 
      />

      {/* Modal de Facturas */}
      <Modal
        title={`Facturas - Reserva #${pagosDeReserva?.[0]?.IdReserva || '...'}`}
        open={modalPagosVisible}
        onCancel={() => setModalPagosVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalPagosVisible(false)}>
            Cerrar
          </Button>
        ]}
        width={800}
      >
        {pagosDeReserva && pagosDeReserva.length > 0 ? (
          <Table
            dataSource={pagosDeReserva}
            columns={[
              { 
                title: 'Monto Total', 
                dataIndex: 'ValorTotal', 
                key: 'monto', 
                render: (valor) => <Text strong>${parseFloat(valor || 0).toFixed(2)}</Text> 
              },
              { 
                title: 'Fecha Emisión', 
                dataIndex: 'FechaEmision', 
                key: 'fecha', 
                render: (fecha) => dayjs(fecha).format('DD/MM/YYYY HH:mm') 
              },
              { 
                title: 'PDF', 
                dataIndex: 'UriFactura', 
                key: 'pdf', 
                render: (uri) => (
                  <Button 
                    type="link" 
                    icon={<FilePdfOutlined />}
                    href={uri}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver PDF
                  </Button>
                )
              },
            ]}
            rowKey="IdFactura"
            pagination={false}
            size="small"
          />
        ) : (
          <Empty description="No se encontraron facturas para esta reserva." />
        )}
      </Modal>
    </>
  );
};

export default ReservasPage;