import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { notification, Modal, DatePicker, Form, Divider, Button,Row, Col } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import CarritoView from './carritoView'; 
import { fetchCarritos, deleteCarritoThunk } from '../../store/carrito/thunks'; 
import { createReservaThunk } from '../../store/reservas/thunks';
import { getCarritoId, getUserId } from '../../services/auth'; 
import { fetchVehiculoById } from '../../store/autos/thunks'; // Solo para ver detalles visuales si quieres

const { RangePicker } = DatePicker;

const CarritoPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items = [], loading = false, error = null } = useSelector((state) => state.carritos || {}); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [fechasSeleccionadas, setFechasSeleccionadas] = useState([]);
  const [totalCalculado, setTotalCalculado] = useState(0);
  const [diasRenta, setDiasRenta] = useState(0);
  const [detallesVisible, setDetallesVisible] = useState(false);
  const [vehiculoDetalle, setVehiculoDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  
  const [formFechas] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const IVA_PORCENTAJE = 0.15;

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
      if (vehiculoSeleccionado?.IdItem === idItem) {
        setVehiculoSeleccionado(null);
      }
      api.success({ message: 'Eliminado', description: 'Vehículo removido del carrito.' });
      cargarCarrito();
    } catch (error) {
      api.error({ message: 'Error', description: 'No se pudo eliminar.' });
    }
  };

  const handleSeleccionarVehiculo = (item) => {
    if (vehiculoSeleccionado?.IdItem === item.IdItem) {
      setVehiculoSeleccionado(null);
    } else {
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
      api.error({ message: 'Error', description: 'No se pudo cargar la información.' });
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

    if (!vehiculoSeleccionado) {
      api.warning({ 
        message: '⚠️ Selecciona un vehículo', 
        description: 'Marca la casilla del vehículo que deseas reservar.',
        duration: 4
      });
      return;
    }
    
    formFechas.resetFields();
    setFechasSeleccionadas([]);
    setTotalCalculado(0);
    setDiasRenta(0);
    setIsModalOpen(true);
  };

  const confirmarReserva = async () => {
    try {
        const values = await formFechas.validateFields();
        const [inicio, fin] = values.fechas;
        const idUsuario = getUserId();
        
        setProcesando(true);

        try {

          
            const payloadReserva = {
                IdUsuario: parseInt(idUsuario),
                IdVehiculo: vehiculoSeleccionado.IdVehiculo,
                FechaInicio: inicio.format('YYYY-MM-DDTHH:mm:ss'),
                FechaFin: fin.format('YYYY-MM-DDTHH:mm:ss'),

            };

            await dispatch(createReservaThunk(payloadReserva)).unwrap();

            await dispatch(deleteCarritoThunk(vehiculoSeleccionado.IdItem)).unwrap();
            
            api.success({ 
                message: '✅ Reserva Creada', 
                description: `Tu reserva está PENDIENTE. Ve a "Mis Reservas" para realizar el pago y confirmarla.`,
                duration: 6
            });

            setIsModalOpen(false);
            setVehiculoSeleccionado(null);
            setTimeout(() => navigate('/reservas'), 2000);

        } catch (err) {
            console.error('Error reservando:', err);
            
            let mensajeError = 'Error desconocido';
            if (err?.message) mensajeError = err.message;
            else if (typeof err === 'string') mensajeError = err;
            else if (err?.data?.Message) mensajeError = err.data.Message;
            
            api.error({
                message: 'No se pudo reservar',
                description: mensajeError, // "El vehículo ya está reservado", etc.
                duration: 6
            });
        }
        
        cargarCarrito();

    } catch (err) {
        // Error de validación del formulario
    } finally {
        setProcesando(false);
    }
  };

  const totalConIvaDisplay = totalCalculado * (1 + IVA_PORCENTAJE);

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

      {/* MODAL DE DETALLES */}
      <Modal
        title={`Detalles - ${vehiculoDetalle?.Marca || ''} ${vehiculoDetalle?.Modelo || ''}`}
        open={detallesVisible}
        onCancel={cerrarDetalles}
        footer={[<Button key="close" onClick={cerrarDetalles}>Cerrar</Button>]}
        width={700}
      >
        {cargandoDetalle ? <p>Cargando...</p> : vehiculoDetalle && (
          <div>
             {/* Renderizado simple de detalles */}
             <Row gutter={16}>
               <Col span={12}>
                  <p><strong>Marca:</strong> {vehiculoDetalle.Marca}</p>
                  <p><strong>Modelo:</strong> {vehiculoDetalle.Modelo}</p>
                  <p><strong>Precio/Día:</strong> ${vehiculoDetalle.PrecioDia}</p>
               </Col>
               <Col span={12}>
                  <img src={vehiculoDetalle.UrlImagen} alt="auto" style={{width:'100%', borderRadius:8}}/>
               </Col>
             </Row>
             <p>{vehiculoDetalle.Descripcion}</p>
          </div>
        )}
      </Modal>

      {/* MODAL DE FECHAS (SOLO FECHAS) */}
      <Modal
        title={<div style={{ fontSize: '18px', fontWeight: 'bold' }}>📅 Confirmar Reserva</div>}
        open={isModalOpen}
        onOk={confirmarReserva}
        onCancel={() => !procesando && setIsModalOpen(false)}
        okText={procesando ? "Reservando..." : "Crear Reserva"}
        cancelText="Cancelar"
        confirmLoading={procesando}
        width={600}
        okButtonProps={{ disabled: !fechasSeleccionadas.length }}
      >
        <Form form={formFechas} layout="vertical">
            
            <div style={{ background: '#f0f5ff', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                <h4 style={{ marginTop: 0, color: '#1890ff' }}>Selecciona tus fechas</h4>
                <Form.Item 
                    name="fechas" 
                    label="Periodo de Renta" 
                    rules={[{ required: true, message: 'Requerido' }]}
                >
                    <RangePicker 
                        style={{ width: '100%' }} 
                        minDate={dayjs()} 
                        onChange={(dates) => setFechasSeleccionadas(dates)}
                        format="DD/MM/YYYY"
                        size="large"
                    />
                </Form.Item>
            </div>

            {/* RESUMEN VISUAL */}
            {vehiculoSeleccionado && totalCalculado > 0 && (
              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{vehiculoSeleccionado.VehiculoNombre} × {diasRenta} días</span>
                  <span>${totalCalculado.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fa8c16' }}>
                  <span>IVA (15%):</span>
                  <span>+${(totalCalculado * IVA_PORCENTAJE).toFixed(2)}</span>
                </div>
                <Divider style={{ margin: '10px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Total Estimado:</span>
                  <span style={{ color: '#52c41a' }}>${totalConIvaDisplay.toFixed(2)}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                   * La reserva se creará como <strong>PENDIENTE</strong>. Deberás realizar el pago posteriormente para confirmarla.
                </p>
              </div>
            )}
        </Form>
      </Modal>
    </>
  );
};

export default CarritoPage;