import React from 'react';
import { 
  Table, Card, Button, Typography, Space, Image, Empty, Row, Col, Tag, Tooltip, Checkbox, Alert
} from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, CalendarOutlined, EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const CarritoView = ({ 
  items = [], 
  loading, 
  onEliminar, 
  onReservar,
  onVerDetalles,
  vehiculoSeleccionado,
  onSeleccionarVehiculo
}) => {
  
  const columns = [
    {
      title: 'Seleccionar',
      key: 'seleccionar',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Checkbox 
          checked={vehiculoSeleccionado?.IdItem === record.IdItem}
          onChange={() => onSeleccionarVehiculo(record)}
        />
      ),
    },
    {
      title: 'Vehículo',
      dataIndex: 'UrlImagen', 
      key: 'imagen',
      width: 130,
      render: (url, record) => (
        <div style={{ textAlign: 'center' }}>
            <Image 
                width={100} 
                src={url || 'https://via.placeholder.com/150?text=Auto'} 
                fallback="https://via.placeholder.com/150?text=Auto" 
                alt={record.VehiculoNombre}
                style={{ borderRadius: '8px', objectFit: 'cover', height: '60px' }}
                preview={false}
            />
        </div>
      ),
    },
    {
      title: 'Información',
      key: 'detalles',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '16px' }}>
            {record.VehiculoNombre || record.Nombre || 'Vehículo'}
          </Text>
          <Text type="secondary">
            {record.Marca} {record.Modelo}
          </Text>
          {record.CategoriaNombre && <Tag color="blue">{record.CategoriaNombre}</Tag>}
          {record.EnPromocion && (
              <Tag color="red" style={{marginTop: 4, fontWeight: 'bold'}}>
                 -{record.PorcentajeDescuento}% OFF
              </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Tarifa',
      key: 'precio',
      align: 'right',
      render: (_, record) => {
        const precioOriginal = record.PrecioDia || 0;
        const precioFinal = record.PrecioFinal || precioOriginal; 

        return (
            <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Precio por día
                </Text>
                
                {record.EnPromocion && record.PrecioFinal !== record.PrecioDia ? (
                    <Text delete type="secondary" style={{ fontSize: '12px', marginRight: 6 }}>
                        ${parseFloat(precioOriginal).toFixed(2)}
                    </Text>
                ) : null}
                <Text strong style={{ color: record.EnPromocion ? '#ff4d4f' : '#52c41a', fontSize: '18px' }}>
                    ${parseFloat(precioFinal).toFixed(2)}
                </Text>
            </div>
        );
      },
    },
    {
      title: '',
      key: 'acciones',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver detalles">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => onVerDetalles && onVerDetalles(record.IdVehiculo)} 
            />
          </Tooltip>
          <Tooltip title="Quitar del carrito">
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => onEliminar(record.IdItem)} 
            />
          </Tooltip>
        </Space>
      ),
    }
  ];

  if (loading && items.length === 0) {
    return <div style={{ padding: '100px', textAlign: 'center' }}><p>Cargando...</p></div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ShoppingCartOutlined style={{ color: '#1890ff' }} /> Mi Carrito
      </Title>
      
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          {items.length === 0 ? (
            <Empty description="Tu carrito está vacío" style={{ background: '#fff', padding: '60px', borderRadius: '12px' }}>
                <Button type="primary" href="/autos">Ir al Catálogo</Button>
            </Empty>
          ) : (
            <>
               {vehiculoSeleccionado ? (
                <Alert
                  message="Vehículo Seleccionado"
                  description={`Has seleccionado: ${vehiculoSeleccionado.VehiculoNombre}.`}
                  type="success"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
              ) : (
                <Alert
                  message="Importante"
                  description="Selecciona un vehículo de la lista para generar la reserva."
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
              )}
              
              <Table 
                dataSource={items} 
                columns={columns} 
                rowKey={(record) => record.IdItem || Math.random()} 
                pagination={false}
                style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}
                rowClassName={(record) => vehiculoSeleccionado?.IdItem === record.IdItem ? 'row-selected' : ''}
              />
            </>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Acciones" style={{ position: 'sticky', top: 20 }}>
            <div style={{ marginBottom: 20 }}>
               <Text>Vehículos en lista: <strong style={{ color: '#1890ff' }}>{items.length}</strong></Text>
            </div>
            
            <Button 
              type="primary" 
              size="large" 
              block 
              icon={<CalendarOutlined />} 
              disabled={items.length === 0 || !vehiculoSeleccionado}
              onClick={onReservar} 
              style={{ height: '50px', fontSize: '16px', fontWeight: 'bold' }}
            >
              Generar Reserva
            </Button>
            
            <Button type="link" block href="/autos" style={{ marginTop: 12 }}>
              Seguir buscando
            </Button>
          </Card>
        </Col>
      </Row>
      <style>{`.row-selected { background-color: #f6ffed !important; }`}</style>
    </div>
  );
};

export default CarritoView;