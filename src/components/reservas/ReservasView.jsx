import React, { useState } from 'react';
import { 
  Table, Card, Tag, Button, Space, Popconfirm, Tooltip, Typography, Empty, Modal, Form, Select, DatePicker, Row, Col 
} from 'antd';
import { 
  CloseCircleOutlined, DeleteOutlined, SyncOutlined, CarOutlined, 
  CheckOutlined, FlagOutlined, FileTextOutlined, CreditCardOutlined, PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ReservasView = ({ 
  reservas = [], loading, esAdmin, 
  onEliminar, onCambiarEstado, onRefresh, onVerPagos, onPagar, onCrearReserva,
  usuarios = [], vehiculos = []
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loadingCreate, setLoadingCreate] = useState(false);

  const handleCreate = async () => {
      try {
          const values = await form.validateFields();
          setLoadingCreate(true);
          
          const [inicio, fin] = values.fechas;
          const vehiculo = vehiculos.find(v => v.IdVehiculo === values.IdVehiculo);
          const dias = fin.diff(inicio, 'day') || 1;
          const total = (vehiculo?.PrecioDia || 0) * dias * 1.15;

          const dto = {
              IdUsuario: values.IdUsuario,
              IdVehiculo: values.IdVehiculo,
              FechaInicio: inicio.format('YYYY-MM-DDTHH:mm:ss'),
              FechaFin: fin.format('YYYY-MM-DDTHH:mm:ss'),
              Total: total,
              Estado: 'Pendiente' 
          };

          const success = await onCrearReserva(dto);
          if(success) {
              setModalVisible(false);
              form.resetFields();
          }
      } catch(e) { console.error(e); }
      finally { setLoadingCreate(false); }
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
        return (
          <Space size="small">
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
            {(estado === 'confirmada' || estado === 'finalizada') && (
              <Tooltip title="Ver Factura">
                <Button type="text" icon={<FileTextOutlined style={{ color: '#1890ff' }} />} onClick={() => onVerPagos(record.IdReserva, record.IdUsuario)} />
              </Tooltip>
            )}
            {esAdmin && estado === 'confirmada' && (
               <Popconfirm title="¿Finalizar Renta?" onConfirm={() => onCambiarEstado(record.IdReserva, 'Finalizada', record)}>
                  <Button size="small" icon={<FlagOutlined />}>Finalizar</Button>
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
            {esAdmin && <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>Nueva Reserva</Button>}
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

      {/* Modal Crear Reserva (Admin) */}
      <Modal title="Nueva Reserva" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleCreate} confirmLoading={loadingCreate}>
         <Form form={form} layout="vertical">
             <Form.Item name="IdUsuario" label="Cliente" rules={[{required:true}]}>
                 <Select showSearch optionFilterProp="children">
                     {usuarios.map(u => <Option key={u.IdUsuario} value={u.IdUsuario}>{u.Nombre} {u.Apellido}</Option>)}
                 </Select>
             </Form.Item>
             <Form.Item name="IdVehiculo" label="Vehículo" rules={[{required:true}]}>
                 <Select showSearch optionFilterProp="children">
                     {vehiculos.filter(v => v.Estado === 'Disponible').map(v => <Option key={v.IdVehiculo} value={v.IdVehiculo}>{v.Marca} {v.Modelo}</Option>)}
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