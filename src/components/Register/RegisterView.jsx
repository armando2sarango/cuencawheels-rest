import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Divider, Select, InputNumber, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import {UserOutlined,MailOutlined,LockOutlined,HomeOutlined,IdcardOutlined,LoadingOutlined} from '@ant-design/icons';
import '../Login/Auth.css'; // CSS unificado
import { validateName, validatePassword, validateAge, validateEmail, validateDocument } from '../../utils/validations';

const { Title, Text, Link } = Typography;
const { Option } = Select;

const RegisterView = ({ onRegister, loading }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [paises, setPaises] = useState([]); 
  const [cargandoPaises, setCargandoPaises] = useState(false);
  const tipoIdentificacion = Form.useWatch('tipoIdentificacion', form);

  const getConfigIdentificacion = () => {
    switch (tipoIdentificacion) {
      case 'RUC':
        return {
          label: 'Número de RUC',
          placeholder: 'Ej: 1710000000001 (13 dígitos)',
          pattern: /^\d{13}$/,
          message: 'El RUC debe tener 13 números exactos',
          maxLength: 13
        };
      case 'Pasaporte':
        return {
          label: 'Número de Pasaporte',
          placeholder: 'Ej: A12345678',
          pattern: /^[a-zA-Z0-9]{5,20}$/,
          message: 'El pasaporte debe ser alfanumérico (5-20 caracteres)',
          maxLength: 20
        };
      case 'Cédula':
      default:
        return {
          label: 'Número de Cédula',
          placeholder: 'Ej: 1712345678 (10 dígitos)',
          pattern: /^\d{10}$/,
          message: 'La cédula debe tener 10 números exactos',
          maxLength: 10
        };
    }
  };

  useEffect(() => {
    const cargarPaises = async () => {
      setCargandoPaises(true);
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name');
        const data = await response.json();

        const listaOrdenada = data.map(pais => {
          return pais.name.nativeName?.spa?.common || 
                 pais.name.translations?.spa?.common || 
                 pais.name.common;
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

  const idConfig = getConfigIdentificacion();

  const onFinish = (values) => {
    onRegister(values);
  };

  return (
    <div className="register-container">
      <Card className="register-card" bordered={false}>
        <div className="register-header">
          <Title level={2} className="register-title">Crear Cuenta</Title>
          <Text className="register-subtitle">
            Únete y disfruta de nuestros servicios
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          size="large"
          onFinish={onFinish}
          className="register-form"
          initialValues={{ 
            pais: '',
            tipoIdentificacion: 'Cédula',
            edad: ""
          }}
          scrollToFirstError
        >
          {/* NOMBRE Y APELLIDO */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="nombre"
              label="Nombre"
              style={{ flex: 1 }}
                rules={[
                  { required: true, message: 'Campo requerido' },
                  { 
                    validator: async (_, value) => {
                      const error = validateName(value);
                      if (error) {
                        // Antd espera un Promise.reject con el mensaje de error
                        return Promise.reject(new Error(error));
                      }
                      return Promise.resolve();
                    }
                  },
                ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Ej: Juan" />
            </Form.Item>

            <Form.Item
              name="apellido"
              label="Apellido"
              style={{ flex: 1 }}
              rules={[
                      { required: true, message: 'Campo requerido' },
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
              <Input prefix={<UserOutlined />} placeholder="Ej: Pérez" />
            </Form.Item>
          </div>

          {/* EMAIL */}
          <Form.Item
            name="email"
            label="Correo Electrónico"
            rules={[
              { required: true, message: 'Ingresa tu correo' },
              { 
                validator: async (_, value) => {
                  const error = validateEmail(value);
                  if (error) {
                    return Promise.reject(new Error(error));
                  }
                  return Promise.resolve();
                }
              },
            ]}
          
          >
            <Input prefix={<MailOutlined />} placeholder="nombre@ejemplo.com" />
          </Form.Item>

          {/* IDENTIFICACIÓN (Dinámica) */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="tipoIdentificacion"
              label="Tipo ID"
              style={{ width: '140px' }}
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="Cédula">Cédula</Option>
                <Option value="Pasaporte">Pasaporte</Option>
                <Option value="RUC">RUC</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="identificacion"
              label={idConfig.label}
              style={{ flex: 1 }}
              rules={[
                { required: true, message: 'Ingresa el número' },
                { pattern: idConfig.pattern, message: idConfig.message }
              ]}
            >
              <Input 
                prefix={<IdcardOutlined />} 
                placeholder={idConfig.placeholder} 
                maxLength={idConfig.maxLength}
              />
            </Form.Item>
          </div>

          {/* EDAD Y PAÍS */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="edad"
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

            <Form.Item
              name="pais"
              label="País"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Selecciona tu país' }]}
            >
              <Select
                showSearch
                placeholder={cargandoPaises ? "Cargando..." : "Busca tu país"}
                loading={cargandoPaises}
                notFoundContent={cargandoPaises ? <Spin size="small" /> : "No encontrado"}
                filterOption={(input, option) => {
                  const textoPais = String(option?.value || '');
                  return textoPais.toLowerCase().includes(input.toLowerCase());
                }}
                dropdownMatchSelectWidth={false} 
                dropdownStyle={{ minWidth: '200px', maxWidth: '300px' }}
              >
                {paises.map((pais, index) => (
                  <Option key={`${pais}-${index}`} value={pais}>
                    <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {pais}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* DIRECCIÓN */}
          <Form.Item
            name="direccion"
            label="Dirección Domiciliaria"
            rules={[
              { required: true, message: 'La dirección es obligatoria' },
              { min: 5, message: 'La dirección es muy corta' }
            ]}
          >
            <Input 
              prefix={<HomeOutlined />} 
              placeholder="Calle principal, número y secundaria" 
            />
          </Form.Item>

          {/* CONTRASEÑA */}
          <Form.Item
            name="password"
            label="Contraseña"
            rules={[
                  { required: true, message: 'Crea una contraseña' },
                  { 
                    validator: async (_, value) => {
                      const error = validatePassword(value);
                      if (error) {
                        return Promise.reject(new Error(error));
                      }
                      return Promise.resolve();
                    }
                  },
                ]}
            hasFeedback
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Min. 8 chars, Mayús, Minús, Número y Símbolo"
            />
          </Form.Item>

          {/* CONFIRMAR CONTRASEÑA */}
          <Form.Item
            name="confirmPassword"
            label="Confirmar Contraseña"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Por favor confirma tu contraseña' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('¡Las contraseñas no coinciden!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Vuelve a escribir la contraseña" 
            />
          </Form.Item>

          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            className="register-button"
            loading={loading} 
          >
            {loading ? 'Registrando...' : 'Crear mi cuenta'}
          </Button>

          <Divider className="register-divider" />
          
          <div className="login-section">
            <Text className="login-text">
              ¿Ya tienes cuenta?{' '}
              <Link onClick={() => navigate('/login')} className="login-link">
                Inicia sesión
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterView;