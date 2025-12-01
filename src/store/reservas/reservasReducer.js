import { createSlice } from '@reduxjs/toolkit';
import {
  fetchReservas,
  fetchReservaById,
  fetchReservasIdUsuario,
  createReservaThunk,
  updateReservaThunk,
  updateEstadoReservaThunk,
  deleteReservaThunk
} from './thunks';

const initialState = {
  items: [],          // Lista de reservas
  selectedItem: null, // Reserva individual (para detalles)
  loading: false,
  error: null
};

const reservasSlice = createSlice({
  name: 'reservas',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelection: (state) => {
      state.selectedItem = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // ============================================================
      // 🔵 FETCH ALL (ADMIN)
      // ============================================================
      .addCase(fetchReservas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReservas.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchReservas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || 'Error al cargar reservas';
      })

      // ============================================================
      // 🔵 FETCH BY USUARIO
      // ============================================================
      .addCase(fetchReservasIdUsuario.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReservasIdUsuario.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchReservasIdUsuario.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || 'Error al cargar reservas del usuario';
      })

      // ============================================================
      // 🔍 FETCH SINGLE BY ID
      // ============================================================
      .addCase(fetchReservaById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReservaById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchReservaById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || 'Error al cargar la reserva';
      })

      // ============================================================
      // 🟢 CREATE (CRÍTICO - Captura errores del banco)
      // ============================================================
      .addCase(createReservaThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReservaThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        console.log('✅ Slice recibió payload:', action.payload);
        
        // Si viene el objeto reserva dentro
        if (action.payload?.reserva) {
          state.items.push(action.payload.reserva);
        } 
        // Si viene directamente
        else if (action.payload) {
          state.items.push(action.payload);
        }
      })
      .addCase(createReservaThunk.rejected, (state, action) => {
        state.loading = false;
        // ✅ AQUÍ CAPTURAMOS EL ERROR PROPAGADO
        state.error = action.payload || action.error.message || 'Error al crear reserva';
        console.error('🔴 Slice capturó error:', state.error);
      })

      // ============================================================
      // 🟠 UPDATE
      // ============================================================
      .addCase(updateReservaThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReservaThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        // Actualizamos en la lista
        const index = state.items.findIndex(r => r.IdReserva === action.meta.arg.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      .addCase(updateReservaThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || 'Error al actualizar';
      })

      // ============================================================
      // 🔧 UPDATE ESTADO
      // ============================================================
      .addCase(updateEstadoReservaThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEstadoReservaThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        // Actualizamos solo el estado en la lista local
        const index = state.items.findIndex(r => r.IdReserva === action.payload.id);
        if (index !== -1) {
           // Si la API devuelve el objeto completo, úsalo
           if (action.payload.data) {
               state.items[index] = action.payload.data;
           }
        }
      })
      .addCase(updateEstadoReservaThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || 'Error al cambiar estado';
      })

      // ============================================================
      // 🔴 DELETE
      // ============================================================
      .addCase(deleteReservaThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReservaThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        // Filtramos usando el ID que devolvió el thunk
        state.items = state.items.filter(r => r.IdReserva !== action.payload);
      })
      .addCase(deleteReservaThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || 'Error al eliminar';
      });
  }
});

export const { clearError, clearSelection } = reservasSlice.actions;
export default reservasSlice.reducer;