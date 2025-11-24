import React, { useEffect, useState } from 'react'; 
import { useDispatch, useSelector } from 'react-redux';
import { message, notification, Modal, Button, Table, Tag, Empty, Typography } from 'antd'; 
import ReservasView from './ReservasView';
import { fetchReservas,fetchReservasIdUsuario,   deleteReservaThunk, updateEstadoReservaThunk } from '../../store/reservas/thunks';
import { updateVehiculoThunk } from '../../store/autos/thunks';
import { getVehiculoById } from '../../store/autos/restCalls';
import { createFacturaThunk } from '../../store/facturas/thunks';
import { createPagoThunk,fetchPagosByReserva  } from '../../store/pagos/thunks';
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
  const handleVerPagos = async (idReserva) => {
    setPagosDeReserva(null); // Limpiar datos anteriores
    setModalPagosVisible(true);
    
    try {
        message.loading({ content: 'Buscando pagos...', key: 'fetch_pagos' });

        // Llamamos al API para obtener los pagos relacionados con esa reserva
        const dataPagos = await dispatch(fetchPagosByReserva(idReserva)).unwrap();

        setPagosDeReserva(dataPagos); // Guardamos la lista de pagos
        message.success({ content: `Pagos encontrados para Reserva #${idReserva}`, key: 'fetch_pagos' });

    } catch (error) {
        setPagosDeReserva([]);
        message.error({ content: `Error al buscar pagos: ${error.message || 'No encontrado'}`, key: 'fetch_pagos' });
    }
  };
const handleCambiarEstado = async (idReserva, nuevoEstado, registro, datosPagoExtra) => {
    try {
      if (nuevoEstado === 'Finalizada') {
          const esEfectivo = datosPagoExtra?.Metodo === 'Efectivo';
          console.log(`💸 Procesando pago (${esEfectivo ? 'EFECTIVO' : 'BANCO'})...`);
          
          const datosPago = {
              IdReserva: idReserva,
              CuentaCliente: esEfectivo ? 0 : (datosPagoExtra?.CuentaCliente || 0),
              CuentaComercio: esEfectivo ? 0 : (datosPagoExtra?.CuentaComercio || 0),
              Monto: datosPagoExtra?.Monto || registro.Total
          };
          const respuestaPago = await dispatch(createPagoThunk(datosPago)).unwrap();
          if (!esEfectivo) {
              const estaAprobado = respuestaPago && (
                  respuestaPago.aprobado === true || 
                  respuestaPago.Aprobado === true
              );
              if (!estaAprobado) {
                  console.warn("🛑 PAGO RECHAZADO DETECTADO. Deteniendo proceso.");

                  let motivo = "Fondos insuficientes o cuenta inválida.";
                  const respuestaBanco = respuestaPago?.respuestaBanco || respuestaPago?.RespuestaBanco;

                  if (respuestaBanco) {
                      try {
                          const jsonLimpio = respuestaBanco.replace('ERROR', '');
                          const objetoError = JSON.parse(jsonLimpio);
                          motivo = objetoError.Message || motivo;
                      } catch (e) {
                          motivo = respuestaBanco;
                      }
                  }
                  api.error({
                      message: '⛔ Transacción Rechazada',
                      description: motivo,
                      placement: 'topLeft',
                      duration: 5,
                      className: 'notificacion-error-banco', 
                      style: { 
                          backgroundColor: '#fff1f0', 
                          border: '2px solid #ff4d4f',
                          fontWeight: 'bold',
                          zIndex: 999999 
                      }
                  });
                  return false;
              }
              
              message.success("Transacción Bancaria APROBADA.");
          } else {
              message.success("Pago en Efectivo registrado.");
          }
      }
      await dispatch(updateEstadoReservaThunk({ id: idReserva, estado: nuevoEstado })).unwrap();
      let nuevoEstadoVehiculo = null;
      if (nuevoEstado === 'Confirmada') nuevoEstadoVehiculo = 'Rentado'; 
      if (nuevoEstado === 'Finalizada') nuevoEstadoVehiculo = 'Disponible';
      if (nuevoEstado === 'Rechazada')  nuevoEstadoVehiculo = 'Disponible'; 

      if (nuevoEstadoVehiculo && registro?.IdVehiculo) {
          const vehiculoCompleto = await getVehiculoById(registro.IdVehiculo);
          if (vehiculoCompleto) {
              await dispatch(updateVehiculoThunk({ 
                  id: registro.IdVehiculo, 
                  body: { ...vehiculoCompleto, Estado: nuevoEstadoVehiculo } 
              }));
          }
      }
      if (nuevoEstado === 'Finalizada') {
          try {
              const nuevaFactura = {
                  IdReserva: idReserva,
                  IdUsuario: registro.IdUsuario,
                  FechaEmision: new Date().toISOString(),
                  ValorTotal: registro.Total, 
                  Descripcion: `Renta finalizada: ${registro.VehiculoNombre || 'Vehículo'}`,
                  Detalles: [] 
              };
              await dispatch(createFacturaThunk(nuevaFactura)).unwrap();
              message.success("Factura generada correctamente.");
          } catch (err) {
              console.error("Error factura:", err);
          }
      } 
      
      cargarDatos(); 
      return true; 

    } catch (error) {
      const msg = error.message || "Error al procesar";
      if (!msg.includes("banco") && !msg.includes("rechazado")) {
          message.error(msg);
      }
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
        title={`Historial de Pagos - Reserva #${pagosDeReserva?.[0]?.IdReserva || '...'}`}
        open={modalPagosVisible}
        onCancel={() => setModalPagosVisible(false)}
        footer={[<Button key="close" onClick={() => setModalPagosVisible(false)}>Cerrar</Button>]}
        width={800}
    >
        {pagosDeReserva && pagosDeReserva.length > 0 ? (
            <Table
                dataSource={pagosDeReserva}
                columns={[
                    { title: 'Monto', dataIndex: 'Monto', key: 'monto', render: (m) => <Text strong>${parseFloat(m || 0).toFixed(2)}</Text> },
                    { title: 'Fecha Pago', dataIndex: 'FechaPago', key: 'fecha', render: (f) => dayjs(f).format('DD/MM/YYYY HH:mm') },
                    { 
                        title: 'Resultado Banco', 
                        dataIndex: 'Estado', 
                        key: 'estado_pago', 
                        render: (estado) => (
                <Tag color={estado === 'Exitoso' ? 'success' : 'error'}> 
                    {estado ? estado.toUpperCase() : 'N/A'}
                </Tag>
            )
                    },
                    { title: 'Método', dataIndex: 'Metodo', key: 'metodo' },
                ]}
                rowKey="IdPago"
                pagination={false}
                size="small"
            />
        ) : (
            <Empty description="No se encontraron pagos registrados para esta reserva." />
        )}
    </Modal>
    </>
  );
};

export default ReservasPage;