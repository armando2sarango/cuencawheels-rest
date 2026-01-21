// src/components/Autos/AutosView.jsx
import React, { useState } from 'react';
import { Card, Button, Modal, Form, Input, InputNumber, Select, Row, Col, Tag, message, Tooltip, Space, Empty, Typography} from 'antd';
import { isAdmin } from '../../services/auth';
import { ExclamationCircleOutlined, EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, ClearOutlined, ShoppingCartOutlined} from '@ant-design/icons';
import './Autos.css';
import { validatePlate, validateAnio, validateModelo, validatePrecio, validateImageUrl } from '../../utils/validations';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const AutosView = ({ 
  autos = [], 
  loading, 
  // quitamos 'error' porque no se usa
  onEditar, 
  onEliminar, 
  onCrear, 
  // quitamos 'onBuscar' porque usas filtrado local
  onRefresh, 
  onAgregarCarrito, 
  checkAuth
}) => {

  const userIsAdmin = isAdmin(); 
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);
  const [detallesVisible, setDetallesVisible] = useState(false);
  const [autoActual, setAutoActual] = useState(null);
  const [autoAEliminar, setAutoAEliminar] = useState(null);
  const [eliminandoAuto, setEliminandoAuto] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // 🆕 Estados para filtros locales
  const [filtrosActivos, setFiltrosActivos] = useState({});
  
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  
  const listaAutos = Array.isArray(autos) ? autos : [];
  
  // 🆕 FUNCIÓN DE FILTRADO LOCAL
  const autosFiltrados = React.useMemo(() => {
    if (Object.keys(filtrosActivos).length === 0) {
      return listaAutos; // Sin filtros, devolver todo
    }
    
    return listaAutos.filter(auto => {
      let cumpleFiltros = true;
      
      // Filtrar por categoría
      if (filtrosActivos.categoria) {
        cumpleFiltros = cumpleFiltros && auto.categoriaNombre === filtrosActivos.categoria;
      }
      
      // Filtrar por transmisión
      if (filtrosActivos.transmision) {
        cumpleFiltros = cumpleFiltros && auto.transmisionNombre === filtrosActivos.transmision;
      }
      
      // Filtrar por estado
      if (filtrosActivos.estado) {
        cumpleFiltros = cumpleFiltros && auto.estado === filtrosActivos.estado;
      }
      
      return cumpleFiltros;
    });
  }, [listaAutos, filtrosActivos]);
  
  const handleAddToCart = (auto) => {
    if (checkAuth()) {
      onAgregarCarrito(auto.idVehiculo);
    }
  };

  const handleFilterSearch = (values) => {
    const filtros = {};
    
    // Construir objeto de filtros solo con valores seleccionados
    if (values.IdCategoria) filtros.categoria = values.IdCategoria;
    if (values.IdTransmision) filtros.transmision = values.IdTransmision;
    if (values.Estado) filtros.estado = values.Estado;
    
    // Actualizar filtros activos para el filtrado local
    setFiltrosActivos(filtros);
  };

  const handleClearFilters = () => {
    filterForm.resetFields();
    setFiltrosActivos({}); // Limpiar filtros locales
  };

  const abrirModal = (auto = null) => {
    setAutoActual(auto);
    if (auto) {
      form.setFieldsValue({
        Marca: auto.marca || '',
        Modelo: auto.modelo || '',
        Anio: auto.anio || new Date().getFullYear(),
        IdCategoria: auto.idCategoria || undefined,
        IdTransmision: auto.idTransmision || undefined,
        Capacidad: auto.capacidad || 5,
        PrecioDia: parseFloat(auto.precioDia) || 0,
        Matricula: auto.matricula || '',
        Estado: auto.estado || 'Disponible',
        Descripcion: auto.descripcion|| '',
        IdSucursal: auto.idSucursal || undefined,
        UrlImagen: auto.urlImagen || '',
        PorcentajeDescuento: auto.porcentajeDescuento || 0
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        Anio: new Date().getFullYear(),
        Estado: 'Disponible',
        Capacidad: 5,
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
      
      console.log('🔍 Valores del formulario:', values);
      
      // Función helper para limpiar valores
      const cleanValue = (value, type = 'string') => {
        if (value === '' || value === null || value === undefined) {
          return null;
        }
        
        switch(type) {
          case 'int':
            const intValue = parseInt(value);
            return isNaN(intValue) ? null : intValue;
          case 'float':
            const floatValue = parseFloat(value);
            return isNaN(floatValue) ? null : floatValue;
          default:
            if (typeof value === 'string') {
              const trimmed = value.trim();
              return trimmed === '' ? null : trimmed;
            }
            return value;
        }
      };
      
      // ✅ CONSTRUIR PAYLOAD CON NOMBRES CORRECTOS
      const precioDiaValue = cleanValue(values.PrecioDia, 'float') || 0;
      
      const payload = {
        marca: cleanValue(values.Marca),
        modelo: cleanValue(values.Modelo),
        anio: cleanValue(values.Anio, 'int'),
        IdCategoria: cleanValue(values.IdCategoria, 'int'),
        IdTransmision: cleanValue(values.IdTransmision, 'int'),
        capacidad: cleanValue(values.Capacidad, 'int') || 5,
        precioDia: precioDiaValue,
        PrecioNormal: precioDiaValue, // ← AGREGADO: mismo valor que precioDia
        PrecioActual: precioDiaValue, // ← AGREGADO: mismo valor que precioDia
        matricula: cleanValue(values.Matricula),
        estado: cleanValue(values.Estado) || 'Disponible',
        Descripcion: cleanValue(values.Descripcion),
        idSucursal: cleanValue(values.IdSucursal, 'int'),
        urlImagen: cleanValue(values.UrlImagen),
        PorcentajeDescuento: cleanValue(values.PorcentajeDescuento, 'float') || 0
      };

      // 🚨 VALIDACIÓN: asegurarse de que los campos requeridos no sean null
      if (!payload.marca) {
        message.error('La marca es requerida');
        return;
      }
      if (!payload.Descripcion) { // Nota: aquí sí usas Mayúscula porque viene del form values
    message.error('La descripción es requerida');
    return;
}
      if (!payload.modelo) {
        message.error('El modelo es requerido');
        return;
      }
      if (!payload.anio) {
        message.error('El año es requerido');
        return;
      }
      if (!payload.matricula) {
        message.error('La matrícula es requerida');
        return;
      }
      if (!payload.IdCategoria) {
        message.error('La categoría es requerida');
        return;
      }
      if (!payload.IdTransmision) {
        message.error('La transmisión es requerida');
        return;
      }
      if (!payload.idSucursal) {
        message.error('La sucursal es requerida');
        return;
      }

      // Eliminar claves vacías/null (excepto campos opcionales como Descripcion y urlImagen)
      const cleanedPayload = {};
      for (const [key, value] of Object.entries(payload)) {
        // Incluir campos opcionales aunque sean null
        if (key === 'Descripcion' || key === 'urlImagen' || key === 'PorcentajeDescuento') {
          cleanedPayload[key] = value;
        } else if (value !== null && value !== undefined) {
          // Para el resto, solo incluir si tienen valor
          cleanedPayload[key] = value;
        }
      }

      if (autoActual) {
        cleanedPayload.idVehiculo = autoActual.idVehiculo;
      }

      console.log('📤 Payload limpio a enviar:', cleanedPayload);

      let success = false;
      if (autoActual) {
        success = await onEditar(autoActual.idVehiculo, cleanedPayload);
      } else {
        success = await onCrear(cleanedPayload);
      }

      if (success) cerrarModal();
    } catch (error) {
      console.error('❌ Error en validación del formulario:', error);
      message.error('Por favor completa todos los campos requeridos');
    } finally {
      setSubmitLoading(false);
    }
  };

  const abrirModalEliminar = (auto) => {
    setAutoAEliminar(auto);
    setModalEliminarVisible(true);
  };

  const confirmarEliminar = async () => {
    if (!autoAEliminar) return;
    
    setEliminandoAuto(true);
    try {
      const resultado = await onEliminar(autoAEliminar.idVehiculo);
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
              <Option value="SEDÁN">Sedán</Option>
              <Option value="SUV">SUV</Option>
              <Option value="LUJO">Lujo</Option>
              <Option value="DEPORTIVO">Deportivo</Option>
            </Select>
          </Form.Item>

          <Form.Item name="IdTransmision" style={{ minWidth: 150 }}>
            <Select placeholder="Transmisión" allowClear>
              <Option value="AUTOMÁTICA">Automática</Option>
              <Option value="MANUAL">Manual</Option>
            </Select>
          </Form.Item>

          <Form.Item name="Estado" style={{ minWidth: 150 }}>
            <Select placeholder="Estado" allowClear>
              <Option value="Disponible">Disponible</Option>
              <Option value="Rentado">Rentado</Option>
              <Option value="En Mantenimiento">En Mantenimiento</Option>
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
        <h2 style={{ margin: 0 }}>
          Gestión de Vehículos ({autosFiltrados.length}
          {Object.keys(filtrosActivos).length > 0 && ` de ${listaAutos.length}`})
        </h2>
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

      {autosFiltrados.length === 0 ? (
        <Empty 
          description={Object.keys(filtrosActivos).length > 0 
            ? "No se encontraron vehículos con los filtros seleccionados" 
            : "No hay vehículos disponibles"
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          {userIsAdmin && Object.keys(filtrosActivos).length === 0 && (
            <Button type="primary" onClick={() => abrirModal()}>
              Crear primer vehículo
            </Button>
          )}
          {Object.keys(filtrosActivos).length > 0 && (
            <Button onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          )}
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {autosFiltrados.map((auto) => (
            <Col key={auto.idVehiculo} xs={24} sm={12} md={8} lg={6}>
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
                    {auto.urlImagen ? (
                      <img
                        alt={`${auto.marca} ${auto.modelo}`}
                        src={auto.urlImagen}
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
                      <Tag color={auto.estado === "Disponible" ? "green" : "red"}>
                        {auto.estado}
                      </Tag>
                      {auto.categoriaNombre && (
                        <Tag color="blue">{auto.categoriaNombre}</Tag>
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
                        disabled={auto.estado !== 'Disponible'}
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
                    </Tooltip>
                  ),
                  userIsAdmin && (
                    <Tooltip title="Eliminar">
                      <Button 
                        type="link" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => abrirModalEliminar(auto)}
                      />
                    </Tooltip>
                  ),
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
                  title={`${auto.marca} ${auto.modelo}`}
                  description={
                    <div>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Año:</strong> {auto.anio}
                      </p> 
                      {auto.EnPromocion ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '4px 0' }}>
                          <Text delete type="secondary" style={{ fontSize: '13px' }}>
                            Antes: ${parseFloat(auto.precioDia).toFixed(2)}
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
                          <strong>${parseFloat(auto.precioDia || 0).toFixed(2)}</strong> / día
                        </p>
                      )}
                      {auto.transmisionNombre && (
                        <Tag style={{ marginTop: '8px' }}>{auto.transmisionNombre}</Tag>
                      )}
                      {auto.capacidad && (
                        <Tag>{auto.capacidad} pasajeros</Tag>
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
        title={autoActual ? `Editar ${autoActual.marca} ${autoActual.modelo}` : 'Crear Nuevo Vehículo'}
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
              <Form.Item name="Marca" label="Marca" rules={[{ required: true, message: 'La marca es requerida' }]}>
                <Input placeholder="Ej: Toyota" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="Modelo" 
                label="Modelo"
                rules={[
                  { required: true, message: 'El modelo es requerido' },
                  {
                    validator: (_, value) => {
                      const error = validateModelo(value);
                      return error ? Promise.reject(new Error(error)) : Promise.resolve();
                    }
                  }
                ]}
              >
                <Input placeholder="Ej: Corolla" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="Anio"
                label="Año"
                rules={[
                  { required: true, message: 'El año es requerido' },
                  {
                    validator: (_, value) => {
                      const error = validateAnio(value);
                      return error ? Promise.reject(new Error(error)) : Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber placeholder="Ej: 2024" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="IdCategoria" label="Categoría" rules={[{ required: true, message: 'Selecciona una categoría' }]}>
                <Select placeholder="Selecciona categoría">
                  <Option value={1}>Sedán</Option>
                  <Option value={2}>SUV</Option>
                  <Option value={3}>Deportivo</Option>
                  <Option value={4}>Lujo</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="IdTransmision" label="Transmisión" rules={[{ required: true, message: 'Selecciona una transmisión' }]}>
                <Select placeholder="Tipo de transmisión">
                  <Option value={1}>Automática</Option>
                  <Option value={2}>Manual</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="Capacidad" label="Capacidad" rules={[{ required: true, message: 'La capacidad es requerida' }]}>
                <InputNumber placeholder="5" min={2} max={15} style={{ width: '100%' }} addonAfter="pasajeros"/>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item 
                name="PrecioDia"
                label="Precio por día"
                rules={[
                  { required: true, message: 'El precio es requerido' },
                  {
                    validator: (_, value) => {
                      const error = validatePrecio(value);
                      return error ? Promise.reject(new Error(error)) : Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber 
                  placeholder="0.00" 
                  min={0} 
                  step={0.01} 
                  style={{ width: '100%' }} 
                  prefix="$" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="Matricula"
                label="Matrícula"
                rules={[
                  { required: true, message: 'La matrícula es requerida' },
                  {
                    validator: (_, value) => {
                      const error = validatePlate(value);
                      return error ? Promise.reject(new Error(error)) : Promise.resolve();
                    }
                  }
                ]}
              >
                <Input
                  placeholder="ABC-1234"
                  onChange={(e) => {
                    form.setFieldValue('Matricula', e.target.value.toUpperCase());
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Estado" label="Estado" rules={[{ required: true, message: 'Selecciona un estado' }]}>
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
              <Form.Item name="IdSucursal" label="Sucursal" rules={[{ required: true, message: 'La sucursal es requerida' }]}>
                <InputNumber placeholder="1" min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="PorcentajeDescuento" label="% Descuento">
                <InputNumber placeholder="0" min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="UrlImagen" 
            label="URL de Imagen"
            rules={[
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const error = validateImageUrl(value);
                  return error ? Promise.reject(new Error(error)) : Promise.resolve();
                }
              }
            ]}
          >
            <Input placeholder="https://ejemplo.com/imagen.jpg" />
          </Form.Item>

          <Form.Item name="Descripcion" label="Descripción"
          rules={[
              { required: true, message: 'La descripción es requerida' },
              { min: 10, message: 'La descripción debe tener al menos 10 caracteres' } // Opcional: validación de longitud
            ]}>
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
                Se eliminará permanentemente <strong>{autoAEliminar.marca} {autoAEliminar.modelo}</strong>
                <br />
                ID: {autoAEliminar.idVehiculo} | Año: {autoAEliminar.anio}
              </p>
            )}
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        title={`Detalles - ${autoActual?.marca || ''} ${autoActual?.modelo || ''}`}
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
            {autoActual.urlImagen && (
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img
                  src={autoActual.urlImagen}
                  alt={`${autoActual.marca} ${autoActual.modelo}`}
                  style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Sin+Imagen'; }}
                />
              </div>
            )}

            <Row gutter={16}>
              <Col span={12}>
                <h4>Información Básica</h4>
                <p><strong>ID:</strong> {autoActual.idVehiculo || 'N/A'}</p>
                <p><strong>Marca:</strong> {autoActual.marca || 'N/A'}</p>
                <p><strong>Modelo:</strong> {autoActual.modelo || 'N/A'}</p>
                <p><strong>Año:</strong> {autoActual.anio || 'N/A'}</p>
                <p><strong>Matrícula:</strong> {autoActual.matricula || 'N/A'}</p>
              </Col>

              <Col span={12}>
                <h4>Especificaciones</h4>
                <p><strong>Categoría:</strong> {autoActual.categoriaNombre || 'N/A'}</p>
                <p><strong>Transmisión:</strong> {autoActual.transmisionNombre || 'N/A'}</p>
                <p><strong>Capacidad:</strong> {autoActual.capacidad ? `${autoActual.capacidad} pasajeros` : 'N/A'}</p>
                <p>
                  <strong>Estado:</strong> 
                  <Tag color={autoActual.estado === "Disponible" ? "green" : "red"} style={{ marginLeft: 8 }}>
                    {autoActual.estado || 'N/A'}
                  </Tag>
                </p>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <h4>Precios</h4>
                <p><strong>Precio/día:</strong> ${autoActual.precioDia ? parseFloat(autoActual.precioDia).toFixed(2) : '0.00'}</p>
                {autoActual.PorcentajeDescuento && autoActual.PorcentajeDescuento > 0 && (
                  <p><strong>Descuento:</strong> {autoActual.PorcentajeDescuento}%</p>
                )}
              </Col>

              <Col span={12}>
                <h4>Ubicación</h4>
                <p><strong>Sucursal:</strong> {autoActual.sucursalNombre || (autoActual.idSucursal ? `ID: ${autoActual.idSucursal}` : 'N/A')}</p>
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