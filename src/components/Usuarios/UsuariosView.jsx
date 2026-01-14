import React, { useState,useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, InputNumber, Row, Col, Tag } from 'antd';
import { UserOutlined,MailOutlined,PhoneOutlined,HomeOutlined,IdcardOutlined,LockOutlined,GlobalOutlined} from '@ant-design/icons';
import { validateName, validatePassword, validateAge, validateEmail, validateDocument } from '../../utils/validations';
import { isAdmin } from '../../services/auth';
const { Option } = Select;

const UsuariosView = ({ usuarios, loading, error, onCrear, onEditar, onEliminar }) => {
  const userIsAdmin = isAdmin();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);

  const [form] = Form.useForm();
  const [paises, setPaises] = useState([]); 
  const [cargandoPaises, setCargandoPaises] = useState(false);
  const tipoIdentificacion = Form.useWatch('TipoIdentificacion', form);

  const getConfigIdentificacion = () => {
    switch (tipoIdentificacion) {
      case 'RUC':
        return { label: 'Número de RUC', pattern: /^\d{13}$/, message: '13 dígitos requeridos', len: 13 };
      case 'Pasaporte':
        return { label: 'Pasaporte', pattern: /^[a-zA-Z0-9]{5,20}$/, message: 'Alfanumérico 5-20', len: 20 };
      case 'Cédula':
      default:
        return { label: 'Número de Cédula', pattern: /^\d{10}$/, message: '10 dígitos requeridos', len: 10 };
    }
  };
  
  const idConfig = getConfigIdentificacion();
  const abrirModal = (usuario = null) => {
    setUsuarioActual(usuario);

    if (usuario) {
      form.setFieldsValue({
        ...usuario,
        TipoIdentificacion: usuario.TipoIdentificacion || 'Cédula',
        Contrasena: "" 
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ 
        Rol: "Cliente",
        TipoIdentificacion: "Cédula",
        Pais: "Ecuador",
        Contrasena: '12345'
      });
    }
    setModalVisible(true);
  };
  useEffect(() => {
      const cargarPaises = async () => {
        setCargandoPaises(true);
        try {
          const response = await fetch('https://restcountries.com/v3.1/all?fields=name');
          const data = await response.json();
          const listaOrdenada = data.map(pais => {
              return pais.name.nativeName?.spa?.common || pais.name.translations?.spa?.common || pais.name.common;
          }).sort((a, b) => a.localeCompare(b)); 
          setPaises(listaOrdenada);
        } catch (error) {
          console.error("Error cargando países:", error);
          setPaises(["Ecuador", "Colombia", "Perú", "Estados Unidos", "España"]); 
        } finally {
          setCargandoPaises(false);
        }
      };
  
      cargarPaises();
    }, []);

  const cerrarModal = () => {
    form.resetFields();
    setUsuarioActual(null);
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      const data = {
        ...values,
        IdUsuario: usuarioActual ? usuarioActual.IdUsuario : 0
      };

      if (usuarioActual) await onEditar(data);
      else await onCrear(data);

      cerrarModal();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };
  const abrirModalEliminar = (usuario) => {
    setUsuarioAEliminar(usuario);
    setModalEliminarVisible(true);
  };

  const confirmarEliminar = async () => {
    try {
      await onEliminar(usuarioAEliminar.IdUsuario);
      setModalEliminarVisible(false);
    } catch (err) {
      message.error("Error al eliminar usuario");
    }
  };
  const columnas = [
    { title: "ID", dataIndex: "IdUsuario", width: 100 },
    { title: "Nombre", dataIndex: "Nombre", ellipsis: true },
    { title: "Apellido", dataIndex: "Apellido", ellipsis: true },
    { title: "Email", dataIndex: "Email", ellipsis: true },
    { title: "Cedula", dataIndex: "Identificacion" },
    { title: "Rol", dataIndex: "Rol", render: (rol) => <Tag color={rol === 'Administrador' || rol === 'Admin' ? 'blue' : 'green'}>{rol}</Tag> },
    {
      title: "Acciones",
      width: 180,
      render: (_, usuario) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <Button type="primary" size="small" onClick={() => abrirModal(usuario)}>Editar</Button>
          <Button danger size="small" onClick={() => abrirModalEliminar(usuario)}>Eliminar</Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
         <h2>Gestión de Usuarios</h2>
         <Button type="primary" onClick={() => abrirModal()}>+ Nuevo Usuario</Button>
      </div>

      <Table
        columns={columnas}
        dataSource={usuarios}
        loading={loading}
        rowKey={(u) => u.IdUsuario}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />
      <Modal
        title={usuarioActual ? `Editar: ${usuarioActual.Nombre}` : "Crear Nuevo Usuario"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={cerrarModal}
        confirmLoading={submitLoading}
        width={700}
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="Nombre" 
                label="Nombre" 
                rules={[
                  { required: true, message: 'El nombre es obligatorio' },
                  { 
                    validator: async (_, value) => {
                      const error = validateName(value);
                      if (error) {
                        return Promise.reject(new Error(error));
                      }
                      return Promise.resolve();
                    }
                  },
                ]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="Apellido" 
                label="Apellido" 
                rules={[
                   { required: true, message: 'El apellido es obligatorio' },
                   { 
                      validator: async (_, value) => {
                        const error = validateName(value);
                        if (error) {
                          return Promise.reject(new Error(error));
                        }
                        return Promise.resolve();
                      }
                    },
                ]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="Email" label="Email" rules={[
                  { required: true, message: 'El correo es obligatorio' },
                  { 
                    validator: async (_, value) => {
                      const error = validateEmail(value);
                      if (error) {
                        return Promise.reject(new Error(error));
                      }
                      return Promise.resolve();
                    }
                  },
                ]}>
                <Input prefix={<MailOutlined />} />
              </Form.Item>
            </Col>

<Col span={12}>
  <Form.Item 
    name="Contrasena" 
    label="Contraseña" 
    rules={[
      { required: !usuarioActual && !userIsAdmin, message: 'Contraseña requerida para crear' },
      { 
        validator: async (_, value) => {
            if (!value && usuarioActual) return Promise.resolve();
            if (!value && !usuarioActual && !userIsAdmin) return Promise.reject(new Error('La contraseña es obligatoria'));
            const error = validatePassword(value);
            if (error && value && !userIsAdmin) return Promise.reject(new Error(error));
            return Promise.resolve();
        }
      },
    ]}
    help={
      userIsAdmin 
        ? "Se asignará '12345' por defecto" 
        : (usuarioActual ? "Dejar vacío para mantener la actual" : "Min. 8 chars, Mayús, Minús, Número y Símbolo")
    }
  >
    <Input.Password 
      prefix={<LockOutlined />} 
      placeholder={userIsAdmin ? "12345 (por defecto)" : (usuarioActual ? "********" : "Nueva contraseña")}
      disabled={userIsAdmin && !usuarioActual} 
    />
  </Form.Item>
</Col>


          </Row>

          <Row gutter={16}>
             <Col span={8}>
                <Form.Item name="TipoIdentificacion" label="Tipo ID" rules={[{ required: true }]}>
                  <Select>
                    <Option value="Cédula">Cédula</Option>
                    <Option value="Pasaporte">Pasaporte</Option>
                    <Option value="RUC">RUC</Option>
                  </Select>
                </Form.Item>
             </Col>
             <Col span={16}>
                <Form.Item 
                  name="Identificacion" 
                  label={idConfig.label}
                  rules={[
                    { required: true, message: 'Requerido' },
                    { pattern: idConfig.pattern, message: idConfig.message }
                  ]}
                >
                  <Input prefix={<IdcardOutlined />} maxLength={idConfig.len} />
                </Form.Item>
             </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
                        <Form.Item
                          name="Edad"
                          label="Edad"
                          style={{ width: '120px' }}
                          rules={[
                            { required: true, message: 'Requerido' },
                            { type: 'number', min: 18, message: 'Debes ser mayor de 18 años.' },
                            { type: 'number', max: 70, message: 'La edad máxima permitida es 70 años.' } 
                          ]}
                        >
                          <InputNumber 
                            style={{ width: '100%' }}
                            placeholder="18"
                            min={18} 
                            max={70}
                          />
                        </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                            name="Pais"
                            label="País"
                            style={{ flex: 1 }}
                            rules={[{ required: true, message: 'Selecciona tu país' }]}
                          >
                            <Select
                              showSearch
                              placeholder={cargandoPaises ? "Cargando..." : "Busca tu país"}
                              loading={cargandoPaises}
                              optionFilterProp="children"
                              filterOption={(input, option) =>
                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                            >
                              {paises.map((pais, index) => (
                                <Option key={`${pais}-${index}`} value={pais}>
                                  {pais}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
            </Col>
          </Row>

          <Form.Item name="Direccion" label="Dirección" rules={[{ required: true }]}>
            <Input prefix={<HomeOutlined />} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
               <Form.Item name="Rol" label="Rol" rules={[{ required: true }]}>
                <Select>
                  <Option value="Cliente">Cliente</Option>
                  <Option value="Administrador">Administrador</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

        </Form>
      </Modal>
      <Modal
        title="Confirmar eliminación"
        open={modalEliminarVisible}
        okText="Eliminar"
        okButtonProps={{ danger: true }}
        onCancel={() => setModalEliminarVisible(false)}
        onOk={confirmarEliminar}
      >
        <p>¿Seguro que deseas eliminar a <strong>{usuarioAEliminar?.Nombre} {usuarioAEliminar?.Apellido}</strong>?</p>
        <p style={{color: 'red', fontSize: '12px'}}>Esta acción no se puede deshacer.</p>
      </Modal>

    </div>
  );
};

export default UsuariosView;