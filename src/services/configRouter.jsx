import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORTAMOS LAS PÁGINAS ---
import UsuariosPage from '../components/Usuarios/UsuriosPage'; // Ojo con el typo en tu nombre de archivo original
import AutosPage from '../components/Autos/AutosPage';
import LoginPage from '../components/Login/LoginPage';
import RegisterPage from '../components/Register/RegisterPage';
import HomePage from '../components/Home/HomePage';
import FacturasPage from '../components/facturas/facturasPage.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import CarritoPage from '../components/Carrito/carritoPage.jsx';
import ReservasPage from '../components/reservas/ReservasPage.jsx'

import { isAuthenticated } from '../services/auth.jsx'; 
const MainLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Navbar />
      <div className="app-content">{children}</div>
      <Footer />
    </div>
  );
};


const ProtectedRoute = ({ children }) => {
  const isAuth = isAuthenticated(); 

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
const PublicRoute = ({ children }) => {
  const isAuth = isAuthenticated();
  if (isAuth) {
    return <Navigate to="/home" replace />;
  }
  return children;
};
const RootRedirect = () => {
    // Si entran a /, los mandamos directamente a /home (que ahora es público)
    return <Navigate to="/home" replace />; 
};
const ConfigRouter = () => {
  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />

        {/* --- RUTAS PROTEGIDAS (Requieren Login) --- */}
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute>
              <MainLayout>
                <UsuariosPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservas"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ReservasPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/autos"
          element={
              <MainLayout>
                <AutosPage />
              </MainLayout>
          }
        />
        

        <Route
          path="/facturas"
          element={
            <ProtectedRoute>
              <MainLayout>
                <FacturasPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/carrito"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CarritoPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/home"
          element={
              <MainLayout>
                <HomePage />
              </MainLayout>
          }
        />

        {/* Rutas comentadas (Reservas, Carrito) mantendrían la misma estructura ProtectedRoute */}

        <Route path="/home" element={<RootRedirect />} />
        
        {/* Cualquier ruta desconocida manda al login o al home */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Router>
  );
};

export default ConfigRouter;