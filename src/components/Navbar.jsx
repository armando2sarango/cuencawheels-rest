import React from 'react';
import { Menu, Layout, Button } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  CarOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  LogoutOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isAdmin, isAuthenticated } from '../services/auth';
import '../Navbar.css';

const { Header } = Layout;

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userIsAdmin = isAdmin();
  const userIsLogged = isAuthenticated();

  // Detectar la opción seleccionada del menú
  const selectedKey = (() => {
    if (location.pathname.startsWith('/autos')) return 'autos';
    if (location.pathname.startsWith('/home')) return 'Home';
    if (location.pathname.startsWith('/usuarios')) return 'usuarios';
    if (location.pathname.startsWith('/reservas')) return 'reservas';
    if (location.pathname.startsWith('/carrito')) return 'carrito';
    if (location.pathname.startsWith('/facturas')) return 'facturas';
    if (location.pathname.startsWith('/pagos')) return 'pagos';
    return 'inicio';
  })();

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('rememberMe');
    navigate('/home');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <Header className="navbar-header">

      <div className="navbar-container">

        {/* ---- LOGO + MENÚ ---- */}
        <div className="navbar-left">

          <div className="navbar-logo">
            <img src="/logos/logo.png" alt="MiApp Logo" />
            <span>Cuenca Wheels</span>
          </div>

          <Menu
            className="navbar-menu"
            mode="horizontal"
            selectedKeys={[selectedKey]}
            overflowedIndicator={null}   // 🚀 quita los "tres puntos"
          >

            <Menu.Item key="Home" icon={<HomeOutlined />}>
              <Link to="/home">Inicio</Link>
            </Menu.Item>

            <Menu.Item key="autos" icon={<CarOutlined />}>
              <Link to="/autos">Autos</Link>
            </Menu.Item>

            {userIsLogged && !userIsAdmin && (
              <Menu.Item key="carrito" icon={<ShoppingCartOutlined />}>
                <Link to="/carrito">Mi Carrito</Link>
              </Menu.Item>
            )}

            {userIsLogged && (
              <Menu.Item key="reservas" icon={<CalendarOutlined />}>
                <Link to="/reservas">Reservas</Link>
              </Menu.Item>
            )}

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

        {/* ---- BOTÓN DERECHA ---- */}
        {userIsLogged ? (
          <Button type="primary" icon={<LogoutOutlined />} onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        ) : (
          <Button type="primary" icon={<UserOutlined />} onClick={handleLogin}>
            Iniciar Sesión
          </Button>
        )}
      </div>

    </Header>
  );
};

export default Navbar;
