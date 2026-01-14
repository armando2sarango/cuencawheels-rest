import React, { useState } from 'react';
import { 
  Table, Card, Tag, Button, Space, Popconfirm, Tooltip, Typography, Empty, Modal, Form, Select, DatePicker, Row, Col 
} from 'antd';
import { 
  CloseCircleOutlined, DeleteOutlined, SyncOutlined, CarOutlined, EditOutlined, // 👈 Agregar EditOutlined
  CheckOutlined, FlagOutlined, FileTextOutlined, CreditCardOutlined, PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ReservasView = ({ 
  reservas = [], loading, esAdmin, 
  onEliminar, onCambiarEstado, onRefresh, onVerPagos, onPagar, 
  onCrearReserva, onEditarReserva, // 👈 Recibimos onEditarReserva
  usuarios = [], vehiculos = []
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loadingCreate, setLoadingCreate] = useState(false);
  
  const [reservaActual, setReservaActual] = useState(null);
  const isEditing = !!reservaActual;

  const abrirModalEditar = (reserva) => {
      setReservaActual(reserva);
      form.setFieldsValue({
          IdUsuario: reserva.IdUsuario,
          idVehiculo: reserva.IdVehiculo,
          fechas: [dayjs(reserva.FechaInicio), dayjs(reserva.FechaFin)],
      });
      setModalVisible(true);
  };

  const closeModal = () => {
    form.resetFields();
    setReservaActual(null);
    setModalVisible(false);
  }

  // 🔴 FUNCIÓN UNIFICADA DE CREACIÓN/EDICIÓN
  // En handleCreateOrEdit de ReservasView.jsx
const handleCreateOrEdit = async () => {
    try {
        const values = await form.validateFields();
        setLoadingCreate(true);
        
        const [inicio, fin] = values.fechas;
        const vehiculo = vehiculos.find(v => v.idVehiculo === values.idVehiculo);
        const dias = fin.diff(inicio, 'day') || 1;
        const precioDia = vehiculo?.PrecioDia || 0;
        const total = precioDia * dias * 1.15; // +15% IVA

        const dto = {
            IdUsuario: values.IdUsuario,
            IdVehiculo: values.idVehiculo,
            FechaInicio: inicio.format('YYYY-MM-DDTHH:mm:ss'),
            FechaFin: fin.format('YYYY-MM-DDTHH:mm:ss'),
            Total: total,
            Estado: reservaActual ? reservaActual.Estado : 'Pendiente'
        };

        let success = false;
        
        if (isEditing) {
            dto.IdReserva = reservaActual.IdReserva;
            success = await onEditarReserva(dto.IdReserva, dto);
        } else {
            // 👇 Solo se pasa el DTO, onCrearReserva maneja el hold internamente
            success = await onCrearReserva(dto);
        }
        
        if(success) {
            closeModal();
        }
    } catch(e) { 
        console.error('Error en Create/Edit:', e); 
    }
    finally { setLoadingCreate(false); }
};
const abrirModalCrear = () => {
    form.resetFields();
    setReservaActual(null); // Asegura que isEditing sea false
    setModalVisible(true);  // Abre el modal
  };
  const getColorEstado = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'confirmada': return 'green';
      case 'pendiente': return 'orange';
      case 'rechazada': return 'red';
      case 'finalizada': return 'blue';
      default: return 'default';
    }
  };

  const columnas = [
    { title: 'ID', dataIndex: 'IdReserva', width: 60, key: 'id' },
    {
      title: 'Vehículo',
      key: 'vehiculo',
      render: (_, record) => (
        <Space>
          <CarOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
          <div>
            <Text strong>{record.VehiculoNombre || 'Vehículo'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.Marca} {record.Modelo}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Cliente',
      key: 'cliente',
      hidden: !esAdmin,
      render: (_, record) => (
        <div>
          <Text strong>{record.NombreUsuario}</Text><br/>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.CorreoUsuario}</Text>
        </div>
      )
    },
    {
      title: 'Fechas',
      key: 'fechas',
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: '13px' }}>Del: {dayjs(record.FechaInicio).format('DD/MM/YYYY')}</Text>
          <br />
          <Text style={{ fontSize: '13px' }}>Al: &nbsp;{dayjs(record.FechaFin).format('DD/MM/YYYY')}</Text>
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
        <Tag color={getColorEstado(estado)}>{estado ? estado.toUpperCase() : 'N/A'}</Tag>
      )
    },
    {
  title: 'Acciones',
  key: 'acciones',
  width: 200,
  render: (_, record) => {
    const estado = record.Estado ? record.Estado.toLowerCase() : '';
    // Condición para el botón Eliminar/Cancelar:
    // 1. Siempre que sea Admin (esAdmin es true), O
    // 2. Si es usuario normal Y el estado es 'pendiente'.
    const puedeEliminarOCancelar = esAdmin || estado === 'pendiente';
    
    return (
        <Space size="small">
            
            {/* 🔹 EDITAR - Solo cuando estado es Pendiente (para todos) */}
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

            {/* 🔹 PAGAR - Solo usuarios finales en estado Pendiente */}
            {!esAdmin && estado === 'Pendiente' && (
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

            {/* 🔹 ELIMINAR/CANCELAR - El administrador puede hacerlo en cualquier estado. El usuario, solo en Pendiente. */}
            {puedeEliminarOCancelar && (
                <Popconfirm 
                    title={esAdmin ? "¿Eliminar Reserva permanentemente?" : "¿Cancelar esta reserva?"} 
                    onConfirm={() => onEliminar(record.IdReserva)}
                    // Nota: Se recomienda solo permitir eliminar permanentemente si la reserva es Pendiente, Cancelada o Rechazada
                >
                    <Button size="small" danger icon={<DeleteOutlined />}>
                        {esAdmin ? "Eliminar" : "Cancelar"}
                    </Button>
                </Popconfirm>
            )}


            {/* 🔹 VER FACTURA - Confirmada o Finalizada (para todos) */}
            {(estado === 'confirmada' || estado === 'finalizada') && (
                <Button 
                    type="default" 
                    size="small" 
                    icon={<FileTextOutlined style={{ color: '#1890ff' }} />} 
                    onClick={() => {
                        const idUsuarioFactura = record.IdUsuario || 0;
                        onVerPagos(record.IdReserva, idUsuarioFactura);
                    }} 
                >
                    Ver Factura
                </Button>
            )}

            {/* 🔹 FINALIZAR - Solo Admin cuando estado es Confirmada */}
            {esAdmin && estado === 'confirmada' && (
                <Popconfirm 
                    title="¿Finalizar Renta y liberar vehículo?" 
                    onConfirm={() => onCambiarEstado(record.IdReserva, 'Finalizada', record)}
                >
                    <Button size="small" icon={<FlagOutlined />}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>{esAdmin ? "Gestión de Reservas" : "Mis Reservas"}</Title>
        <Space>
          {esAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={abrirModalCrear}>Nueva Reserva</Button>}
          <Button icon={<SyncOutlined />} onClick={onRefresh}>Actualizar</Button>
        </Space>
      </div>

      <Card>
        <Table 
          dataSource={reservas} 
          columns={columnas}
          rowKey="IdReserva" 
          loading={loading}
          locale={{ emptyText: <Empty description="No hay reservas" /> }}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 700 }}
        />
      </Card>

      {/* Modal Crear/Editar Reserva */}
      <Modal 
          title={isEditing ? "Editar Reserva" : "Nueva Reserva"} 
          open={modalVisible} 
          onCancel={closeModal} 
          onOk={handleCreateOrEdit} 
          confirmLoading={loadingCreate}
      >
          <Form form={form} layout="vertical">
              <Form.Item name="IdUsuario" label="Cliente" rules={[{required:true}]}>
                  <Select showSearch optionFilterProp="children" disabled={!esAdmin}> {/* Solo Admin puede cambiar cliente o si es edición */}
                      {usuarios.map(u => <Option key={u.IdUsuario} value={u.IdUsuario}>{u.Nombre} {u.Apellido}</Option>)}
                  </Select>
              </Form.Item>
              <Form.Item name="idVehiculo" label="Vehículo" rules={[{required:true}]}>
                  <Select showSearch optionFilterProp="children" disabled={!esAdmin && isEditing}> {/* Si el usuario edita, solo puede cambiar las fechas */}
                      {vehiculos.filter(v => v.estado === 'Disponible' || (isEditing && v.idVehiculo === reservaActual.idVehiculo)).map(v => <Option key={v.idVehiculo} value={v.idVehiculo}>{v.marca} {v.modelo}</Option>)}
                  </Select>
              </Form.Item>
              <Form.Item name="fechas" label="Fechas" rules={[{required:true}]}>
                  <RangePicker style={{width:'100%'}} format="DD/MM/YYYY" />
              </Form.Item>
          </Form>
      </Modal>
    </div>
  );
};

export default ReservasView;