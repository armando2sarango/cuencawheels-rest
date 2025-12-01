// store/facturas/thunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import * as FacturaAPI from './restCalls';

// Obtener todos los vehículos
export const fetchfacturas = createAsyncThunk(
  'facturas/fetchAll',
  async () => {
    const data = await FacturaAPI.getfacturas();
    return data;
  }
);
export const fetchFacturasByUsuarioThunk = createAsyncThunk(
  'facturas/fetchByUsuario',
  async (idUsuario, { rejectWithValue }) => {
    try {
      const data = await FacturaAPI.getFacturasByUsuario(idUsuario);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error al cargar facturas del usuario');
    }
  }
);
// Obtener vehículo por ID
export const fetchFacturaById = createAsyncThunk(
  'facturas/fetchById',
  async (idFactura) => {
    const data = await FacturaAPI.getFacturaById(idFactura);
    return data;
  }
);

// Crear vehículo
export const createFacturaThunk = createAsyncThunk(
  'facturas/create',
  async (body) => {
    const data = await FacturaAPI.createFactura(body);
    return data;
  }
);

// Actualizar vehículo
export const updateFacturaThunk = createAsyncThunk(
  'facturas/update',
  async ({ idFactura, body }) => {
    const data = await FacturaAPI.updateFactura(idFactura, body);
    return data;
  }
);

// Eliminar vehículo
export const deleteFacturaThunk = createAsyncThunk(
  'facturas/delete',
  async (idFactura) => {
    const success = await FacturaAPI.deleteFactura(idFactura);
    return { idFactura, success };
  }
);


