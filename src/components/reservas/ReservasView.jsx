import React, { useState } from 'react';
import { 
  Table, Card, Tag, Button, Space, Popconfirm, Tooltip, Typography, Empty, Modal, Form, Select, DatePicker, message 
} from 'antd';
import { 
  CloseCircleOutlined, DeleteOutlined, SyncOutlined, CarOutlined, EditOutlined,
  CheckOutlined, FlagOutlined, FileTextOutlined, CreditCardOutlined, PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ReservasView = ({ 
  reservas = [], 
  loading, 
  esAdmin, 
  onEliminar, 
  onCambiarEstado, 
  onRefresh, 
  onVerPagos, 
  onPagar, 
  onCrearReserva, 
  onEditarReserva,
  usuarios = [], 
  vehiculos = []
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [reservaActual, setReservaActual] = useState(null);
  
  const isEditing = !!reservaActual;

  // Abrir modal para crear
  const abrirModalCrear = () => {
    form.resetFields();
    setReservaActual(null);
    setModalVisible(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (reserva) => {
    setReservaActual(reserva);
    form.setFieldsValue({
      IdUsuario: reserva.IdUsuario,
      IdVehiculo: reserva.IdVehiculo,
      fechas: [dayjs(reserva.FechaInicio), dayjs(reserva.FechaFin)],
    });
    setModalVisible(true);
  };

  // Cerrar modal
  const closeModal = () => {
    form.resetFields();
    setReservaActual(null);
    setModalVisible(false);
  };

  // Manejar creación o edición
  const handleCreateOrEdit = async () => {
    try {
      const values = await form.validateFields();
      setLoadingCreate(true);
      
      const [inicio, fin] = values.fechas;
      
      // Validar que la fecha fin sea posterior a la fecha inicio
      if (fin.isBefore(inicio) || fin.isSame(inicio)) {
        message.error('La fecha de fin debe ser posterior a la fecha de inicio');
        setLoadingCreate(false);
        return;
      }

      const vehiculo = vehiculos.find(v => v.IdVehiculo === values.IdVehiculo);
      const dias = fin.diff(inicio, 'day');
      const precioDia = vehiculo?.PrecioDia || vehiculo?.precioDia || 0;
      
      if (precioDia === 0) {
        message.warning('No se pudo calcular el precio del vehículo');
      }
      
      const subtotal = precioDia * dias;
      const total = subtotal * 1.15; // +15% IVA

      const dto = {
        IdUsuario: values.IdUsuario,
        IdVehiculo: values.IdVehiculo,
        FechaInicio: inicio.format('YYYY-MM-DDTHH:mm:ss'),
        FechaFin: fin.format('YYYY-MM-DDTHH:mm:ss'),
        Total: parseFloat(total.toFixed(2)),
        Estado: reservaActual ? reservaActual.Estado : 'Pendiente'
      };

      let success = false;
      
      if (isEditing) {
        dto.IdReserva = reservaActual.IdReserva;
        success = await onEditarReserva(dto.IdReserva, dto);
      } else {
        success = await onCrearReserva(dto);
      }
      
      if (success) {
        closeModal();
      }
    } catch (e) { 
      console.error('Error en Create/Edit:', e);
      message.error('Por favor completa todos los campos requeridos');
    } finally { 
      setLoadingCreate(false); 
    }
  };

  const getColorEstado = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'confirmada': return 'green';
      case 'pendiente': return 'orange';
      case 'rechazada': return 'red';
      case 'cancelada': return 'red';
      case 'finalizada': return 'blue';
      default: return 'default';
    }
  };
// ✅ Función para abrir la factura PDF directamente desde la reserva
const verFacturaPDF = (record) => {
  if (!record.UriFactura) {
    message.warning('La factura aún no ha sido generada para esta reserva');
    return;
  }
  // Abrir directamente la URL de Cloudinary/S3 en una nueva pestaña
  window.open(record.UriFactura, '_blank');
};

  const columnas = [
    { 
      title: 'ID', 
      dataIndex: 'IdReserva', 
      width: 80, 
      key: 'id',
      align: 'center'
    },
    {
      title: 'Vehículo',
      key: 'vehiculo',
      width: 200,
      render: (_, record) => (
        <Space>
          <CarOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
          <div>
            <Text strong>{record.VehiculoNombre || 'Vehículo'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.Marca} {record.Modelo}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Cliente',
      key: 'cliente',
      width: 200,
      hidden: !esAdmin,
      render: (_, record) => (
        <div>
          <Text strong>{record.NombreUsuario}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.CorreoUsuario}
          </Text>
        </div>
      )
    },
    {
      title: 'Fechas',
      key: 'fechas',
      width: 180,
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: '13px' }}>
            📅 Del: {dayjs(record.FechaInicio).format('DD/MM/YYYY')}
          </Text>
          <br />
          <Text style={{ fontSize: '13px' }}>
            📅 Al: {dayjs(record.FechaFin).format('DD/MM/YYYY')}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ({dayjs(record.FechaFin).diff(dayjs(record.FechaInicio), 'day')} días)
          </Text>
        </div>
      )
    },
    {
      title: 'Total',
      dataIndex: 'Total',
      key: 'total',
      width: 120,
      align: 'right',
      render: (valor) => (
        <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
          ${parseFloat(valor || 0).toFixed(2)}
        </Text>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'Estado',
      key: 'estado',
      width: 120,
      align: 'center',
      render: (estado) => (
        <Tag color={getColorEstado(estado)} style={{ fontSize: '13px', padding: '4px 12px' }}>
          {estado ? estado.toUpperCase() : 'N/A'}
        </Tag>
      )
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 280,
      fixed: 'right',
      render: (_, record) => {
        const estado = record.Estado ? record.Estado.toLowerCase() : '';
        const puedeEliminarOCancelar = esAdmin || estado === 'pendiente';
        
        return (
          <Space size="small" wrap>
            {/* EDITAR - Solo cuando estado es Pendiente */}
            {estado === 'pendiente' && (
              <Tooltip title="Modificar Fechas/Vehículo">
                <Button 
                  size="small" 
                  icon={<EditOutlined />} 
                  onClick={() => abrirModalEditar(record)}
                >
                  Editar
                </Button>
              </Tooltip>
            )}

            {/* PAGAR - Solo usuarios en estado Pendiente */}
            {!esAdmin && estado === 'pendiente' && (
              <Button 
                type="primary" 
                size="small" 
                icon={<CreditCardOutlined />} 
                style={{ background: '#faad14', borderColor: '#faad14' }}
                onClick={() => onPagar(record)}
              >
                Pagar
              </Button>
            )}

            {/* ELIMINAR/CANCELAR */}
            {puedeEliminarOCancelar && (
              <Popconfirm 
                title={esAdmin ? "¿Eliminar Reserva permanentemente?" : "¿Cancelar esta reserva?"} 
                description="Esta acción no se puede deshacer"
                onConfirm={() => onEliminar(record.IdReserva)}
                okText="Sí"
                cancelText="No"
              >
                <Button size="small" danger icon={<DeleteOutlined />}>
                  {esAdmin ? "Eliminar" : "Cancelar"}
                </Button>
              </Popconfirm>
            )}

            {/* VER FACTURA - Confirmada o Finalizada */}
            {(estado === 'confirmada' || estado === 'finalizada') && (
              <Tooltip title="Ver factura en PDF">
                <Button 
                  type="default" 
                  size="small" 
                  icon={<FileTextOutlined style={{ color: '#1890ff' }} />} 
                  onClick={() => verFacturaPDF(record)}
                >
                  Factura
                </Button>
              </Tooltip>
            )}

            {/* FINALIZAR - Solo Admin cuando estado es Confirmada */}
            {esAdmin && estado === 'confirmada' && (
              <Popconfirm 
                title="¿Finalizar Renta y liberar vehículo?" 
                description="El vehículo quedará disponible nuevamente"
                onConfirm={() => onCambiarEstado(record.IdReserva, 'Finalizada', record)}
                okText="Sí, finalizar"
                cancelText="Cancelar"
              >
                <Button 
                  size="small" 
                  type="primary"
                  icon={<FlagOutlined />}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  Finalizar
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      }
    }
  ].filter(col => !col.hidden);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24 
      }}>
        <Title level={2} style={{ margin: 0 }}>
          {esAdmin ? "📋 Gestión de Reservas" : "🎫 Mis Reservas"} ({reservas.length})
        </Title>
        <Space>
          {esAdmin && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="large"
              onClick={abrirModalCrear}
            >
              Nueva Reserva
            </Button>
          )}
          <Button 
            icon={<SyncOutlined />} 
            onClick={onRefresh}
          >
            Actualizar
          </Button>
        </Space>
      </div>

      <Card>
        <Table 
          dataSource={reservas} 
          columns={columnas}
          rowKey="IdReserva" 
          loading={loading}
          locale={{ emptyText: <Empty description="No hay reservas disponibles" /> }}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} reservas`
          }}
          scroll={{ x: 1200 }}
          bordered
        />
      </Card>

      {/* Modal Crear/Editar Reserva */}
      <Modal 
        title={
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {isEditing ? "✏️ Editar Reserva" : "📝 Nueva Reserva"}
          </span>
        }
        open={modalVisible} 
        onCancel={closeModal} 
        onOk={handleCreateOrEdit} 
        confirmLoading={loadingCreate}
        okText={isEditing ? "Actualizar" : "Crear Reserva"}
        cancelText="Cancelar"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="IdUsuario" 
            label="👤 Cliente" 
            rules={[{ required: true, message: 'Selecciona un cliente' }]}
          >
            <Select 
              showSearch 
              optionFilterProp="children"
              placeholder="Selecciona un cliente"
              disabled={!esAdmin}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {usuarios.map(u => (
                <Option key={u.IdUsuario} value={u.IdUsuario}>
                  {u.Nombre} {u.Apellido} ({u.Correo})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item 
            name="IdVehiculo" 
            label="🚗 Vehículo" 
            rules={[{ required: true, message: 'Selecciona un vehículo' }]}
          >
            <Select 
              showSearch 
              optionFilterProp="children"
              placeholder="Selecciona un vehículo"
              disabled={!esAdmin && isEditing}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {vehiculos
                .filter(v => 
                  v.Estado === 'Disponible' || 
                  v.estado === 'Disponible' ||
                  (isEditing && v.IdVehiculo === reservaActual?.IdVehiculo)
                )
                .map(v => (
                  <Option key={v.IdVehiculo} value={v.IdVehiculo}>
                    {v.Marca || v.marca} {v.Modelo || v.modelo} - ${parseFloat(v.PrecioDia || v.precioDia || 0).toFixed(2)}/día
                  </Option>
                ))
              }
            </Select>
          </Form.Item>

          <Form.Item 
            name="fechas" 
            label="📅 Fechas de Reserva" 
            rules={[{ required: true, message: 'Selecciona las fechas' }]}
            tooltip="Selecciona la fecha de inicio y fin de la reserva"
          >
            <RangePicker 
              style={{ width: '100%' }} 
              format="DD/MM/YYYY"
              disabledDate={(current) => {
                // Deshabilitar fechas anteriores a hoy
                return current && current < dayjs().startOf('day');
              }}
            />
          </Form.Item>

          {/* Información adicional */}
          <div style={{ 
            background: '#f0f5ff', 
            padding: '12px', 
            borderRadius: '6px',
            marginTop: '16px'
          }}>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              ℹ️ <strong>Nota:</strong> El total incluye IVA del 15% y se calculará automáticamente según los días seleccionados.
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ReservasView;