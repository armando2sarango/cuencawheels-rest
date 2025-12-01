import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { notification, Modal, DatePicker, Input, Form, Row, Col, Divider, Tag, Button } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import CarritoView from './carritoView'; 
import { fetchCarritos, deleteCarritoThunk } from '../../store/carrito/thunks'; 
import { createReservaThunk } from '../../store/reservas/thunks';
import { createFacturaThunk } from '../../store/facturas/thunks';
import { updateVehiculoThunk, fetchVehiculoById } from '../../store/autos/thunks';
import { getCarritoId, getUserId } from '../../services/auth'; 

const { RangePicker } = DatePicker;
const CarritoPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items = [], loading = false, error = null } = useSelector((state) => state.carritos || {}); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [fechasSeleccionadas, setFechasSeleccionadas] = useState([]);
  const [totalCalculado, setTotalCalculado] = useState(0);
  const [diasRenta, setDiasRenta] = useState(0);
  const [detallesVisible, setDetallesVisible] = useState(false);
  const [vehiculoDetalle, setVehiculoDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  
  const CUENTA_EMPRESA = "1756177158"; 
  
  const [formPago] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    cargarCarrito(); 
  }, []);

useEffect(() => {
  if (
    fechasSeleccionadas &&
    fechasSeleccionadas.length === 2 &&
    fechasSeleccionadas[0] &&
    fechasSeleccionadas[1]
  ) {
    const dias = fechasSeleccionadas[1].diff(fechasSeleccionadas[0], 'day');
    const diasReales = dias > 0 ? dias : 1;
    setDiasRenta(diasReales);

    const totalSinIva = items.reduce((acc, item) => {
      const precioDia = item.PrecioPorDia || item.PrecioDia || 0;
      return acc + precioDia * diasReales;
    }, 0);

    setTotalCalculado(totalSinIva); 

  } else {
    setDiasRenta(0);
    setTotalCalculado(0);
  }
}, [fechasSeleccionadas, items]);

  const cargarCarrito = () => {
    const idCarritoStorage = getCarritoId();
    if (idCarritoStorage) {
      dispatch(fetchCarritos(idCarritoStorage));
    }
  };

  const handleEliminar = async (idItem) => {
    try {
      await dispatch(deleteCarritoThunk(idItem)).unwrap();
      api.success({ message: 'Eliminado', description: 'Vehículo removido del carrito.' });
      cargarCarrito();
    } catch (error) {
      api.error({ message: 'Error', description: 'No se pudo eliminar.' });
    }
  };
  const verDetalles = async (idVehiculo) => {
    setCargandoDetalle(true);
    setDetallesVisible(true);
    
    try {
      const vehiculo = await dispatch(fetchVehiculoById(idVehiculo)).unwrap();
      setVehiculoDetalle(vehiculo);
    } catch (error) {
      api.error({ 
        message: 'Error', 
        description: 'No se pudo cargar la información del vehículo.' 
      });
      setDetallesVisible(false);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalles = () => {
    setDetallesVisible(false);
    setVehiculoDetalle(null);
  };
  const abrirModalReserva = () => {
    const idUsuario = getUserId();
    
    if (!idUsuario) {
      api.warning({ message: 'Inicia sesión', description: 'Debes estar logueado para reservar.' });
      return;
    }
    
    if (items.length === 0) {
      api.info({ message: 'Carrito vacío', description: 'Agrega autos primero.' });
      return;
    }
    
    formPago.resetFields();
    formPago.setFieldsValue({
        cuentaEmpresa: CUENTA_EMPRESA,
        cuentaUsuario: ''
    });
    setFechasSeleccionadas([]);
    setTotalCalculado(0);
    setDiasRenta(0);
    setIsModalOpen(true);
  };
  const confirmarPagoYReserva = async () => {
    try {
        const values = await formPago.validateFields();
        const [inicio, fin] = values.fechas;
        
        const idUsuario = getUserId();
        setProcesandoPago(true);

        api.info({ 
            key: 'pago_process',
            message: '🏦 Procesando Pago...', 
            description: 'Conectando con el sistema bancario y verificando fondos...',
            duration: 0 
        });

        let errores = [];
        let exitosos = 0;

        for (const item of items) {
            try {
                const dias = fin.diff(inicio, 'day');
                const diasReales = dias > 0 ? dias : 1;
                const precioDia = item.PrecioPorDia || item.PrecioDia || 0;
                const totalItem = precioDia * diasReales;
                const payloadReserva = {
                    IdUsuario: parseInt(idUsuario),
                    IdVehiculo: item.IdVehiculo,
                    FechaInicio: inicio.format('YYYY-MM-DDTHH:mm:ss'),
                    FechaFin: fin.format('YYYY-MM-DDTHH:mm:ss'),
                    Total: totalItem * 1.15,

                    Estado: "Confirmada"
                };
                const respuestaReserva = await dispatch(createReservaThunk(payloadReserva)).unwrap();
                const idReservaCreada = respuestaReserva?.reserva?.IdReserva || 
                                       respuestaReserva?.idReserva || 
                                       respuestaReserva?.IdReserva;
                
                const totalCobrado = respuestaReserva?.reserva?.Total || totalItem;

                if (!idReservaCreada) {
                    throw new Error('No se pudo obtener el ID de la reserva creada');
                }
                const payloadFactura = {
                    IdReserva: idReservaCreada,
                    ValorTotal: totalCobrado
                };

                await dispatch(createFacturaThunk(payloadFactura)).unwrap();

                
                let vehiculoCompleto;
                try {
                    vehiculoCompleto = await dispatch(fetchVehiculoById(item.IdVehiculo)).unwrap();
                } catch (errorGet) {
                    throw new Error('No se pudo obtener la información del vehículo');
                }

                const payloadVehiculo = {
                    IdVehiculo: vehiculoCompleto.IdVehiculo || item.IdVehiculo,
                    Marca: vehiculoCompleto.Marca,
                    Modelo: vehiculoCompleto.Modelo,
                    Anio: vehiculoCompleto.Anio || vehiculoCompleto.Año,
                    IdCategoria: vehiculoCompleto.IdCategoria,
                    IdTransmision: vehiculoCompleto.IdTransmision,
                    Capacidad: vehiculoCompleto.Capacidad,
                    PrecioDia: vehiculoCompleto.PrecioDia || vehiculoCompleto.PrecioPorDia,
                    Estado: "Rentado", 
                    Descripcion: vehiculoCompleto.Descripcion,
                    IdSucursal: vehiculoCompleto.IdSucursal
                };
                await dispatch(updateVehiculoThunk({ id: item.IdVehiculo,body: payloadVehiculo })).unwrap();
                await dispatch(deleteCarritoThunk(item.IdItem)).unwrap();     
                exitosos++;
            } catch (err) {      
                let mensajeError = 'Error desconocido';               
                if (err?.message) {
                    mensajeError = err.message;
                } 
                else if (typeof err === 'string') {
                    mensajeError = err;
                }
                else if (err?.error) {
                    if (typeof err.error === 'string') {
                        mensajeError = err.error;
                    } else if (err.error?.message || err.error?.Message) {
                        mensajeError = err.error.message || err.error.Message;
                    }
                }
                else if (err?.response?.data) {
                    if (typeof err.response.data === 'string') {
                        mensajeError = err.response.data;
                    } else {
                        mensajeError = err.response.data.message || 
                                      err.response.data.Message || 
                                      'Error en el servidor';
                    }
                }
                else if (err?.data) {
                    if (typeof err.data === 'string') {
                        mensajeError = err.data;
                    } else {
                        mensajeError = err.data.message || 
                                      err.data.Message || 
                                      'Error en el servidor';
                    }
                }
                
                const nombreVehiculo = item.VehiculoNombre || item.Nombre || 'Vehículo';
                errores.push(`${nombreVehiculo}: ${mensajeError}`);
            }
        }

        api.destroy('pago_process');
        setProcesandoPago(false);
        if (errores.length > 0 && exitosos === 0) {
            api.error({
                message: ' Error en el Pago',
                description: (
                    <div>
                        <p><strong>No se pudo completar ninguna reserva:</strong></p>
                        <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                            {errores.map((e, i) => (
                                <li key={i} style={{ fontSize: '13px', color: '#ff4d4f', marginBottom: '5px' }}>
                                    {e}
                                </li>
                            ))}
                        </ul>
                        <p style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
                            Por favor verifica tu saldo o la información bancaria.
                        </p>
                    </div>
                ),
                duration: 10
            });
        } else if (errores.length > 0 && exitosos > 0) {
            api.warning({
                message: '⚠️ Proceso Completado con Alertas',
                description: (
                    <div>
                        <p> Se reservaron <strong>{exitosos}</strong> vehículo(s) correctamente.</p>
                        <p style={{color: '#ff4d4f', fontWeight: 'bold', marginTop: '10px'}}>
                             Fallaron {errores.length}:
                        </p>
                        <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                            {errores.map((e, i) => (
                                <li key={i} style={{ fontSize: '12px', marginBottom: '3px' }}>
                                    {e}
                                </li>
                            ))}
                        </ul>
                    </div>
                ),
                duration: 10
            });
            setIsModalOpen(false);
            setTimeout(() => navigate('/reservas'), 2000);
        } else {
            api.success({ 
                message: '🎉 ¡Pago y Reserva Exitosos!', 
                description: `Se han generado ${exitosos} reserva(s) y factura(s). Los vehículos están rentados. Redirigiendo...`,
                duration: 5
            });
            setIsModalOpen(false);
            setTimeout(() => navigate('/reservas'), 2000);
        }
        
        cargarCarrito();

    } catch (err) {
        api.error({
            message: 'Formulario incompleto',
            description: 'Por favor completa todos los campos requeridos.'
        });
        setProcesandoPago(false);
    }
  };

  return (
    <>
      {contextHolder}
      
      <CarritoView 
        items={items} 
        loading={loading} 
        error={error} 
        onEliminar={handleEliminar} 
        onReservar={abrirModalReserva}
        onVerDetalles={verDetalles}
      />

      {/* --- MODAL DE DETALLES DEL VEHÍCULO --- */}
      <Modal
        title={`Detalles - ${vehiculoDetalle?.Marca || ''} ${vehiculoDetalle?.Modelo || ''}`}
        open={detallesVisible}
        onCancel={cerrarDetalles}
        footer={[
          <Button key="close" onClick={cerrarDetalles}>Cerrar</Button>
        ]}
        width={700}
      >
        {cargandoDetalle ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #1890ff',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>Cargando información del vehículo...</p>
          </div>
        ) : vehiculoDetalle && (
          <div>
            {vehiculoDetalle.UrlImagen && (
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img
                  src={vehiculoDetalle.UrlImagen}
                  alt={`${vehiculoDetalle.Marca} ${vehiculoDetalle.Modelo}`}
                  style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Sin+Imagen'; }}
                />
              </div>
            )}

            <Row gutter={16}>
              <Col span={12}>
                <h4>Información Básica</h4>
                <p><strong>Marca:</strong> {vehiculoDetalle.Marca || 'N/A'}</p>
                <p><strong>Modelo:</strong> {vehiculoDetalle.Modelo || 'N/A'}</p>
                <p><strong>Año:</strong> {vehiculoDetalle.Anio || vehiculoDetalle.Año || 'N/A'}</p>
                <p><strong>Matrícula:</strong> {vehiculoDetalle.Matricula || 'N/A'}</p>
              </Col>

              <Col span={12}>
                <h4>Especificaciones</h4>
                <p><strong>Categoría:</strong> {vehiculoDetalle.CategoriaNombre || 'N/A'}</p>
                <p><strong>Transmisión:</strong> {vehiculoDetalle.TransmisionNombre || 'N/A'}</p>
                <p><strong>Capacidad:</strong> {vehiculoDetalle.Capacidad ? `${vehiculoDetalle.Capacidad} pasajeros` : 'N/A'}</p>
                <p>
                  <strong>Estado:</strong> 
                  <Tag color={vehiculoDetalle.Estado === "Disponible" ? "green" : "red"} style={{ marginLeft: 8 }}>
                    {vehiculoDetalle.Estado || 'N/A'}
                  </Tag>
                </p>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <h4>Precios</h4>
                <p><strong>Precio/día:</strong> ${vehiculoDetalle.PrecioDia ? parseFloat(vehiculoDetalle.PrecioDia).toFixed(2) : '0.00'}</p>
                {vehiculoDetalle.PorcentajeDescuento && vehiculoDetalle.PorcentajeDescuento > 0 && (
                  <p><strong>Descuento:</strong> {vehiculoDetalle.PorcentajeDescuento}%</p>
                )}
              </Col>

              <Col span={12}>
                <h4>Ubicación</h4>
                <p><strong>Sucursal:</strong> {vehiculoDetalle.SucursalNombre || (vehiculoDetalle.IdSucursal ? `ID: ${vehiculoDetalle.IdSucursal}` : 'N/A')}</p>
              </Col>
            </Row>

            {vehiculoDetalle.Descripcion && (
              <div style={{ marginTop: '16px' }}>
                <h4>Descripción</h4>
                <p>{vehiculoDetalle.Descripcion}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
      <Modal
        title={
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            💳 Finalizar Reserva y Pagar
          </div>
        }
        open={isModalOpen}
        onOk={confirmarPagoYReserva}
        onCancel={() => !procesandoPago && setIsModalOpen(false)}
        okText={procesandoPago ? "⏳ Procesando Transacción..." : `Pagar $${(totalCalculado*1.15).toFixed(2)}`}
        cancelText="Cancelar"
        confirmLoading={procesandoPago}
        closable={!procesandoPago}
        maskClosable={!procesandoPago}
        width={650}
        okButtonProps={{ 
          disabled: !fechasSeleccionadas.length || !totalCalculado,
          size: 'large',
          style: { height: '45px', fontSize: '16px' }
        }}
        cancelButtonProps={{ size: 'large' }}
      >
        <Form form={formPago} layout="vertical">
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              padding: '20px', 
              borderRadius: '12px', 
              marginBottom: '20px',
              color: 'white'
            }}>
                <h4 style={{ margin: '0 0 15px 0', color: 'white', fontSize: '16px' }}>
                  📅 1. Periodo de Renta
                </h4>
                <Form.Item 
                    name="fechas" 
                    label={<span style={{ color: 'white' }}>¿Cuándo usarás los vehículos?</span>}
                    rules={[{ required: true, message: 'Selecciona las fechas de inicio y fin' }]}
                >
                    <RangePicker 
                        style={{ width: '100%' }} 
                        minDate={dayjs()} 
                        onChange={(dates) => setFechasSeleccionadas(dates)}
                        format="DD/MM/YYYY"
                        size="large"
                    />
                </Form.Item>
                {diasRenta > 0 && (
                    <div style={{ 
                      background: 'rgba(255,255,255,0.2)', 
                      padding: '10px 15px', 
                      borderRadius: '8px',
                      marginTop: '10px'
                    }}>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px' }}>
                        ⏱️ Duración: {diasRenta} día{diasRenta !== 1 ? 's' : ''}
                      </p>
                    </div>
                )}
            </div>
{totalCalculado > 0 && (() => {
  const subtotalSinIva = totalCalculado;
  const ivaCalculado = subtotalSinIva * 0.15;
  const totalConIva = subtotalSinIva + ivaCalculado;
  
  return (
    <div>
      {items.map((item, index) => {
        const precioDia = item.PrecioPorDia || item.PrecioDia || 0;
        const subtotalItem = precioDia * diasRenta;
        return (
          <div key={index}>
            <span>{item.VehiculoNombre} × {diasRenta} días</span>
            <span>${(subtotalItem * 1.15).toFixed(2)}</span>

          </div>
        );
      })}
      
      <Divider />
      <div>
        <span>Subtotal (sin IVA):</span>
        <span>${subtotalSinIva.toFixed(2)}</span>
      </div>
      <div style={{ color: '#fa8c16' }}>
        <span>IVA (15%):</span>
        <span>+${ivaCalculado.toFixed(2)}</span>
      </div>
      
      <Divider />
      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
        <span>TOTAL A PAGAR:</span>
        <span style={{ color: '#52c41a' }}>${totalConIva.toFixed(2)}</span>
      </div>
    </div>
  );
})()}
            <div style={{ 
              background: '#f6ffed', 
              padding: '20px', 
              borderRadius: '12px', 
              border: '2px solid #b7eb8f' 
            }}>
                <h4 style={{ marginTop: 0, color: '#52c41a', fontSize: '16px' }}>
                  🏦 2. Información de Pago
                </h4>
                
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item 
                            name="cuentaUsuario" 
                            label="Tu Cédula / Cuenta"
                            rules={[{ 
                              required: true, 
                              message: 'Ingresa tu cédula' 
                            }]}
                            tooltip="La cédula asociada a tu cuenta bancaria"
                        >
                            <Input 
                              placeholder="Ej: 1720123456" 
                              size="large"
                              maxLength={10}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item 
                            name="cuentaEmpresa" 
                            label="Cuenta Destino"
                            tooltip="Cuenta de la empresa (no editable)"
                        >
                            <Input 
                              disabled 
                              size="large"
                              style={{ 
                                color: '#333', 
                                fontWeight: 'bold', 
                                backgroundColor: '#f5f5f5',
                                cursor: 'not-allowed'
                              }} 
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </div>

        </Form>
      </Modal>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default CarritoPage;