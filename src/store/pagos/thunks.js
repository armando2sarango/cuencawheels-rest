import { createAsyncThunk } from '@reduxjs/toolkit';
import * as pagoAPI from '../../api/pagos/restCalls'; // Ajusta la ruta si es necesario

export const fetchPagos = createAsyncThunk(
  'pagos/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await pagoAPI.getPagos();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPagoById = createAsyncThunk(
  'pagos/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      return await pagoAPI.getPagoById(id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ✅ NUEVO: Traer pagos de un usuario específico
export const fetchPagosByUsuario = createAsyncThunk(
  'pagos/fetchByUsuario',
  async (idUsuario, { rejectWithValue }) => {
    try {
      return await pagoAPI.getPagosByUsuario(idUsuario);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPagosByReserva = createAsyncThunk(
  'pagos/fetchByReserva',
  async (idReserva, { rejectWithValue }) => {
    try {
      return await pagoAPI.getPagosByReserva(idReserva);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createPagoThunk = createAsyncThunk(
  'pagos/create',
  async (body, { rejectWithValue }) => {
    try {
      return await pagoAPI.createPago(body);
    } catch (error) {
      // Esto asegura que el mensaje "Sin fondos" llegue al componente
      return rejectWithValue(error.message);
    }
  }
);

export const updatePagoThunk = createAsyncThunk(
  'pagos/update',
  async ({ id, body }, { rejectWithValue }) => {
    try {
      return await pagoAPI.updatePago(id, body);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deletePagoThunk = createAsyncThunk(
  'pagos/delete',
  async (id, { rejectWithValue }) => {
    try {
      const success = await pagoAPI.deletePago(id);
      return { id, success };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);