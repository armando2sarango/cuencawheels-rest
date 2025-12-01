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
  
  // NUEVO: Estado para el vehículo seleccionado
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  
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
      fechasSeleccionadas[1] &&
      vehiculoSeleccionado
    ) {
      const dias = fechasSeleccionadas[1].diff(fechasSeleccionadas[0], 'day');
      const diasReales = dias > 0 ? dias : 1;
      setDiasRenta(diasReales);

      // Calcular solo para el vehículo seleccionado
      const precioDia = vehiculoSeleccionado.PrecioPorDia || vehiculoSeleccionado.PrecioDia || 0;
      const totalSinIva = precioDia * diasReales;

      setTotalCalculado(totalSinIva); 

    } else {
      setDiasRenta(0);
      setTotalCalculado(0);
    }
  }, [fechasSeleccionadas, vehiculoSeleccionado]);

  const cargarCarrito = () => {
    const idCarritoStorage = getCarritoId();
    if (idCarritoStorage) {
      dispatch(fetchCarritos(idCarritoStorage));
    }
  };

  const handleEliminar = async (idItem) => {
    try {
      await dispatch(deleteCarritoThunk(idItem)).unwrap();
      
      // Si el eliminado era el seleccionado, limpiar selección
      if (vehiculoSeleccionado?.IdItem === idItem) {
        setVehiculoSeleccionado(null);
      }
      
      api.success({ message: 'Eliminado', description: 'Vehículo removido del carrito.' });
      cargarCarrito();
    } catch (error) {
      api.error({ message: 'Error', description: 'No se pudo eliminar.' });
    }
  };

  // NUEVO: Manejar selección de vehículo
  const handleSeleccionarVehiculo = (item) => {
    if (vehiculoSeleccionado?.IdItem === item.IdItem) {
      // Si ya está seleccionado, deseleccionar
      setVehiculoSeleccionado(null);
    } else {
      // Seleccionar este vehículo
      setVehiculoSeleccionado(item);
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

    // VALIDACIÓN: Debe haber un vehículo seleccionado
    if (!vehiculoSeleccionado) {
      api.warning({ 
        message: '⚠️ Selecciona un vehículo', 
        description: 'Por favor selecciona el vehículo que deseas reservar marcando el checkbox.',
        duration: 4
      });
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
        
        if (!vehiculoSeleccionado) {
          api.warning({ 
            message: 'No hay vehículo seleccionado', 
            description: 'Selecciona un vehículo antes de continuar.' 
          });
          return;
        }
        
        const idUsuario = getUserId();
        setProcesandoPago(true);

        api.info({ 
            key: 'pago_process',
            message: '🏦 Procesando Pago...', 
            description: 'Conectando con el sistema bancario y verificando fondos...',
            duration: 0 
        });

        try {
            const dias = fin.diff(inicio, 'day');
            const diasReales = dias > 0 ? dias : 1;
            const precioDia = vehiculoSeleccionado.PrecioPorDia || vehiculoSeleccionado.PrecioDia || 0;
            const totalItem = precioDia * diasReales;
            
            const payloadReserva = {
                IdUsuario: parseInt(idUsuario),
                IdVehiculo: vehiculoSeleccionado.IdVehiculo,
                FechaInicio: inicio.format('YYYY-MM-DDTHH:mm:ss'),
                FechaFin: fin.format('YYYY-MM-DDTHH:mm:ss'),
                Total: totalItem * 1.15,
                Estado: "Confirmada"
            };

            const respuestaReserva = await dispatch(createReservaThunk(payloadReserva)).unwrap();
            const idReservaCreada = respuestaReserva?.reserva?.IdReserva || 
                                   respuestaReserva?.idReserva || 
                                   respuestaReserva?.IdReserva;
            
            const totalCobrado = respuestaReserva?.reserva?.Total || (totalItem * 1.15);

            if (!idReservaCreada) {
                throw new Error('No se pudo obtener el ID de la reserva creada');
            }

            const payloadFactura = {
                IdReserva: idReservaCreada,
                ValorTotal: totalCobrado
            };

            await dispatch(createFacturaThunk(payloadFactura)).unwrap();

            const vehiculoCompleto = await dispatch(fetchVehiculoById(vehiculoSeleccionado.IdVehiculo)).unwrap();

            const payloadVehiculo = {
                IdVehiculo: vehiculoCompleto.IdVehiculo || vehiculoSeleccionado.IdVehiculo,
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

            await dispatch(updateVehiculoThunk({ 
              id: vehiculoSeleccionado.IdVehiculo,
              body: payloadVehiculo 
            })).unwrap();

            await dispatch(deleteCarritoThunk(vehiculoSeleccionado.IdItem)).unwrap();     

            api.destroy('pago_process');
            setProcesandoPago(false);

            api.success({ 
                message: '🎉 ¡Pago y Reserva Exitosos!', 
                description: `El vehículo ha sido reservado. Se generó la factura. Redirigiendo...`,
                duration: 5
            });

            setIsModalOpen(false);
            setVehiculoSeleccionado(null);
            setTimeout(() => navigate('/reservas'), 2000);

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

            api.destroy('pago_process');
            setProcesandoPago(false);

            api.error({
                message: '❌ Error en el Pago',
                description: mensajeError,
                duration: 8
            });
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
        vehiculoSeleccionado={vehiculoSeleccionado}
        onSeleccionarVehiculo={handleSeleccionarVehiculo}
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

      {/* --- MODAL DE PAGO --- */}
      <Modal
        title={
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            💳 Finalizar Reserva y Pagar
          </div>
        }
        open={isModalOpen}
        onOk={confirmarPagoYReserva}
        onCancel={() => !procesandoPago && setIsModalOpen(false)}
        okText={procesandoPago ? "⏳ Procesando Transacción..." : `💰 Pagar $${(totalCalculado*1.15).toFixed(2)}`}
        cancelText="Cancelar"
        confirmLoading={procesandoPago}
        closable={!procesandoPago}
        maskClosable={!procesandoPago}
        width={650}
        okButtonProps={{ 
          disabled: !fechasSeleccionadas.length || !totalCalculado || !vehiculoSeleccionado,
          size: 'large',
          style: { height: '45px', fontSize: '16px' }
        }}
        cancelButtonProps={{ size: 'large' }}
      >
        <Form form={formPago} layout="vertical">
            
            {/* INFORMACIÓN DEL VEHÍCULO SELECCIONADO */}
            {vehiculoSeleccionado && (
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                padding: '20px', 
                borderRadius: '12px', 
                marginBottom: '20px',
                color: 'white'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '16px' }}>
                  🚗 Vehículo Seleccionado
                </h4>
                <p style={{ margin: '5px 0', fontSize: '15px', fontWeight: 'bold' }}>
                  {vehiculoSeleccionado.VehiculoNombre || vehiculoSeleccionado.Nombre}
                </p>
                <p style={{ margin: '5px 0', fontSize: '13px' }}>
                  {vehiculoSeleccionado.Marca} {vehiculoSeleccionado.Modelo}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>Precio/día:</strong> ${parseFloat(vehiculoSeleccionado.PrecioPorDia || vehiculoSeleccionado.PrecioDia || 0).toFixed(2)}
                </p>
              </div>
            )}

            {/* SELECCIÓN DE FECHAS */}
            <div style={{ 
              background: '#f0f5ff', 
              padding: '20px', 
              borderRadius: '12px', 
              marginBottom: '20px'
            }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
                  📅 Periodo de Renta
                </h4>
                <Form.Item 
                    name="fechas" 
                    label="¿Cuándo usarás el vehículo?"
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
                      background: '#fff', 
                      padding: '10px 15px', 
                      borderRadius: '8px',
                      marginTop: '10px'
                    }}>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px', color: '#1890ff' }}>
                        ⏱️ Duración: {diasRenta} día{diasRenta !== 1 ? 's' : ''}
                      </p>
                    </div>
                )}
            </div>

            {/* RESUMEN DE COSTOS */}
            {totalCalculado > 0 && (() => {
              const subtotalSinIva = totalCalculado;
              const ivaCalculado = subtotalSinIva * 0.15;
              const totalConIva = subtotalSinIva + ivaCalculado;
              
              return (
                <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Subtotal (sin IVA):</span>
                    <span>${subtotalSinIva.toFixed(2)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#fa8c16' }}>
                    <span>IVA (15%):</span>
                    <span>+${ivaCalculado.toFixed(2)}</span>
                  </div>
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                    <span>TOTAL A PAGAR:</span>
                    <span style={{ color: '#52c41a' }}>${totalConIva.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}

            {/* DATOS BANCARIOS */}
            <div style={{ 
              background: '#f6ffed', 
              padding: '20px', 
              borderRadius: '12px', 
              border: '2px solid #b7eb8f' 
            }}>
                <h4 style={{ marginTop: 0, color: '#52c41a', fontSize: '16px' }}>
                  🏦 Información de Pago
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

                <div style={{ 
                  fontSize: '12px', 
                  color: '#595959', 
                  background: '#fff', 
                  padding: '12px', 
                  borderRadius: '8px',
                  border: '1px solid #d9d9d9'
                }}>
                    <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#52c41a', fontSize: '16px' }}>✓</span>
                      El sistema verificará saldo y disponibilidad automáticamente
                    </p>
                    <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#52c41a', fontSize: '16px' }}>✓</span>
                      Se generará una factura electrónica automáticamente
                    </p>
                    <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#52c41a', fontSize: '16px' }}>✓</span>
                      El vehículo quedará marcado como "Rentado"
                    </p>
                </div>
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