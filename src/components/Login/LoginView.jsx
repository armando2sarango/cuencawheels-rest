import React from 'react';
import { Form, Input, Button, Card, Typography, Divider, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import './Auth.css';

const { Title, Text, Link } = Typography;

const LoginView = ({ loading, error, onLogin, onNavigateRegister }) => {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    // onFinish pasa los valores que ya fueron limpiados por normalize (ver abajo)
    onLogin(values.email, values.password, values.rememberMe); 
    // NOTA: La lógica de trim en handleLogin (LoginPage) ahora es redundante pero sirve como doble seguridad.
  };

  // ✅ Función de normalización: Limpia el valor antes de guardarlo en el estado del formulario.
  // Esto previene que los espacios se guarden y envíen.
  const trimNormalize = (value) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  };

  return (
    <div className="login-container">
      <Card className="login-card" bordered={false}>
        <div className="login-header">
          <Title level={2} className="login-title">¡Bienvenido de vuelta!</Title>
          <Text className="login-subtitle">Ingresa tus credenciales para continuar</Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          className="login-form"
          initialValues={{ rememberMe: true }}
        >
          <Form.Item
            name="email"
            label="Correo Electrónico"
            rules={[
              { required: true, message: 'Por favor ingresa tu correo electrónico' },
              { type: 'email', message: 'Por favor ingresa un correo válido' },
            ]}
            // ✅ AGREGADO: Normaliza/limpia el valor antes de que se guarde.
            normalize={trimNormalize} 
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="correo@ejemplo.com" 
              autoComplete="email" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Contraseña"
            rules={[
              { required: true, message: 'Por favor ingresa tu contraseña' },
              { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
            ]}
            // ✅ AGREGADO: Normaliza/limpia el valor antes de que se guarde.
            normalize={trimNormalize} 
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Tu contraseña" 
              autoComplete="current-password" 
            />
          </Form.Item>

          <Form.Item name="rememberMe" valuePropName="checked">
            <Checkbox>Recordar mi sesión</Checkbox>
          </Form.Item>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              className="login-button"
              loading={loading}
            >
              Iniciar Sesión
            </Button>
          </Form.Item>
        </Form>

        <Divider className="login-divider" />

        <div className="register-section">
          <Text className="register-text">
            ¿No tienes una cuenta?{' '}
            <Link onClick={onNavigateRegister} className="register-link">
              Créala aquí
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginView;