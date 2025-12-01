import React, { useEffect, useState } from 'react'; 
import { useDispatch, useSelector } from 'react-redux';
import { notification, Modal, Button, Table, Tag, Empty, Typography } from 'antd'; 
import { FilePdfOutlined } from '@ant-design/icons';
import ReservasView from './ReservasView';
import { fetchReservas, fetchReservasIdUsuario, deleteReservaThunk, updateEstadoReservaThunk, createReservaThunk } from '../../store/reservas/thunks';
import { fetchFacturasByUsuarioThunk,createFacturaThunk } from '../../store/facturas/thunks';
import { updateVehiculoThunk, fetchVehiculoById, fetchVehiculos } from '../../store/autos/thunks';
import { fetchUsuarios } from '../../store/usuarios/thunks';
import { getUserId, isAdmin } from '../../services/auth'; 
import dayjs from 'dayjs';

const { Text } = Typography;

const ReservasPage = () => {
  const dispatch = useDispatch();
  const { items = [], loading = false } = useSelector((state) => state.reservas || {});
  const usuariosState = useSelector((state) => state.usuarios || {});
  const usuarios = usuariosState.items || usuariosState.usuarios || [];
  const vehiculosState = useSelector((state) => {
    return state.vehiculos || state.vehicles || state.autos || state.vehiculo || {};
  });
  
  const vehiculos = vehiculosState.items || 
                    vehiculosState.vehiculos || 
                    vehiculosState.data || 
                    (Array.isArray(vehiculosState) ? vehiculosState : []);
  
  const [api, contextHolder] = notification.useNotification();
  const esAdministrador = isAdmin();
  const idUsuario = getUserId();
  
  const [pagosDeReserva, setPagosDeReserva] = useState(null);
  const [modalPagosVisible, setModalPagosVisible] = useState(false);

  useEffect(() => {
    cargarDatos();
  
    if (esAdministrador) {
      dispatch(fetchUsuarios());
      dispatch(fetchVehiculos());
    }
  }, [esAdministrador, dispatch]);

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

const handleCrearReserva = async (reservaDto, totalCobrado) => {
  try {
    api.info({ 
      message: '🏦 Procesando Pago y Reserva...', 
      key: 'crear_reserva',
      description: 'Conectando con el sistema bancario...',
      duration: 0 
    });
    const resultado = await dispatch(createReservaThunk(reservaDto)).unwrap();
    const idReservaCreada = resultado?.reserva?.IdReserva || resultado?.idReserva || resultado?.IdReserva;

    if (!idReservaCreada) {
      throw new Error('No se pudo obtener el ID de la reserva creada');
    }
    const payloadFactura = {
      IdReserva: idReservaCreada,
      ValorTotal: totalCobrado || reservaDto.Total
    };

    await dispatch(createFacturaThunk(payloadFactura)).unwrap();
    const vehiculoCompleto = await dispatch(fetchVehiculoById(reservaDto.IdVehiculo)).unwrap();
    
    if (vehiculoCompleto) {
      const payloadVehiculo = {
        ...vehiculoCompleto,
        Estado: 'Rentado'
      };
      await dispatch(updateVehiculoThunk({ 
        id: reservaDto.IdVehiculo, 
        body: payloadVehiculo 
      })).unwrap();
    }
    
    api.success({ 
      message: '🎉 ¡Reserva y Pago Exitosos!', 
      description: 'La reserva se creó correctamente y se generó la factura',
      key: 'crear_reserva',
      duration: 5
    });
    
    cargarDatos();
    return true;
    
  } catch (error) {
    let mensajeError = 'No se pudo completar la operación';
    let descripcionError = '';
    
    if (typeof error === 'string') {
      mensajeError = error;
    } else if (error?.message) {
      mensajeError = error.message;
    } else if (error?.error) {
      mensajeError = error.error;
    }
    
    if (mensajeError.toLowerCase().includes('saldo')) {
      descripcionError = '💳 Saldo insuficiente en la cuenta del cliente';
    } else if (mensajeError.toLowerCase().includes('disponible')) {
      descripcionError = '⚠️ El vehículo no está disponible en las fechas seleccionadas';
    } else if (mensajeError.toLowerCase().includes('fecha')) {
      descripcionError = '⚠️ Las fechas seleccionadas no son válidas';
    } else if (mensajeError.toLowerCase().includes('vehículo') || mensajeError.toLowerCase().includes('vehiculo')) {
      descripcionError = '⚠️ Problema con el vehículo seleccionado';
    } else if (mensajeError.toLowerCase().includes('usuario')) {
      descripcionError = '⚠️ Problema con el usuario seleccionado';
    } else if (mensajeError.toLowerCase().includes('factura')) {
      descripcionError = '⚠️ La reserva se creó pero hubo un problema al generar la factura';
    } else {
      descripcionError = mensajeError;
    }
    
    api.error({ 
      message: '❌ Error en el Proceso', 
      description: descripcionError,
      key: 'crear_reserva',
      duration: 8
    });
    
    return false;
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
        onCrearReserva={handleCrearReserva}
        usuarios={Array.isArray(usuarios) ? usuarios : []}
        vehiculos={Array.isArray(vehiculos) ? vehiculos : []}
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