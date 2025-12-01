import React, { useEffect, useState } from 'react'; 
import { useDispatch, useSelector } from 'react-redux';
import { notification, Modal, Button, Table, Tag, Empty, Typography } from 'antd'; 
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
      api.warning({ 
        message: 'Sesión requerida',
        description: 'Inicia sesión para ver tus reservas.' 
      });
    }
  };

  const handleEliminar = async (idReserva) => {
    try {
      await dispatch(deleteReservaThunk(idReserva)).unwrap();
      api.success({ 
        message: 'Eliminado', 
        description: 'Reserva eliminada/cancelada correctamente' 
      });
      cargarDatos(); 
    } catch (error) {
      api.error({ 
        message: 'Error', 
        description: 'No se pudo eliminar la reserva.' 
      });
    }
  };

  const handleVerPagos = async (idReserva, idUsuario) => {
    setPagosDeReserva(null);
    setModalPagosVisible(true);
    
    try {
      api.info({ 
        message: 'Cargando facturas...', 
        key: 'fetch_facturas',
        duration: 0 
      });
      
      const facturas = await dispatch(fetchFacturasByUsuarioThunk(idUsuario)).unwrap();
      const facturasDeReserva = facturas.filter(f => f.IdReserva === idReserva);
      
      setPagosDeReserva(facturasDeReserva);
      
      api.success({ 
        message: 'Facturas cargadas', 
        key: 'fetch_facturas' 
      });
    } catch (error) {
      setPagosDeReserva([]);
      api.error({ 
        message: 'Error al cargar facturas', 
        key: 'fetch_facturas' 
      });
    }
  };

  const handleCambiarEstado = async (idReserva, nuevoEstado, registro) => {
    try {
      api.info({ 
        message: 'Procesando...', 
        key: 'estado_update',
        duration: 0 
      });

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
        const vehiculoCompleto = await dispatch(fetchVehiculoById(registro.IdVehiculo)).unwrap();   
        if (vehiculoCompleto) {
          const payloadVehiculo = {
            ...vehiculoCompleto,
            Estado: nuevoEstadoVehiculo
          };
          await dispatch(updateVehiculoThunk({ 
            id: registro.IdVehiculo, 
            body: payloadVehiculo 
          })).unwrap();
        }
      }

      api.success({ 
        message: 'Estado actualizado',
        description: `Reserva ${nuevoEstado.toLowerCase()} correctamente`, 
        key: 'estado_update' 
      });

      cargarDatos();
      return true;

    } catch (error) {
      api.error({ 
        message: 'Error',
        description: error.message || 'Error al procesar', 
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