import React from 'react';
import { Menu, Layout, Button } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  CarOutlined,
  ShoppingCartOutlined, 
  CalendarOutlined,
  LogoutOutlined,
  SettingOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isAdmin, isAuthenticated } from '../services/auth';

const { Header } = Layout;

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userIsAdmin = isAdmin(); 
  const userIsLogged = isAuthenticated(); // Determina si el usuario está autenticado

  const selectedKey = (() => {
    // ... (lógica de selectedKey sin cambios)
    if (location.pathname.startsWith('/autos')) return 'autos';
    if (location.pathname.startsWith('/home')) return 'Home';
    if (location.pathname.startsWith('/usuarios')) return 'usuarios';
    if (location.pathname.startsWith('/reservas')) return 'reservas';
    if (location.pathname.startsWith('/carrito')) return 'carrito';
    if (location.pathname.startsWith('/facturas')) return 'facturas';
    if (location.pathname.startsWith('/login')) return 'login';
    if (location.pathname.startsWith('/otros')) return 'otros';
    if (location.pathname.startsWith('/register')) return 'register';
    if (location.pathname.startsWith('/pagos')) return 'pagos'; // Corregido: 'pagos' en lugar de 'register'
    
    return 'inicio';
  })();

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('rememberMe');
    navigate('/login');
  };
  
  // Nuevo manejador para Iniciar Sesión
  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <Header 
      className="navbar-header" 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0 20px', 
        height: '64px' 
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <div className="navbar-logo" style={{ marginRight: '20px' }}>
          <img src="/logos/logo.png" alt="MiApp Logo" />
          <span>Cuenca Wheels</span>
        </div>
        
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          className="navbar-menu"
          style={{ 
            flex: 1, 
            lineHeight: '64px',
            borderBottom: 'none' 
          }}
        >
          
          <Menu.Item key="Home" icon={<HomeOutlined />}>
            <Link to="/home">Inicio</Link>
          </Menu.Item>
          
          <Menu.Item key="autos" icon={<CarOutlined />}>
            <Link to="/autos">Autos</Link>
          </Menu.Item>

          {/* Mostrar Carrito SOLO si el usuario está logueado */}
          {userIsLogged && (
            <Menu.Item key="carrito" icon={<ShoppingCartOutlined />}>
              <Link to="/carrito">Carrito</Link>
            </Menu.Item>
          )} 
          
          {/* Mostrar Reservas SOLO si el usuario está logueado */}
          {userIsLogged && (
            <Menu.Item key="reservas" icon={<CalendarOutlined />}>
              <Link to="/reservas">Reservas</Link>
            </Menu.Item>
          )}

          {/* Items de Administrador (facturas, usuarios, pagos) */}
          {userIsAdmin && (
            <Menu.Item key="facturas" icon={<CalendarOutlined />}>
              <Link to="/facturas">Facturas</Link>
            </Menu.Item>
          )} 
          {userIsAdmin && (
            <Menu.Item key="usuarios" icon={<UserOutlined />}>
              <Link to="/usuarios">Usuarios</Link>
            </Menu.Item>
          )} 
          {userIsAdmin && (
            <Menu.Item key="pagos" icon={<DollarOutlined />}>
              <Link to="/pagos">Pagos</Link>
            </Menu.Item>
          )} 
        </Menu>
      </div>

      {/* Mostrar Cerrar Sesión si el usuario está logueado */}
      {userIsLogged ? (
        <Button 
          type="primary" 
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{ marginLeft: 'auto' }}
        >
          Cerrar Sesión
        </Button>
      ) : (
        /* Mostrar Iniciar Sesión si el usuario NO está logueado */
        <Button 
          type="primary" 
          icon={<UserOutlined />} // Usé UserOutlined o el que prefieras para Iniciar Sesión
          onClick={handleLogin}
          style={{ marginLeft: 'auto' }}
        >
          Iniciar Sesión
        </Button>
      )}
    </Header>
  );
};

export default Navbar;