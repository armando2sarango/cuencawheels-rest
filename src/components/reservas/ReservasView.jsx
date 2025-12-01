import React, { useState } from 'react';
import { 
  Table, Card, Tag, Button, Space, Popconfirm, Tooltip, Typography, Empty, Modal, Form, Select, DatePicker, Input, Row, Col, Divider 
} from 'antd';
import {SyncOutlined,CarOutlined,FlagOutlined,DollarOutlined, PlusOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ReservasView = ({ 
  reservas = [], 
  loading, 
  esAdmin, 
  onCambiarEstado, 
  onRefresh,
  onVerPagos,
  onCrearReserva,
  usuarios = [],
  vehiculos = []
}) => {
  const [modalReservaVisible, setModalReservaVisible] = useState(false);
  const [modalPagoVisible, setModalPagoVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [datosReserva, setDatosReserva] = useState(null);
  const [totalCalculado, setTotalCalculado] = useState(0);
  const [diasRenta, setDiasRenta] = useState(0);
  
  const [formReserva] = Form.useForm();
  const [formPago] = Form.useForm();

  const CUENTA_EMPRESA = "1756177158";

  const getColorEstado = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'confirmada': return 'green';
      case 'aprobada': return 'green'; 
      case 'finalizada': return 'blue';
      default: return 'default';
    }
  };

  const abrirModalReserva = () => {
    formReserva.resetFields();
    setModalReservaVisible(true);
  };

  const cerrarModalReserva = () => {
    formReserva.resetFields();
    setModalReservaVisible(false);
  };

const volverAModalReserva = () => {
    setModalPagoVisible(false);
    setModalReservaVisible(true);
  };

  const cerrarModalPago = () => {
    formPago.resetFields();
    setModalPagoVisible(false);
    setDatosReserva(null);
    setTotalCalculado(0);
    setDiasRenta(0);
  };
  const handleContinuarAPago = async () => {
    try {
      const values = await formReserva.validateFields();
      const [fechaInicio, fechaFin] = values.fechas;
      const dias = fechaFin.diff(fechaInicio, 'day');
      const diasReales = dias > 0 ? dias : 1;
      
      const vehiculoSeleccionado = vehiculos.find(v => v.IdVehiculo === values.IdVehiculo);
      const precioDia = vehiculoSeleccionado?.PrecioDia || 0;
      const subtotal = precioDia * diasReales;
      
      setDiasRenta(diasReales);
      setTotalCalculado(subtotal);
      setDatosReserva({
        IdUsuario: values.IdUsuario,
        IdVehiculo: values.IdVehiculo,
        FechaInicio: fechaInicio.format('YYYY-MM-DD'),
        FechaFin: fechaFin.format('YYYY-MM-DD'),
        vehiculoNombre: `${vehiculoSeleccionado.Marca} ${vehiculoSeleccionado.Modelo}`,
        precioDia: precioDia
      });
      setModalReservaVisible(false);
      formPago.resetFields();
      formPago.setFieldsValue({
        cuentaEmpresa: CUENTA_EMPRESA,
        cuentaUsuario: ''
      });
      setModalPagoVisible(true);
      
    } catch (err) {
      console.error('Error en formulario de reserva:', err);
    }
  };
  const handleProcesarPago = async () => {
    try {
      await formPago.validateFields();
      setSubmitLoading(true);

      const reservaDto = {
        IdUsuario: datosReserva.IdUsuario,
        IdVehiculo: datosReserva.IdVehiculo,
        FechaInicio: datosReserva.FechaInicio,
        FechaFin: datosReserva.FechaFin,
        Estado: 'Confirmada',
        Total: totalCalculado * 1.15 
      };

      const resultado = await onCrearReserva(reservaDto);
      
      if (resultado) {
        cerrarModalPago();
        cerrarModalReserva();
      }
    } catch (err) {
      console.error('Error en formulario de pago:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const baseColumns = [
    { 
      title: 'ID', 
      dataIndex: 'IdReserva', 
      width: 60, 
      key: 'id' 
    },
    {
      title: 'Vehículo',
      key: 'vehiculo',
      render: (_, record) => (
        <Space>
          <CarOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
          <div>
            <Text strong>{record.VehiculoNombre || record.Modelo || 'Vehículo'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
               {record.Marca ? `${record.Marca}` : `ID Auto: ${record.IdVehiculo}`}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Cliente',
      key: 'cliente',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text strong>
            {record.NombreUsuario || record.nombreUsuario || `ID: ${record.IdUsuario}`}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.CorreoUsuario || record.email}
          </Text>
        </div>
      )
    },
    {
      title: 'Fechas',
      key: 'fechas',
      render: (_, record) => (
        <div>
          <Text>Del: {dayjs(record.FechaInicio).format('DD/MM/YYYY')}</Text>
          <br />
          <Text>Al: {dayjs(record.FechaFin).format('DD/MM/YYYY')}</Text>
        </div>
      )
    },
    {
      title: 'Total',
      dataIndex: 'Total',
      key: 'total',
      render: (valor) => <Text strong>${parseFloat(valor || 0).toFixed(2)}</Text>
    },
    {
      title: 'Estado',
      dataIndex: 'Estado',
      key: 'estado',
      render: (estado) => (
        <Tag color={getColorEstado(estado)}>
          {estado ? estado.toUpperCase() : 'DESCONOCIDO'}
        </Tag>
      )
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 180,
      render: (_, record) => {
        const estado = record.Estado ? record.Estado.toLowerCase() : '';

        return (
          <Space size="small">
            {!esAdmin && (estado === 'confirmada' || estado === 'finalizada' || estado === 'aprobada') && (
              <Tooltip title="Ver Facturas">
                <Button 
                  type="link" 
                  icon={<DollarOutlined />} 
                  style={{ color: '#52c41a', paddingLeft: 0, paddingRight: 0 }}
                  onClick={() => onVerPagos(record.IdReserva, record.IdUsuario)}
                >
                  Ver Facturas
                </Button>
              </Tooltip>
            )}
            {esAdmin && (estado === 'confirmada' || estado === 'aprobada') && (
              <Popconfirm
                title="¿Finalizar esta renta?"
                description="El vehículo quedará disponible nuevamente."
                onConfirm={() => onCambiarEstado(record.IdReserva, 'Finalizada', record)}
                okText="Sí, finalizar"
                cancelText="Cancelar"
              >
                <Tooltip title="Finalizar Renta">
                  <Button 
                    size="small" 
                    type="primary" 
                    icon={<FlagOutlined />}
                  >
                    Finalizar
                  </Button>
                </Tooltip>
              </Popconfirm>
            )}  
          </Space>
        );
      }
    }
  ];

  const finalColumns = baseColumns.filter(col => {
    if (col.key === 'cliente' && !esAdmin) return false;
    return true;
  });

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>
          {esAdmin ? "Gestión de Reservas (Admin)" : "Mis Reservas"}
        </Title>
        <Space>
          {esAdmin && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={abrirModalReserva}
            >
              Nueva Reserva
            </Button>
          )}
          <Button icon={<SyncOutlined />} onClick={onRefresh}>
            Actualizar
          </Button>
        </Space>
      </div>

      <Card>
        <Table 
          dataSource={reservas} 
          columns={finalColumns}
          rowKey="IdReserva" 
          loading={loading}
          locale={{ emptyText: <Empty description="No hay reservas" /> }}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* PASO 1: MODAL DATOS DE RESERVA */}
      <Modal
        title={
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            🚗 Paso 1: Datos de Reserva
          </span>
        }
        open={modalReservaVisible}
        onOk={handleContinuarAPago}
        onCancel={cerrarModalReserva}
        okText="Continuar al Pago →"
        cancelText="Cancelar"
        width={600}
      >
        <Form form={formReserva} layout="vertical">
          
          <Form.Item 
            name="IdUsuario" 
            label="👤 Cliente"
            rules={[{ required: true, message: 'Selecciona un cliente' }]}
          >
            <Select 
              placeholder="Seleccione un cliente"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {usuarios && usuarios.length > 0 ? (
                usuarios.map(user => (
                  <Option key={user.IdUsuario} value={user.IdUsuario}>
                    {user.Nombre} {user.Apellido}
                  </Option>
                ))
              ) : (
                <Option disabled>No hay usuarios disponibles</Option>
              )}
            </Select>
          </Form.Item>

          <Form.Item 
            name="IdVehiculo" 
            label="Vehículo"
            rules={[{ required: true, message: 'Selecciona un vehículo' }]}
          >
            <Select 
              placeholder="Seleccione un vehículo"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {vehiculos && vehiculos.length > 0 ? (
                vehiculos
                  .filter(v => v.Estado === 'Disponible')
                  .map(vehiculo => (
                    <Option key={vehiculo.IdVehiculo} value={vehiculo.IdVehiculo}>
                      {vehiculo.Marca} {vehiculo.Modelo} - ${vehiculo.PrecioDia}/día
                    </Option>
                  ))
              ) : (
                <Option disabled>No hay vehículos disponibles</Option>
              )}
            </Select>
          </Form.Item>

          <Form.Item 
            name="fechas" 
            label="📅 Fechas de Reserva"
            rules={[{ required: true, message: 'Selecciona las fechas' }]}
          >
            <RangePicker 
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Fecha inicio', 'Fecha fin']}
              disabledDate={(current) => {
                return current && current < dayjs().startOf('day');
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            💳 Paso 2: Finalizar Pago
          </div>
        }
        open={modalPagoVisible}
        onOk={handleProcesarPago}
        onCancel={volverAModalReserva}
        okText={submitLoading ? "⏳ Procesando..." : `Pagar $${(totalCalculado * 1.15).toFixed(2)}`}
        cancelText="← Volver"
        confirmLoading={submitLoading}
        width={650}
        okButtonProps={{ 
          size: 'large',
          style: { height: '45px', fontSize: '16px' }
        }}
        cancelButtonProps={{ size: 'large' }}
      >
        <Form form={formPago} layout="vertical">
          
          {/* PERIODO DE RENTA */}
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '20px',
            color: 'white'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'white', fontSize: '16px' }}>
              📋 Resumen de Reserva
            </h4>
            {datosReserva && (
              <>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>Vehículo:</strong> {datosReserva.vehiculoNombre}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>Periodo:</strong> {dayjs(datosReserva.FechaInicio).format('DD/MM/YYYY')} - {dayjs(datosReserva.FechaFin).format('DD/MM/YYYY')}
                </p>
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
              </>
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
                  label="Cédula del Cliente"
                  rules={[{ 
                    required: true, 
                    message: 'Ingresa la cédula del cliente' 
                  }]}
                  tooltip="Cédula asociada a la cuenta bancaria del cliente"
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
                  tooltip="Cuenta de la empresa"
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
    </div>
  );
};

export default ReservasView;