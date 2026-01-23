import React, { useEffect, useState,useCallback  } from 'react'; 
import { useDispatch, useSelector } from 'react-redux';
import { notification, Modal, Button, Table,Empty, Typography, Form, Input, Row, Col } from 'antd'; 
import { FilePdfOutlined} from '@ant-design/icons';
import ReservasView from './ReservasView'; 
import { fetchReservas, fetchReservasIdUsuario, deleteReservaThunk, updateEstadoReservaThunk, createReservaThunk, updateReservaThunk,createHoldThunk  } from '../../store/reservas/thunks';
import { createFacturaThunk, fetchFacturas } from '../../store/facturas/thunks';
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
}, [esAdministrador, dispatch, cargarDatos]);


const cargarDatos = useCallback(() => {
    if (esAdministrador) {
        dispatch(fetchReservas());
    } else if (idUsuarioSesion) {
        dispatch(fetchReservasIdUsuario(idUsuarioSesion));
    }
}, [dispatch, esAdministrador, idUsuarioSesion]);


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
            Metodo: "Transferencia",
            Monto: parseFloat(reservaAPagar.Total),
            FechaPago: new Date().toISOString(),
            ReferenciaExterna: `REF-${Date.now()}`,
            Estado: "Procesado",
            CuentaCliente: values.cuentaUsuario,
            CuentaComercio: CUENTA_EMPRESA
        };

        console.log('📤 Enviando pago:', payloadPago);

        // 🔵 PASO 1: Crear el pago
        await dispatch(createPagoThunk(payloadPago)).unwrap();
        console.log('✅ Pago creado exitosamente');
        
        // 🔵 PASO 2: Cambiar estado de la reserva a "Confirmada"
        try {
            await dispatch(updateEstadoReservaThunk({
                id: reservaAPagar.IdReserva, 
                estado: 'Confirmada'
            })).unwrap();
            console.log('✅ Estado de reserva cambiado a Confirmada');
        } catch (errEstado) {
            console.error("Error actualizando estado de reserva:", errEstado);
            throw new Error('No se pudo confirmar la reserva');
        }

        // 🔵 PASO 3: Crear la factura
// 🔵 PASO 3: Crear la factura
try {
    const fechaActual = new Date().toISOString();
    const dias = dayjs(reservaAPagar.FechaFin).diff(dayjs(reservaAPagar.FechaInicio), 'day') || 1;
    const subtotalSinIva = reservaAPagar.Total / 1.15;
    const iva = reservaAPagar.Total - subtotalSinIva;
    
    const facturaData = {
        IdReserva: reservaAPagar.IdReserva,
        IdUsuario: reservaAPagar.IdUsuario || parseInt(idUsuarioSesion),
        UriFactura: "",
        FechaEmision: fechaActual,
        ValorTotal: parseFloat(reservaAPagar.Total),
        Descripcion: `Renta de vehículo ${reservaAPagar.VehiculoNombre || reservaAPagar.Marca} por ${dias} día(s)`,
        Detalles: [
            {
                IdDetalle: 0,
                IdFactura: 0,
                Descripcion: `Renta ${reservaAPagar.VehiculoNombre || reservaAPagar.Marca} (${dayjs(reservaAPagar.FechaInicio).format('DD/MM/YYYY')} - ${dayjs(reservaAPagar.FechaFin).format('DD/MM/YYYY')})`,
                Cantidad: dias,
                PrecioUnitario: parseFloat(subtotalSinIva / dias),
                Subtotal: parseFloat(subtotalSinIva)
            },
            {
                IdDetalle: 0,
                IdFactura: 0,
                Descripcion: "IVA 15%",
                Cantidad: 1,
                PrecioUnitario: parseFloat(iva),
                Subtotal: parseFloat(iva)
            }
        ]
    };

    console.log('📤 Creando factura:', facturaData);
    const facturaCreada = await dispatch(createFacturaThunk(facturaData)).unwrap();
    console.log('✅ Factura creada:', facturaCreada);
    
    // 🆕 Guardar el IdFactura en la reserva para referencia futura
    const idFactura = facturaCreada?.IdFactura || facturaCreada?.idFactura;
    if (idFactura) {
        console.log('✅ IdFactura guardado:', idFactura);
        // Opcional: Podrías actualizar la reserva con el IdFactura si tu backend lo soporta
    }
        } catch (errFactura) {
            console.error("Error creando factura:", errFactura);
            // No lanzamos error porque el pago ya se procesó
            api.warning({
                message: 'Factura Pendiente',
                description: 'El pago se procesó correctamente, pero hubo un problema generando la factura. Contacta a soporte.',
                placement: 'topRight',
                duration: 6,
            });
        }

        // 🔵 PASO 4: Actualizar vehículo a "Rentado"
        try {
            const vehiculoCompleto = await dispatch(fetchVehiculoById(reservaAPagar.IdVehiculo)).unwrap();
            if (vehiculoCompleto) {
                await dispatch(updateVehiculoThunk({ 
                    id: reservaAPagar.IdVehiculo, 
                    body: { ...vehiculoCompleto, Estado: 'Rentado' } 
                })).unwrap();
                console.log('✅ Vehículo actualizado a Rentado');
            }
        } catch (errVeh) {
            console.error("Error actualizando vehículo:", errVeh);
        }

        api.success({ 
            message: '¡Pago Exitoso!', 
            description: 'Tu reserva ha sido confirmada y la factura se ha generado correctamente.',
            placement: 'topRight',
            key: 'pago_proc', 
            duration: 5 
        });

        setModalPagoVisible(false);
        setReservaAPagar(null);
        cargarDatos();

    } catch (error) {
        console.error('❌ Error en pago:', error);
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
        const todasLasFacturas = await dispatch(fetchFacturas()).unwrap();
        console.log('🔍 Todas las facturas recibidas:', todasLasFacturas);
        
        const filtradas = Array.isArray(todasLasFacturas) 
            ? todasLasFacturas.filter(f => f.IdReserva === idReserva) 
            : [];
        
        console.log('🔍 Facturas filtradas para reserva', idReserva, ':', filtradas);

        if (filtradas.length === 0) {
            api.warning({
                message: 'Sin Facturas',
                description: 'No se encontraron facturas para esta reserva.',
                placement: 'topRight',
                duration: 3,
            });
            return;
        }

        setListaFacturas(filtradas);
        setModalFacturasVisible(true);
        
    } catch (error) {
        api.error({
            message: 'Error al Cargar Facturas',
            description: getErrorMessage(error), 
            placement: 'topRight',
            duration: 4,
        });
        console.error('❌ Error cargando facturas:', error);
    }
};

const handleCrearReservaAdmin = async (dto) => {
    try {
        // PASO 1: Crear el HOLD
        const holdData = {
            IdUsuario: dto.IdUsuario,
            IdVehiculo: dto.IdVehiculo,
            FechaInicio: dto.FechaInicio,
            FechaFin: dto.FechaFin,
            HoldSegundos: 300
        };

        api.info({ 
            message: 'Procesando...', 
            description: 'Bloqueando vehículo...', 
            placement: 'topRight',
            key: 'creando_reserva', 
            duration: 0 
        });

        const holdResult = await dispatch(createHoldThunk(holdData)).unwrap();
        console.log('✅ Hold creado:', holdResult);

        // 🔵 PASO 2: Extraer idHold (minúscula como viene del backend)
        const idHold = holdResult.idHold || holdResult.IdHold;
        
        if (!idHold) {
            throw new Error('No se pudo obtener el IdHold del bloqueo');
        }

        console.log('✅ IdHold extraído:', idHold);

        // PASO 3: Crear la RESERVA
        const reservaData = {
            IdHold: idHold  // El backend espera IdHold (mayúscula) en el request
        };

        console.log('📤 Enviando reservaData:', reservaData);
        await dispatch(createReservaThunk(reservaData)).unwrap();

        api.success({
            message: 'Reserva Creada',
            description: 'La reserva ha sido creada exitosamente (Estado: Pendiente).',
            placement: 'topRight',
            key: 'creando_reserva',
            duration: 3,
        });

        cargarDatos();
        return true;

    } catch(error) {
        console.error('❌ Error:', error);
        
        api.error({
            message: 'Error al Crear Reserva',
            description: getErrorMessage(error),
            placement: 'topRight',
            key: 'creando_reserva',
            duration: 5,
        });
        return false;
    }
};

const handleCambiarEstado = async (id, estado, registro) => {
    try {
        await dispatch(updateEstadoReservaThunk({id, estado})).unwrap();
        
        // Lógica para liberar el vehículo
        if(estado === 'Finalizada' || estado === 'Rechazada' || estado === 'Cancelada') {
            try {
                const v = await dispatch(fetchVehiculoById(registro.IdVehiculo)).unwrap();
                console.log('🔍 Vehículo obtenido:', v);
                
                if(v) {
                    // 🔵 CORRECCIÓN: Usar minúscula idVehiculo
                    const idVeh = v.idVehiculo || v.IdVehiculo;
                    
                    await dispatch(updateVehiculoThunk({
                        id: idVeh, 
                        body: {...v, estado: 'Disponible'} // 🔵 También minúscula en estado
                    })).unwrap();
                    
                    console.log('✅ Vehículo liberado correctamente');
                }
            } catch (errVeh) {
                console.error('❌ Error liberando vehículo:', errVeh);
                // No lanzamos error porque el estado de la reserva ya cambió
                api.warning({
                    message: 'Vehículo No Liberado',
                    description: 'El estado de la reserva cambió, pero no se pudo liberar el vehículo automáticamente.',
                    placement: 'topRight',
                    duration: 4,
                });
            }
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
            { 
                title: 'Fecha', 
                dataIndex: 'FechaEmision', 
                render: (f) => f ? dayjs(f).format('DD/MM/YYYY HH:mm') : 'N/A'
            },
            { 
                title: 'Monto', 
                dataIndex: 'ValorTotal', 
                render: (v) => `$${parseFloat(v || 0).toFixed(2)}`
            },
            { 
                title: 'Factura', 
                key: 'factura',
                render: (_, record) => {
                    console.log('🔍 Record de factura:', record);
                    
                    const urlFactura = record.UriFactura || record.uriFactura;
                    
                    if (!urlFactura) {
                        return <span style={{ color: '#999' }}>⏳ Generando...</span>;
                    }
                    
                    return (
                        <Button 
                            type="primary" 
                            icon={<FilePdfOutlined />}
                            onClick={() => window.open(urlFactura, '_blank')}
                            style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
                        >
                            Ver PDF
                        </Button>
                    );
                }
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