import React, { useEffect, useState } from 'react'; 
import { useDispatch, useSelector } from 'react-redux';
import { notification, Modal, Button, Table, Tag, Empty, Typography, Form, Input, Row, Col } from 'antd'; 
import { FilePdfOutlined, CreditCardOutlined } from '@ant-design/icons';
import ReservasView from './ReservasView'; 
import { fetchReservas, fetchReservasIdUsuario, deleteReservaThunk, updateEstadoReservaThunk, createReservaThunk, updateReservaThunk } from '../../store/reservas/thunks';
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
const vehiculosState = useSelector((state) => state.autos || {}); // 👈 Cambiar 'vehiculos' por 'autos'
const vehiculos = vehiculosState.items || [];

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
    const NOMBRE_CUENTA_EMPRESA = "Cuenca Wheels";

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

    // ✅ FUNCIÓN DE LIMPIEZA DE ERRORES (Filtrado de rutas de servidor)
    const getErrorMessage = (error) => {
        let rawMsg = 'Error desconocido.';
        
        if (typeof error === 'string') rawMsg = error;
        else if (error?.message) rawMsg = error.message;
        else if (error?.data?.Message) rawMsg = error.data.Message;
        else if (error?.ExceptionMessage) rawMsg = error.ExceptionMessage;

        let cleanedMsg = rawMsg.split('en C:\\')[0].trim();
        cleanedMsg = cleanedMsg.split('\n')[0].trim(); 
        
        if (cleanedMsg.includes('System.Web.Services.Protocols.SoapException:')) {
            cleanedMsg = cleanedMsg.replace('System.Web.Services.Protocols.SoapException:', '').trim();
        }
        
        return cleanedMsg || 'Error al procesar la solicitud.';
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
                description: 'Conectando con el banco y validando datos...', 
                placement: 'topRight',
                key: 'pago_proc', 
                duration: 0 
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
                description: 'Tu reserva ha sido confirmada y la factura generada correctamente.',
                placement: 'topRight',
                key: 'pago_proc', 
                duration: 5 
            });

            setModalPagoVisible(false);
            setReservaAPagar(null);
            cargarDatos();

        } catch (error) {
            api.error({ 
                message: 'Pago Fallido', 
                description: getErrorMessage(error), 
                placement: 'topRight',
                key: 'pago_proc', 
                duration: 8 
            });
        } finally {
            setProcesandoPago(false);
        }
    };

    const handleEliminar = async (id) => {
        try { 
            await dispatch(deleteReservaThunk(id)).unwrap(); 
            api.success({
                message: 'Reserva Cancelada',
                description: 'La reserva ha sido cancelada exitosamente.',
                placement: 'topRight',
                duration: 3,
            });
            cargarDatos(); 
        } catch (error) { 
            api.error({
                message: 'Error al Cancelar',
                description: getErrorMessage(error), 
                placement: 'topRight',
                duration: 4,
            });
        }
    };
    
    // 🆕 FUNCIÓN PARA EDITAR RESERVA
    const handleEditarReserva = async (id, dto) => {
        try {
            await dispatch(updateReservaThunk({ id, body: dto })).unwrap();
            
            api.success({
                message: 'Reserva Actualizada',
                description: `La reserva #${id} ha sido modificada.`,
                placement: 'topRight',
                duration: 3,
            });
            cargarDatos();
            return true;
        } catch (error) {
            api.error({
                message: 'Error al Actualizar Reserva',
                description: getErrorMessage(error),
                placement: 'topRight',
                duration: 4,
            });
            return false;
        }
    };


    const handleVerFacturas = async (idReserva, idUsuarioParam) => {
        try {
            const idBusqueda = esAdministrador ? (idUsuarioParam || idUsuarioSesion) : idUsuarioSesion;
            const resp = await dispatch(fetchFacturasByUsuarioThunk(idBusqueda)).unwrap();

            const filtradas = Array.isArray(resp) 
                ? resp.filter(f => f.IdReserva === idReserva) 
                : [];

            setListaFacturas(filtradas);
            setModalFacturasVisible(true);
        } catch (error) {
            api.error({
                message: 'Error al Cargar Facturas',
                description: getErrorMessage(error), 
                placement: 'topRight',
                duration: 4,
            });
            console.error(error);
        }
    };

    const handleCrearReservaAdmin = async (dto) => {
        try {
            await dispatch(createReservaThunk(dto)).unwrap();
            api.success({
                message: 'Reserva Creada',
                description: 'La reserva ha sido creada exitosamente (Estado: Pendiente).',
                placement: 'topRight',
                duration: 3,
            });
            cargarDatos();
            return true;
        } catch(error) {
            api.error({
                message: 'Error al Crear Reserva',
                description: getErrorMessage(error),
                placement: 'topRight',
                duration: 4,
            });
            return false;
        }
    };
    
    // Función auxiliar para abrir la factura HTML (Mantener)
    const abrirFacturaHTML = (idFactura) => {
        const ventana = window.open('', '_blank');
        ventana.document.write('<html><body><p>Cargando factura...</p></body></html>');
        
        fetch(`/factura/ver?id=${idFactura}`)
            .then(res => res.text())
            .then(html => {
                ventana.document.open();
                ventana.document.write(html);
                ventana.document.close();
            })
            .catch(err => {
                ventana.document.write('<p>Error al cargar la factura</p>');
            });
    };

    const handleCambiarEstado = async (id, estado, registro) => {
        try {
            await dispatch(updateEstadoReservaThunk({id, estado})).unwrap();
            
            // Lógica para liberar el vehículo
            if(estado === 'Finalizada' || estado === 'Rechazada' || estado === 'Cancelada') {
                const v = await dispatch(fetchVehiculoById(registro.IdVehiculo)).unwrap();
                if(v) await dispatch(updateVehiculoThunk({id: v.IdVehiculo, body: {...v, Estado: 'Disponible'}})).unwrap();
            }
            
            api.success({
                message: 'Estado Actualizado',
                description: `El estado de la reserva ha sido cambiado a: ${estado}`,
                placement: 'topRight',
                duration: 3,
            });
            
            cargarDatos();
            return true;
        } catch (error) { 
            api.error({
                message: 'Error al Cambiar Estado',
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
                onEditarReserva={handleEditarReserva} 
                usuarios={usuarios}
                vehiculos={vehiculos}
            />

            {/* Modal de Facturas */}
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
                        { 
                            title: 'Factura', 
                            dataIndex: 'IdFactura', 
                            render: (idFactura) => (
                                <Button 
                                    type="primary" 
                                    icon={<FilePdfOutlined />}
                                    onClick={() => window.open(`/factura/ver?id=${idFactura}`, '_blank')}
                                >
                                    Ver Factura
                                </Button>
                            )
                        }
                    ]}
                />
            </Modal>

            {/* Modal de Pago */}
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
                                <Form.Item name="cuentaUsuario" label="Tu Cuenta" rules={[{ required: true, message: 'Requerido' }]}>
                                    <Input placeholder="Ej: 1720..." />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
        {/* Usamos un div con la misma altura de Form.Item */}
        <div style={{ marginBottom: 24 }}> 
            <label className="ant-form-item-required">Cuenta Destino</label>
            <p style={{ fontWeight: 'bold', margin: '4px 0 0 0' }}>
                {/* Muestra el nombre legible */}
                {NOMBRE_CUENTA_EMPRESA} 
            </p>
            <Text type="secondary" style={{ fontSize: '12px' }}>
                {/* Muestra el número real para referencia
                Nro. Cuenta: {CUENTA_EMPRESA} */}
            </Text>
        </div>
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