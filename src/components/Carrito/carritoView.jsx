import React from 'react';
import { 
  Table, Card, Button, Typography, Space, Image, Empty, Row, Col, Tag,Tooltip
} from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, CreditCardOutlined,EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const CarritoView = ({ 
  items = [], 
  loading, 
  onEliminar, 
  onReservar,
  onVerDetalles
}) => {
  
  const columns = [
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
            {record.VehiculoNombre || record.Nombre || 'Vehículo sin nombre'}
          </Text>
          <Text type="secondary">
            {record.Marca && record.Modelo ? `${record.Marca} ${record.Modelo}` : record.Marca || record.Modelo || 'Sin información'}
          </Text>
          {record.CategoriaNombre && <Tag color="blue">{record.CategoriaNombre}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Tarifa',
      key: 'precio',
      align: 'right',
      render: (_, record) => {
        const precio = record.PrecioPorDia || record.PrecioDia || 0;
        return (
            <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Precio por día
                </Text>
                <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>
                    ${parseFloat(precio).toFixed(2)}
                </Text>
            </div>
        );
      },
    },
    {
  title: '',
  key: 'acciones',
  width: 120,
  render: (_, record) => (
    <Space>
      <Tooltip title="Ver detalles">
        <Button 
          icon={<EyeOutlined />} 
          onClick={() => onVerDetalles && onVerDetalles(record.IdVehiculo)} 
        />
      </Tooltip>
      <Tooltip title="Eliminar">
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
    return (
      <div style={{ 
        padding: '100px 50px', 
        textAlign: 'center',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div className="spinner" style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #1890ff',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <Text type="secondary" style={{ fontSize: '16px' }}>Cargando tu carrito...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ShoppingCartOutlined style={{ color: '#1890ff' }} /> 
        Mi Carrito
      </Title>
      
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          {items.length === 0 ? (
            <Empty 
                description={
                  <span>
                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                      No tienes vehículos seleccionados
                    </p>
                    <Text type="secondary">Explora nuestro catálogo y agrega tus favoritos</Text>
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                style={{ 
                  background: '#fff', 
                  padding: '80px 40px', 
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)' 
                }}
            >
                <Button 
                  type="primary" 
                  href="/autos" 
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  style={{ marginTop: '20px', height: '45px', fontSize: '16px' }}
                >
                  Ir al Catálogo
                </Button>
            </Empty>
          ) : (
            <Table 
              dataSource={items} 
              columns={columns} 
              rowKey={(record) => record.IdItem || record.IdVehiculo || Math.random()} 
              pagination={false}
              style={{ 
                background: '#fff', 
                borderRadius: '12px', 
                overflow: 'hidden', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)' 
              }}
            />
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                📋 Resumen de Reserva
              </div>
            }
            style={{ 
              position: 'sticky', 
              top: 20, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '16px',
                padding: '12px',
                background: '#f0f5ff',
                borderRadius: '8px'
              }}>
                <Text style={{ fontSize: '15px' }}>Vehículos seleccionados:</Text>
                <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                  {items.length}
                </Text>
              </div>
            </div>
            
            <Button 
              type="primary" 
              size="large" 
              block 
              icon={<CreditCardOutlined />} 
              disabled={items.length === 0}
              onClick={onReservar} 
              style={{ 
                height: '50px', 
                fontSize: '16px', 
                fontWeight: 'bold',
                background: items.length === 0 ? undefined : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderColor: items.length === 0 ? undefined : 'transparent',
                boxShadow: items.length === 0 ? undefined : '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
            >
              {items.length === 0 ? 'Carrito Vacío' : 'Proceder al Pago'}
            </Button>
            
            <Button 
              type="link" 
              block 
              href="/autos" 
              style={{ 
                marginTop: 12, 
                fontSize: '14px',
                height: '40px' 
              }}
            >
              ➕ Agregar más vehículos
            </Button>
          </Card>
        </Col>
      </Row>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CarritoView;