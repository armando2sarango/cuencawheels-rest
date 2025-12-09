import React, { useEffect, useState } from 'react'; 
import { useDispatch, useSelector } from 'react-redux';
import { message, notification, Modal, Button, Table, Tag, Empty, Typography, Form, Input, Row, Col } from 'antd'; 
import { FilePdfOutlined, CreditCardOutlined } from '@ant-design/icons';
import ReservasView from './ReservasView'; 
import { fetchReservas, fetchReservasIdUsuario, deleteReservaThunk, updateEstadoReservaThunk, createReservaThunk } from '../../store/reservas/thunks';
import { fetchFacturasByUsuarioThunk, createFacturaThunk } from '../../store/facturas/thunks';
import { updateVehiculoThunk, fetchVehiculoById, fetchVehiculos } from '../../store/autos/thunks';
import { fetchUsuarios } from '../../store/usuarios/thunks';
import { createPagoThunk } from '../../store/pagos/thunks'; 
import { getUserId, isAdmin } from '../../services/auth'; 
import dayjs from 'dayjs';

const { Text } = Typography;

const ReservasPage = () => {
  const dispatch = useDispatch();
  const { items = [], loading = false } = useSelector((state) => state.reservas || {});
  const usuariosState = useSelector((state) => state.usuarios || {});
  const usuarios = usuariosState.items || usuariosState.usuarios || [];
  const vehiculosState = useSelector((state) => state.vehiculos || {});
  const vehiculos = vehiculosState.items || vehiculosState.vehiculos || [];

  const [api, contextHolder] = notification.useNotification();
  const esAdministrador = isAdmin();
  const idUsuarioSesion = getUserId();
  const [listaFacturas, setListaFacturas] = useState(null);
  const [modalFacturasVisible, setModalFacturasVisible] = useState(false);
  const [modalPagoVisible, setModalPagoVisible] = useState(false);
  const [reservaAPagar, setReservaAPagar] = useState(null);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [formPago] = Form.useForm();
  const CUENTA_EMPRESA = "1756177158"; 

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
    } else if (idUsuarioSesion) {
      dispatch(fetchReservasIdUsuario(idUsuarioSesion));
    }
  };
  const abrirModalPago = (reserva) => {
    setReservaAPagar(reserva);
    formPago.resetFields();
    formPago.setFieldsValue({
        cuentaEmpresa: CUENTA_EMPRESA,
        cuentaUsuario: '' 
    });
    setModalPagoVisible(true);
  };

  const handleProcesarPago = async () => {
    try {
        const values = await formPago.validateFields();
        setProcesandoPago(true);

        api.info({ 
            message: 'Procesando Pago...', 
            description: 'Conectando con el banco...', 
            key: 'pago_proc', duration: 0 
        });

        
        const payloadPago = {
            IdReserva: reservaAPagar.IdReserva,
            CuentaCliente: values.cuentaUsuario
        };

        await dispatch(createPagoThunk(payloadPago)).unwrap();
        try {
            const vehiculoCompleto = await dispatch(fetchVehiculoById(reservaAPagar.IdVehiculo)).unwrap();
            if (vehiculoCompleto) {
                await dispatch(updateVehiculoThunk({ 
                    id: reservaAPagar.IdVehiculo, 
                    body: { ...vehiculoCompleto, Estado: 'Rentado' } 
                })).unwrap();
            }
        } catch (errVeh) {
            console.error("Error actualizando vehículo:", errVeh);
        }

        api.success({ 
            message: '¡Pago Exitoso!', 
            description: 'Tu reserva ha sido confirmada y la factura generada.',
            key: 'pago_proc', duration: 5 
        });

        setModalPagoVisible(false);
        setReservaAPagar(null);
        cargarDatos(); // Refrescar tabla

    } catch (error) {
        let msg = error.message || 'Error al procesar el pago';
        if (error.data && error.data.Message) msg = error.data.Message;
        else if (typeof error === 'string') msg = error;

        api.error({ 
            message: 'Pago Fallido', 
            description: msg, 
            key: 'pago_proc', duration: 8 
        });
    } finally {
        setProcesandoPago(false);
    }
  };

  const handleEliminar = async (id) => {
    try { await dispatch(deleteReservaThunk(id)).unwrap(); message.success("Cancelada"); cargarDatos(); } 
    catch { message.error("Error al cancelar"); }
  };

  const handleVerFacturas = async (idReserva, idUsuario) => {
    setListaFacturas(null); setModalFacturasVisible(true);
    try {
      const idBusqueda = esAdministrador ? idUsuario : idUsuarioSesion;
      const resp = await dispatch(fetchFacturasByUsuarioThunk(idBusqueda)).unwrap();
      const todos = resp.data || resp || [];
      setListaFacturas(todos.filter(f => f.IdReserva === idReserva));
    } catch { setListaFacturas([]); }
  };
  const handleCrearReservaAdmin = async (dto) => {
      try {
          await dispatch(createReservaThunk(dto)).unwrap();
          message.success("Reserva creada (Pendiente)");
          cargarDatos();
          return true;
      } catch(e) {
          message.error(e.message || "Error al crear");
          return false;
      }
  };
  const handleCambiarEstado = async (id, estado, registro) => {
      try {
          await dispatch(updateEstadoReservaThunk({id, estado})).unwrap();
          if(estado === 'Finalizada' || estado === 'Rechazada' || estado === 'Cancelada') {
              const v = await dispatch(fetchVehiculoById(registro.IdVehiculo)).unwrap();
              if(v) await dispatch(updateVehiculoThunk({id: v.IdVehiculo, body: {...v, Estado: 'Disponible'}})).unwrap();
          }
          cargarDatos();
          return true;
      } catch { return false; }
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
        onVerPagos={handleVerFacturas} 
        onPagar={abrirModalPago} 
        onCrearReserva={handleCrearReservaAdmin}
        usuarios={usuarios}
        vehiculos={vehiculos}
      />
      <Modal
        title="Documentos de la Reserva"
        open={modalFacturasVisible}
        onCancel={() => setModalFacturasVisible(false)}
        footer={[<Button key="c" onClick={() => setModalFacturasVisible(false)}>Cerrar</Button>]}
        width={700}
      >
        <Table
            dataSource={listaFacturas || []}
            rowKey="IdFactura"
            pagination={false}
            locale={{ emptyText: <Empty description="No hay facturas." /> }}
            columns={[
                { title: 'Fecha', dataIndex: 'FechaEmision', render: f => dayjs(f).format('DD/MM/YYYY HH:mm') },
                { title: 'Monto', dataIndex: 'ValorTotal', render: v => `$${parseFloat(v).toFixed(2)}` },
                { title: 'PDF', dataIndex: 'UriFactura', render: u => u ? <Button type="link" href={u} target="_blank" icon={<FilePdfOutlined />}>Descargar</Button> : 'N/A' }
            ]}
        />
      </Modal>

      {/* MODAL DE PAGO (El mismo diseño de CarritoPage) */}
      <Modal
        title={
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            💳 Pagar Reserva #{reservaAPagar?.IdReserva}
          </div>
        }
        open={modalPagoVisible}
        onOk={handleProcesarPago}
        onCancel={() => !procesandoPago && setModalPagoVisible(false)}
        okText={procesandoPago ? "Procesando..." : "Confirmar Pago"}
        cancelText="Cancelar"
        confirmLoading={procesandoPago}
        width={600}
      >
        <Form form={formPago} layout="vertical">
            <div style={{ background: '#f6ffed', padding: '20px', borderRadius: '12px', border: '1px solid #b7eb8f', marginBottom: '20px' }}>
                <h4 style={{ marginTop: 0, color: '#52c41a' }}>Datos de Transferencia</h4>
                <p>Total a pagar: <strong style={{fontSize: '18px'}}>${reservaAPagar ? parseFloat(reservaAPagar.Total).toFixed(2) : '0.00'}</strong></p>
                
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="cuentaUsuario" label="Tu Cédula / Cuenta" rules={[{ required: true, message: 'Requerido' }]}>
                            <Input placeholder="Ej: 1720..." />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="cuentaEmpresa" label="Cuenta Destino">
                            <Input disabled style={{ fontWeight: 'bold', color: '#333' }} />
                        </Form.Item>
                    </Col>
                </Row>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  * Al confirmar, el sistema validará tu saldo, cambiará el estado a "Confirmada" y generará la factura.
                </p>
            </div>
        </Form>
      </Modal>
    </>
  );
};

export default ReservasPage;