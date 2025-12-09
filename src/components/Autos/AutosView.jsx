// src/components/Autos/AutosView.jsx
import React, { useState } from 'react';
import { Card, Button, Modal, Form, Input, InputNumber, Select, Row, Col, Tag, message, Tooltip, Space, Empty,Typography} from 'antd';
import { isAdmin } from '../../services/auth';
import { ExclamationCircleOutlined, EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, ClearOutlined, ShoppingCartOutlined} from '@ant-design/icons';
import './Autos.css';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;
const AutosView = ({ 
  autos = [], loading, error, onEditar, onEliminar, onCrear, onBuscar, onRefresh, onAgregarCarrito, checkAuth
}) => {
  const userIsAdmin = isAdmin(); 
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);
  const [detallesVisible, setDetallesVisible] = useState(false);
  const [autoActual, setAutoActual] = useState(null);
  const [autoAEliminar, setAutoAEliminar] = useState(null);
  const [eliminandoAuto, setEliminandoAuto] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  
  const listaAutos = Array.isArray(autos) ? autos : [];
  const handleAddToCart = (auto) => {
    if (checkAuth()) {
      onAgregarCarrito(auto.IdVehiculo);
    }
  };
  const handleFilterSearch = async (values) => {
      const filtros = {};
      if (values.IdCategoria) filtros.categoria = values.IdCategoria; 
      if (values.IdTransmision) filtros.transmision = values.IdTransmision; 
      if (values.Estado) filtros.estado = values.Estado;
      
      if (Object.keys(filtros).length > 0) {
          await onBuscar(filtros);
      } else {
          onRefresh();
      }
  };

  const handleClearFilters = () => {
    filterForm.resetFields();
    onRefresh(); 
  };

  const abrirModal = (auto = null) => {
      setAutoActual(auto);
      if (auto) {
        form.setFieldsValue({
          Marca: auto.Marca || '',
          Modelo: auto.Modelo || '',
          Anio: auto.Anio || new Date().getFullYear(),
          IdCategoria: auto.IdCategoria || 1,
          IdTransmision: auto.IdTransmision || 1,
          Capacidad: auto.Capacidad || 5,
          PrecioDia: parseFloat(auto.PrecioDia) || 0,
          PrecioNormal: parseFloat(auto.PrecioNormal) || 0,
          PrecioActual: parseFloat(auto.PrecioActual) || parseFloat(auto.PrecioDia) || 0,
          Matricula: auto.Matricula || '',
          IdPromocion: auto.IdPromocion || null,
          PorcentajeDescuento: auto.PorcentajeDescuento || 0,
          Estado: auto.Estado || 'Disponible',
          Descripcion: auto.Descripcion || '',
          IdSucursal: auto.IdSucursal || 1,
          UrlImagen: auto.UrlImagen || ''
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          Anio: new Date().getFullYear(),
          IdCategoria: "",
          IdTransmision: "",
          Capacidad: "",
          Estado: 'Disponible',
          IdSucursal: "",
          PorcentajeDescuento: 0
        });
      }
      setModalVisible(true);
    };

    const cerrarModal = () => {
      setModalVisible(false);
      setAutoActual(null);
      setSubmitLoading(false);
      form.resetFields();
    };

const handleSubmit = async () => {
  try {
    const values = await form.validateFields();
    setSubmitLoading(true);
    
    console.log('🔍 Valores del formulario ANTES de limpiar:', values);
    console.log('🔍 Claves del formulario:', Object.keys(values));
    
    // 🚨 FUNCIÓN HELPER: Limpiar valores vacíos y convertir tipos
    const cleanValue = (value, type = 'string', allowEmpty = false) => {
      // Si es string vacío, null o undefined
      if (value === '' || value === null || value === undefined) {
        // Para strings, si allowEmpty es true, devolver string vacío, sino null
        if (type === 'string' && allowEmpty) {
          return '';
        }
        return null;
      }
      
      // Convertir según el tipo
      switch(type) {
        case 'int':
          const intValue = parseInt(value);
          return isNaN(intValue) ? null : intValue;
        case 'float':
          const floatValue = parseFloat(value);
          return isNaN(floatValue) ? null : floatValue;
        default:
          // Para strings, si está vacío después de trim, retornar null
          if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed === '' ? null : trimmed;
          }
          return value;
      }
    };
    
    // 🛡️ Construir payload limpio SIN STRINGS VACÍOS
    const payload = {
      Marca: cleanValue(values.Marca) || null,
      Modelo: cleanValue(values.Modelo) || null,
      Anio: cleanValue(values.Anio, 'int'),
      IdCategoria: cleanValue(values.IdCategoria, 'int'),
      IdTransmision: cleanValue(values.IdTransmision, 'int'),
      Capacidad: cleanValue(values.Capacidad, 'int') || 5,
      PrecioDia: cleanValue(values.PrecioDia, 'float') || 0,
      PrecioNormal: cleanValue(values.PrecioNormal, 'float') || 0,
      PrecioActual: cleanValue(values.PrecioActual, 'float') || cleanValue(values.PrecioDia, 'float') || 0,
      Matricula: cleanValue(values.Matricula) || null, 
      IdPromocion: cleanValue(values.IdPromocion, 'int'),
      PorcentajeDescuento: cleanValue(values.PorcentajeDescuento, 'float') || 0,
      Estado: cleanValue(values.Estado) || 'Disponible',
      Descripcion: cleanValue(values.Descripcion) || null, // ← Cambio: null en lugar de ''
      IdSucursal: cleanValue(values.IdSucursal, 'int'),
      UrlImagen: cleanValue(values.UrlImagen) || null // ← Cambio: null en lugar de ''
    };

    // 🚨 ELIMINAR explícitamente cualquier clave con nombre vacío
    const cleanedPayload = {};
    for (const [key, value] of Object.entries(payload)) {
      if (key && key.trim() !== '') {
        cleanedPayload[key] = value;
      } else {
        console.warn('⚠️ Se detectó y eliminó una clave vacía:', key);
      }
    }

    if (autoActual) {
      cleanedPayload.IdVehiculo = autoActual.IdVehiculo;
    }

    console.log('📤 Payload limpio a enviar:', cleanedPayload);
    console.log('📤 Claves del payload:', Object.keys(cleanedPayload));

    let success = false;
    if (autoActual) {
      success = await onEditar(autoActual.IdVehiculo, cleanedPayload);
    } else {
      success = await onCrear(cleanedPayload);
    }

    if (success) cerrarModal();
  } catch (error) {
    console.error('❌ Error en validación del formulario:', error);
    console.error('❌ Detalles del error:', {
      name: error.name,
      message: error.message,
      errorFields: error.errorFields
    });
  } finally {
    setSubmitLoading(false);
  }
};

    // --- MODAL ELIMINAR ---
    const abrirModalEliminar = (auto) => {
      setAutoAEliminar(auto);
      setModalEliminarVisible(true);
    };

    const confirmarEliminar = async () => {
      if (!autoAEliminar) return;
      
      setEliminandoAuto(true);
      try {
        const resultado = await onEliminar(autoAEliminar.IdVehiculo);
        if (resultado !== false) {
          message.success('Vehículo eliminado correctamente');
          setModalEliminarVisible(false);
          setAutoAEliminar(null);
        }
      } catch (err) {
        console.error('❌ Error al eliminar:', err);
      } finally {
        setEliminandoAuto(false);
      }
    };

    const cancelarEliminar = () => {
      setModalEliminarVisible(false);
      setAutoAEliminar(null);
    };
    const verDetalles = (auto) => {
      setAutoActual(auto);
      setDetallesVisible(true);
    };

    const cerrarDetalles = () => {
      setDetallesVisible(false);
      setAutoActual(null);
    };
  if (loading) {
    return (
      <div className="loading" style={{ textAlign: 'center', padding: '50px' }}>
        <p>Cargando vehículos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error" style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
        Error: {typeof error === 'string' ? error : error?.mensaje || 'Error desconocido'}
      </div>
    );
  }

  return (
    <div className="autos-container" style={{ padding: '24px' }}>
      <Card style={{ marginBottom: '20px' }} bodyStyle={{ padding: '15px' }}>
        <Form 
            form={filterForm} 
            layout="inline" 
            onFinish={handleFilterSearch}
            style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
        >
            <Form.Item name="IdCategoria" style={{ minWidth: 150 }}>
                <Select placeholder="Categoría" allowClear>
                    <Option value="Sedán">Sedán</Option>
                    <Option value="SUV">SUV</Option>
                    <Option value="Lujo">Lujo</Option>
                    <Option value="Deportivo">Deportivo</Option>
                </Select>
            </Form.Item>

            <Form.Item name="IdTransmision" style={{ minWidth: 150 }}>
                <Select placeholder="Transmisión" allowClear>
                    <Option value="Automática">Automática</Option>
                    <Option value="Manual">Manual</Option>
                </Select>
            </Form.Item>

            <Form.Item name="Estado" style={{ minWidth: 150 }}>
                <Select placeholder="Estado" allowClear>
                    <Option value="Disponible">Disponible</Option>
                    <Option value="Rentado">Rentado</Option>
                </Select>
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                    Buscar
                </Button>
            </Form.Item>
            <Form.Item>
                <Button onClick={handleClearFilters} icon={<ClearOutlined />}>
                    Limpiar
                </Button>
            </Form.Item>
        </Form>
      </Card>

      <div className="autos-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px' 
      }}>
        <h2 style={{ margin: 0 }}>Gestión de Vehículos ({listaAutos.length})</h2>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={onRefresh}
          >
            Actualizar
          </Button>
           {userIsAdmin && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large" 
            onClick={() => abrirModal()}
          >
            Crear Nuevo Vehículo
          </Button>
           )}
        </Space>
      </div>

      {listaAutos.length === 0 ? (
          <Empty 
            description="No hay vehículos disponibles"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {userIsAdmin && (
            <Button type="primary" onClick={() => abrirModal()}>
              Crear primer vehículo
            </Button>
            )}
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {listaAutos.map((auto) => (
              <Col key={auto.IdVehiculo} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  cover={
                    <div style={{ 
                      height: '200px', 
                      overflow: 'hidden',
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      {auto.UrlImagen ? (
                        <img
                          alt={`${auto.Marca} ${auto.Modelo}`}
                          src={auto.UrlImagen}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { 
                            e.target.src = 'https://via.placeholder.com/300x200?text=Sin+Imagen'; 
                          }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#999' }}>
                          <p>Sin imagen</p>
                        </div>
                      )}
                      <div style={{ 
                        position: 'absolute', 
                        top: '8px', 
                        right: '8px',
                        display: 'flex',
                        gap: '4px',
                        flexDirection: 'column'
                      }}>
                        <Tag color={auto.Estado === "Disponible" ? "green" : "red"}>
                          {auto.Estado}
                        </Tag>
                        {auto.CategoriaNombre && (
                          <Tag color="blue">{auto.CategoriaNombre}</Tag>
                        )}
                      </div>
                    </div>
                  }
                  actions={[
                    
                    !userIsAdmin && (
                    <Tooltip title="Añadir a lista de deseos">
                      <Button 
                        type="text"
                        icon={<ShoppingCartOutlined style={{ fontSize: '18px', color: '#1890ff' }} />}
                        onClick={() => handleAddToCart(auto)}
                        disabled={auto.Estado !== 'Disponible'}
                      />
                    </Tooltip>
                  ),
                  userIsAdmin && (
                    <Tooltip title="Editar">
                      <Button 
                        type="link" 
                        icon={<EditOutlined />}
                        onClick={() => abrirModal(auto)}
                      />
                    </Tooltip>),
                    userIsAdmin && (
                    <Tooltip title="Eliminar">
                      <Button 
                        type="link" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => abrirModalEliminar(auto)}
                      />
                    </Tooltip>),
                    
                    <Tooltip title="Ver detalles">
                      <Button 
                        type="link" 
                        icon={<EyeOutlined />}
                        onClick={() => verDetalles(auto)}
                      />
                    </Tooltip>
                  ].filter(Boolean)}
                  >
                    <Card.Meta
  title={`${auto.Marca} ${auto.Modelo}`}
  description={
    <div>
      <p style={{ margin: '4px 0' }}>
        <strong>Año:</strong> {auto.Anio}
      </p> 
      {auto.EnPromocion ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '4px 0' }}>
             <Text delete type="secondary" style={{ fontSize: '13px' }}>
                Antes: ${parseFloat(auto.PrecioDia).toFixed(2)}
             </Text>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <strong style={{ fontSize: '18px', color: '#ff4d4f' }}>
                    ${parseFloat(auto.PrecioFinal).toFixed(2)} / día
                 </strong>
                 <Tag color="red" style={{ borderRadius: '10px' }}>
                    -{auto.PorcentajeDescuento}% OFF
                 </Tag>
             </div>
             <span style={{ fontSize: '11px', color: '#ff4d4f' }}>
                🔥 {auto.NombrePromocion}
             </span>
        </div>
      ) : (
        <p style={{ margin: '4px 0', fontSize: '18px', color: '#52c41a' }}>
          <strong>${parseFloat(auto.PrecioDia || 0).toFixed(2)}</strong> / día
        </p>
      )}
      {auto.TransmisionNombre && (
        <Tag style={{ marginTop: '8px' }}>{auto.TransmisionNombre}</Tag>
      )}
      {auto.Capacidad && (
        <Tag>{auto.Capacidad} pasajeros</Tag>
      )}
    </div>
  }
/>
                </Card>
              </Col>
            ))}
          </Row>
        )}

      <Modal
        title={autoActual ? `Editar ${autoActual.Marca} ${autoActual.Modelo}` : 'Crear Nuevo Vehículo'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={cerrarModal}
        okText="Guardar"
        cancelText="Cancelar"
        width={800}
        confirmLoading={submitLoading}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="Marca" label="Marca" rules={[{ required: true }]}>
                <Input placeholder="Ej: Toyota" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="Modelo" label="Modelo" rules={[{ required: true }]}>
                <Input placeholder="Ej: Corolla" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="Anio" label="Año" rules={[{ required: true }]}>
                <InputNumber placeholder="2024" min={1900} max={2030} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="IdCategoria" label="Categoría" rules={[{ required: true }]}>
                <Select placeholder="Selecciona categoría">
                  <Option value={1}>Sedán</Option>
                  <Option value={2}>SUV</Option>
                   <Option value={3}>Deportivo</Option>
                  <Option value={4}>Lujo</Option>

                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="IdTransmision" label="Transmisión" rules={[{ required: true }]}>
                <Select placeholder="Tipo de transmisión">
                  <Option value={1}>Automática</Option>
                  <Option value={2}>Manual</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="Capacidad" label="Capacidad" rules={[{ required: true }]}>
                <InputNumber placeholder="5" min={2} max={15} style={{ width: '100%' }} addonAfter="pasajeros"/>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="PrecioDia" label="Precio por día" rules={[{ required: true }]}>
                <InputNumber placeholder="50.00" min={0} step={0.01} precision={2} style={{ width: '100%' }} prefix="$" />
              </Form.Item>
            </Col>   
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="Matricula" label="Matrícula">
                <Input placeholder="ABC-1234" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Estado" label="Estado" rules={[{ required: true }]}>
                <Select placeholder="Estado del vehículo">
                  <Option value="Disponible">Disponible</Option>
                  <Option value="En Mantenimiento">En Mantenimiento</Option>
                  <Option value="Rentado">Rentado</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="IdSucursal" label="Sucursal" rules={[{ required: true }]}>
                <InputNumber placeholder="1" min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="PorcentajeDescuento" label="% Descuento">
                <InputNumber placeholder="0" min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="UrlImagen" label="URL de Imagen">
            <Input placeholder="https://ejemplo.com/imagen.jpg" />
          </Form.Item>

          <Form.Item name="Descripcion" label="Descripción">
            <TextArea rows={3} placeholder="Descripción del vehículo..." />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Confirmar Eliminación"
        open={modalEliminarVisible}
        onOk={confirmarEliminar}
        onCancel={cancelarEliminar}
        okText="Sí, eliminar"
        cancelText="Cancelar"
        confirmLoading={eliminandoAuto}
        okButtonProps={{ danger: true }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
          <div>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              ¿Estás seguro de eliminar este vehículo?
            </p>
            {autoAEliminar && (
              <p style={{ margin: '8px 0 0 0' }}>
                Se eliminará permanentemente <strong>{autoAEliminar.Marca} {autoAEliminar.Modelo}</strong>
                <br />
                ID: {autoAEliminar.IdVehiculo} | Año: {autoAEliminar.Anio}
              </p>
            )}
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
      </Modal>
      <Modal
        title={`Detalles - ${autoActual?.Marca || ''} ${autoActual?.Modelo || ''}`}
        open={detallesVisible}
        onCancel={cerrarDetalles}
        footer={[
          <Button key="close" onClick={cerrarDetalles}>Cerrar</Button>,
          userIsAdmin && (
          <Button key="edit" type="primary" onClick={() => { 
            cerrarDetalles(); 
            abrirModal(autoActual); 
          }}>
            Editar Vehículo
          </Button>
          )
        ].filter(Boolean)}
        width={700}
      >
        {autoActual && (
          <div>
            {autoActual.UrlImagen && (
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img
                  src={autoActual.UrlImagen}
                  alt={`${autoActual.Marca} ${autoActual.Modelo}`}
                  style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Sin+Imagen'; }}
                />
              </div>
            )}

            <Row gutter={16}>
              <Col span={12}>
                <h4>Información Básica</h4>
                <p><strong>ID:</strong> {autoActual.IdVehiculo || 'N/A'}</p>
                <p><strong>Marca:</strong> {autoActual.Marca || 'N/A'}</p>
                <p><strong>Modelo:</strong> {autoActual.Modelo || 'N/A'}</p>
                <p><strong>Año:</strong> {autoActual.Anio || 'N/A'}</p>
                <p><strong>Matrícula:</strong> {autoActual.Matricula || 'N/A'}</p>
              </Col>

              <Col span={12}>
                <h4>Especificaciones</h4>
                <p><strong>Categoría:</strong> {autoActual.CategoriaNombre || 'N/A'}</p>
                <p><strong>Transmisión:</strong> {autoActual.TransmisionNombre || 'N/A'}</p>
                <p><strong>Capacidad:</strong> {autoActual.Capacidad ? `${autoActual.Capacidad} pasajeros` : 'N/A'}</p>
                <p>
                  <strong>Estado:</strong> 
                  <Tag color={autoActual.Estado === "Disponible" ? "green" : "red"} style={{ marginLeft: 8 }}>
                    {autoActual.Estado || 'N/A'}
                  </Tag>
                </p>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <h4>Precios</h4>
                <p><strong>Precio/día:</strong> ${autoActual.PrecioDia ? parseFloat(autoActual.PrecioDia).toFixed(2) : '0.00'}</p>
                {autoActual.PorcentajeDescuento && autoActual.PorcentajeDescuento > 0 && (
                  <p><strong>Descuento:</strong> {autoActual.PorcentajeDescuento}%</p>
                )}
              </Col>

              <Col span={12}>
                <h4>Ubicación</h4>
                <p><strong>Sucursal:</strong> {autoActual.SucursalNombre || (autoActual.IdSucursal ? `ID: ${autoActual.IdSucursal}` : 'N/A')}</p>
              </Col>
            </Row>

            {autoActual.Descripcion && (
              <div style={{ marginTop: '16px' }}>
                <h4>Descripción</h4>
                <p>{autoActual.Descripcion}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AutosView;