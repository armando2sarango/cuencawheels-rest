import { createAsyncThunk } from '@reduxjs/toolkit';
import * as reservaAPI from './restCalls';
export const fetchReservas = createAsyncThunk(
  'reserva/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await reservaAPI.getReservas(); 
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error al cargar reservas');
    }
  }
);
export const fetchReservaById = createAsyncThunk(
  'reserva/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const data = await reservaAPI.getReservaById(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error al cargar la reserva');
    }
  }
);
export const fetchReservasIdUsuario = createAsyncThunk(
  'reserva/fetchByUsuario',
  async (idUsuario, { rejectWithValue }) => {
    try {
      const data = await reservaAPI.getReservaByIdUsuario(idUsuario);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error al cargar reservas del usuario');
    }
  }
);
export const createReservaThunk = createAsyncThunk(
  'reserva/create',
  async (body, { rejectWithValue }) => {
    try {
      console.log('📤 Thunk enviando reserva:', body);
      const data = await reservaAPI.createReserva(body);
      console.log('✅ Thunk recibió respuesta exitosa:', data);
      return data;
    } catch (error) {
      const mensajeError = error.message || 'Error desconocido al crear la reserva';
      
      return rejectWithValue(mensajeError);
    }
  }
);

export const updateReservaThunk = createAsyncThunk(
  'reserva/update',
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const data = await reservaAPI.updateReserva(id, body);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error al actualizar la reserva');
    }
  }
);
export const updateEstadoReservaThunk = createAsyncThunk(
  'reserva/updateEstado',
  async ({ id, estado }, { rejectWithValue }) => {
    try {
      const data = await reservaAPI.updateEstado(id, estado);
      return { id, data }; 
    } catch (error) {
      return rejectWithValue(error.message || 'Error al cambiar el estado');
    }
  }
);
export const deleteReservaThunk = createAsyncThunk(
  'reserva/delete',
  async (id, { rejectWithValue }) => {
    try {
      await reservaAPI.deleteReserva(id);
      return id; 
    } catch (error) {
      return rejectWithValue(error.message || 'Error al eliminar la reserva');
    }
  }
);