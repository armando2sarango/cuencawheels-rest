import { createSlice } from '@reduxjs/toolkit';
import { 
  fetchPagos, 
  fetchPagosByUsuario, 
  fetchPagosByReserva, 
  createPagoThunk, 
  updatePagoThunk, 
  deletePagoThunk,
  fetchPagoById
} from './thunks';

const initialState = {
  items: [],
  loading: false,
  error: null
};

const pagosSlice = createSlice({
  name: 'pagos',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- FETCH ALL ---
      .addCase(fetchPagos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPagos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchPagos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al cargar pagos';
      })

      // --- FETCH BY USUARIO (Para historial del cliente) ---
      .addCase(fetchPagosByUsuario.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPagosByUsuario.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })

      // --- FETCH BY RESERVA ---
      .addCase(fetchPagosByReserva.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })

      // --- CREATE ---
      .addCase(createPagoThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPagoThunk.fulfilled, (state, action) => {
        state.loading = false;
        // No agregamos al array porque generalmente recargamos la vista o redirigimos
      })
      .addCase(createPagoThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al registrar pago';
      })

      // --- UPDATE ---
      .addCase(updatePagoThunk.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.IdPago === action.meta.arg.id);
        if (index !== -1 && action.payload) {
          state.items[index] = action.payload;
        }
      })

      // --- DELETE ---
      .addCase(deletePagoThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
           state.items = state.items.filter(p => p.IdPago !== action.payload.id);
        }
      })
      
      // --- FETCH BY ID ---
      .addCase(fetchPagoById.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload ? [action.payload] : [];
      });   
  }
});

export const { clearError } = pagosSlice.actions;
export default pagosSlice.reducer;