// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import autosReducer from './autos/autosReducer';
import usuariosReducer from './usuarios/usuariosReducer'
import facturasReducer from './facturas/facturasReducer'
import carritosReducer from './carrito/carritoReducer'
import reservasReducer from './reservas/reservasReducer'
export const store = configureStore({
  reducer: {
    autos: autosReducer,
    usuarios:usuariosReducer,
    facturas:facturasReducer,
    carritos:carritosReducer,
    reservas:reservasReducer,
  }
});

export default store;