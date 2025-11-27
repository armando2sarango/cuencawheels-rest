// src/components/Autos/AutosView.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Modal, Form, Input, InputNumber, Select, Row, Col, 
  Tag, message, Tooltip, Space, Empty, Divider,DatePicker
} from 'antd';
import { isAdmin } from '../../services/auth';
import { 
  ExclamationCircleOutlined, EyeOutlined, EditOutlined, 
  DeleteOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, ClearOutlined,ShoppingCartOutlined
} from '@ant-design/icons';
import './Autos.css';
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const AutosView = ({ 
  
  autos = [], 
  loading, 
  error, 
  onEditar, 
  onEliminar, 
  onCrear,
  onBuscar, 
  onRefresh,
  onAgregarCarrito,
  checkAuth, 
  navigate,
  api
}) => {
   const userIsAdmin = isAdmin(); 
  // 1. NUEVOS ESTADOS PARA EL CARRITO
  const [modalReservaVisible, setModalReservaVisible] = useState(false);
  const [autoAReservar, setAutoAReservar] = useState(null);
  const [fechasReserva, setFechasReserva] = useState([]);
  const [reservaLoading, setReservaLoading] = useState(false);
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

  // ============= LÓGICA DE FILTRADO =============
const abrirModalReserva = (auto) => {
    setAutoAReservar(auto);
    setModalReservaVisible(true);
  };
const handleInitialReserveClick = (auto) => {
    // Solo ejecutamos checkAuth(). Si devuelve false, el padre muestra la alerta.
    // Si devuelve true, procedemos a abrir el modal.
    if (checkAuth()) {
        abrirModalReserva(auto);
    }
  };
const handleConfirmarReserva = async () => {
    if (!fechasReserva || fechasReserva.length === 0) {
      message.error("Por favor selecciona las fechas de renta");
      return;
    }

    setReservaLoading(true);
    try {
        const fechaInicio = fechasReserva[0]?.toISOString();
        const fechaFin = fechasReserva[1]?.toISOString();
        const fechasFormat = [fechaInicio, fechaFin];
        const success = await onAgregarCarrito(autoAReservar.IdVehiculo, fechasFormat);
        setReservaLoading(false);
        if (success === true) {
            console.log("5. Éxito. Cerrando modal.");
            setModalReservaVisible(false);
            setFechasReserva([]);
            setAutoAReservar(null);
        } else {
            console.warn("5. Fallo. El padre devolvió false. El modal NO se cerrará.");
        }
    } catch (error) {
        console.error("ERROR CRÍTICO EN LA VISTA:", error);
        setReservaLoading(false);
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
          PrecioActual: parseFloat(auto.PrecioActual) || 0,
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
          IdCategoria: 1,
          IdTransmision: 1,
          Capacidad: 5,
          Estado: 'Disponible',
          IdSucursal: 1,
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
        
        const payload = {
          Marca: values.Marca,
          Modelo: values.Modelo,
          Anio: parseInt(values.Anio),
          IdCategoria: parseInt(values.IdCategoria),
          IdTransmision: parseInt(values.IdTransmision),
          Capacidad: parseInt(values.Capacidad) || 5,
          PrecioDia: parseFloat(values.PrecioDia) || 0,
          PrecioNormal: parseFloat(values.PrecioNormal) || 0,
          PrecioActual: parseFloat(values.PrecioActual) || parseFloat(values.PrecioDia) || 0,
          Matricula: values.Matricula || '',
          IdPromocion: values.IdPromocion ? parseInt(values.IdPromocion) : null,
          PorcentajeDescuento: parseFloat(values.PorcentajeDescuento) || 0,
          Estado: values.Estado || 'Disponible',
          Descripcion: values.Descripcion || '',
          IdSucursal: parseInt(values.IdSucursal),
          UrlImagen: values.UrlImagen || ''
        };

        if (autoActual) {
          payload.IdVehiculo = autoActual.IdVehiculo;
        }
        let success = false;
        if (autoActual) {
          success = await onEditar(autoActual.IdVehiculo, payload);
        } else {
          success = await onCrear(payload);
        }

        if (success) cerrarModal();
      } catch (error) {
        console.error('❌ Error en validación del formulario:', error);
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


  // ============= RENDER =============
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
                       {/* Filtro de Categoría */}
            <Form.Item name="IdCategoria" style={{ minWidth: 150 }}>
                <Select placeholder="Categoría" allowClear>
                    {/* CAMBIO CLAVE: value es el TEXTO, no el ID */}
                    <Option value="Sedán">Sedán</Option>
                    <Option value="SUV">SUV</Option>
                    <Option value="Hatchback">Hatchback</Option>
                    <Option value="Pickup">Pickup</Option>
                    <Option value="Deportivo">Deportivo</Option>
                </Select>
            </Form.Item>

            {/* Filtro de Transmisión */}
            <Form.Item name="IdTransmision" style={{ minWidth: 150 }}>
                <Select placeholder="Transmisión" allowClear>
                    {/* CAMBIO CLAVE: value es el TEXTO */}
                    <Option value="Automática">Automática</Option>
                    <Option value="Manual">Manual</Option>
                </Select>
            </Form.Item>


            {/* Filtro de Estado */}
            <Form.Item name="Estado" style={{ minWidth: 150 }}>
                <Select placeholder="Estado" allowClear>
                    <Option value="Disponible">Disponible</Option>
                    <Option value="Rentado">Rentado</Option>
                    <Option value="No Disponible">No Disponible</Option>
                </Select>
            </Form.Item>

            {/* Botones */}
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
                    <Tooltip title="Añadir al Carrito">
                      <Button 
                        type="text"
                        icon={<ShoppingCartOutlined style={{ fontSize: '18px', color: '#1890ff' }} />}
                        onClick={() => handleInitialReserveClick(auto)}
                        
                        disabled={auto.Estado !== 'Disponible'} 
                      >
                        Reservar
                      </Button>
                    </Tooltip>,
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
                        <p style={{ margin: '4px 0', fontSize: '18px', color: '#52c41a' }}>
                          <strong>${parseFloat(auto.PrecioDia || 0).toFixed(2)}</strong> / día
                        </p>
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
              <Form.Item 
                name="Marca" 
                label="Marca" 
                rules={[{ required: true, message: 'Ingresa la marca' }]}
              >
                <Input placeholder="Ej: Toyota" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="Modelo" 
                label="Modelo" 
                rules={[{ required: true, message: 'Ingresa el modelo' }]}
              >
                <Input placeholder="Ej: Corolla" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="Anio" 
                label="Año" 
                rules={[{ required: true, message: 'Ingresa el año' }]}
              >
                <InputNumber 
                  placeholder="2024" 
                  min={1900} 
                  max={2030} 
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item 
                name="IdCategoria" 
                label="Categoría" 
                rules={[{ required: true }]}
              >
                <Select placeholder="Selecciona categoría">
                  <Option value={1}>Sedán</Option>
                  <Option value={2}>SUV</Option>
                  <Option value={3}>Hatchback</Option>
                  <Option value={4}>Pickup</Option>
                  <Option value={5}>Deportivo</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="IdTransmision" 
                label="Transmisión" 
                rules={[{ required: true }]}
              >
                <Select placeholder="Tipo de transmisión">
                  <Option value={1}>Automática</Option>
                  <Option value={2}>Manual</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="Capacidad" 
                label="Capacidad" 
                rules={[{ required: true }]}
              >
                <InputNumber 
                  placeholder="5" 
                  min={2} 
                  max={15} 
                  style={{ width: '100%' }} 
                  addonAfter="pasajeros"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item 
                name="PrecioDia" 
                label="Precio por día" 
                rules={[{ required: true }]}
              >
                <InputNumber 
                  placeholder="50.00" 
                  min={0} 
                  step={0.01} 
                  precision={2} 
                  style={{ width: '100%' }} 
                  prefix="$" 
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="PrecioNormal" 
                label="Precio Normal"
              >
                <InputNumber 
                  placeholder="60.00" 
                  min={0} 
                  step={0.01} 
                  precision={2} 
                  style={{ width: '100%' }} 
                  prefix="$" 
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="PrecioActual" 
                label="Precio Actual"
              >
                <InputNumber 
                  placeholder="50.00" 
                  min={0} 
                  step={0.01} 
                  precision={2} 
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
              >
                <Input placeholder="ABC-1234" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="Estado" 
                label="Estado" 
                rules={[{ required: true }]}
              >
                <Select placeholder="Estado del vehículo">
                  <Option value="Disponible">Disponible</Option>
                  <Option value="No Disponible">No Disponible</Option>
                  <Option value="En Mantenimiento">En Mantenimiento</Option>
                  <Option value="Rentado">Rentado</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="IdSucursal" 
                label="Sucursal" 
                rules={[{ required: true }]}
              >
                <InputNumber 
                  placeholder="1" 
                  min={1} 
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="PorcentajeDescuento" 
                label="% Descuento"
              >
                <InputNumber 
                  placeholder="0" 
                  min={0} 
                  max={100} 
                  style={{ width: '100%' }} 
                  addonAfter="%"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="UrlImagen" 
            label="URL de Imagen"
          >
            <Input placeholder="https://ejemplo.com/imagen.jpg" />
          </Form.Item>

          <Form.Item 
            name="Descripcion" 
            label="Descripción"
          >
            <TextArea 
              rows={3} 
              placeholder="Descripción del vehículo..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL ELIMINAR */}
      {/* ... (el código del Modal Eliminar sigue igual) ... */}
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

      {/* MODAL DETALLES */}
      {/* ... (el código del Modal Detalles sigue igual) ... */}
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
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px', 
                    borderRadius: '8px' 
                  }}
                  onError={(e) => { 
                    e.target.src = 'https://via.placeholder.com/300x200?text=Sin+Imagen'; 
                  }}
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
                  <Tag 
                    color={autoActual.Estado === "Disponible" ? "green" : "red"} 
                    style={{ marginLeft: 8 }}
                  >
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
                {autoActual.PromocionNombre && (
                  <p><strong>Promoción:</strong> {autoActual.PromocionNombre}</p>
                )}
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
      {/* MODAL DE RESERVA (FECHAS) */}
      <Modal
        title={`Reservar ${autoAReservar?.Marca} ${autoAReservar?.Modelo}`}
        open={modalReservaVisible}
        onOk={handleConfirmarReserva}
        onCancel={() => setModalReservaVisible(false)}
        okText="Añadir al Carrito"
        cancelText="Cancelar"
        confirmLoading={reservaLoading}
      >
        <div style={{ padding: '20px 0' }}>
          <p>Selecciona las fechas para tu renta:</p>
          <RangePicker 
            style={{ width: '100%' }}
            onChange={(dates) => setFechasReserva(dates)}
            // Deshabilitar fechas pasadas (opcional)
            // disabledDate={(current) => current && current < new Date().setHours(0,0,0,0)} 
          />
          
          {autoAReservar && (
            <div style={{ marginTop: 20, background: '#f5f5f5', padding: 10, borderRadius: 4 }}>
              <p style={{ margin: 0 }}><strong>Precio por día:</strong> ${autoAReservar.PrecioDia}</p>
              {fechasReserva && fechasReserva[1] && (
                <p style={{ margin: '5px 0 0 0', color: '#1890ff', fontWeight: 'bold' }}>
                  Total estimado: $
                  {(autoAReservar.PrecioDia * (fechasReserva[1].diff(fechasReserva[0], 'days') + 1)).toFixed(2)}
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AutosView;