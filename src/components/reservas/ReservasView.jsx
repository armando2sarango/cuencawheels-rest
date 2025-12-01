import React from 'react';
import { 
  Table, Card, Tag, Button, Space, Popconfirm, Tooltip, Typography, Empty 
} from 'antd';
import { 
  CloseCircleOutlined, 
  DeleteOutlined, 
  SyncOutlined, 
  CarOutlined,
  CheckOutlined,
  FlagOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ReservasView = ({ 
  reservas = [], 
  loading, 
  esAdmin, 
  onEliminar, 
  onCambiarEstado, 
  onRefresh,
  onVerPagos
}) => {

  const getColorEstado = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'confirmada': return 'green';
      case 'aprobada': return 'green'; 
      case 'pendiente': return 'orange';
      case 'rechazada': return 'red';
      case 'finalizada': return 'blue';
      case 'cancelada': return 'default';
      default: return 'default';
    }
  };

  // --- COLUMNAS BASE ---
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
            
            {/* 👁️ Ver Pagos - Cliente (solo si está confirmada o finalizada) */}
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

            {/* ❌ Cancelar - Cliente (solo si está pendiente) */}
            {!esAdmin && estado === 'pendiente' && (
              <Popconfirm 
                title="¿Cancelar reserva?" 
                onConfirm={() => onEliminar(record.IdReserva)}
              >
                <Button danger size="small" icon={<DeleteOutlined />}>
                  Cancelar
                </Button>
              </Popconfirm>
            )}

            {/* ✅ Confirmar / ❌ Rechazar - Admin (solo si está pendiente) */}
            {esAdmin && estado === 'pendiente' && (
              <>
                <Tooltip title="Confirmar Reserva">
                  <Button 
                    type="primary" 
                    shape="circle" 
                    size="small" 
                    icon={<CheckOutlined />} 
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} 
                    onClick={() => onCambiarEstado(record.IdReserva, 'Confirmada', record)} 
                  />
                </Tooltip>
                <Tooltip title="Rechazar Reserva">
                  <Button 
                    type="primary" 
                    danger 
                    shape="circle" 
                    size="small" 
                    icon={<CloseCircleOutlined />} 
                    onClick={() => onCambiarEstado(record.IdReserva, 'Rechazada', record)} 
                  />
                </Tooltip>
              </>
            )}

            {/* 🏁 Finalizar - Admin (solo si está confirmada o aprobada) */}
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

            {/* 🗑️ Eliminar del Historial - Admin (solo si ya está finalizada, rechazada o cancelada) */}
            {esAdmin && (estado === 'rechazada' || estado === 'cancelada' || estado === 'finalizada') && (
              <Popconfirm 
                title="¿Eliminar del historial?" 
                onConfirm={() => onEliminar(record.IdReserva)}
              >
                <Button 
                  type="text" 
                  danger 
                  size="small" 
                  icon={<DeleteOutlined />} 
                />
              </Popconfirm>
            )}
            
          </Space>
        );
      }
    }
  ];

  // Filtramos columnas según el rol
  const finalColumns = baseColumns.filter(col => {
    // Ocultamos columna 'Cliente' si NO es admin
    if (col.key === 'cliente' && !esAdmin) return false;
    return true;
  });

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>
          {esAdmin ? "Gestión de Reservas (Admin)" : "Mis Reservas"}
        </Title>
        <Button icon={<SyncOutlined />} onClick={onRefresh}>
          Actualizar
        </Button>
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
    </div>
  );
};

export default ReservasView;