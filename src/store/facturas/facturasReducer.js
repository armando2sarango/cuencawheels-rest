// store/facturas/slice.js
import { createSlice } from '@reduxjs/toolkit';
import { 
    fetchFacturas,
    fetchFacturasByUsuarioThunk,    
    fetchFacturaById,           
    createFacturaThunk,
    updateFacturaThunk,
    deleteFacturaThunk 
} from './thunks';

const initialState = {
  facturas: [],
  facturaActual: null, // ✅ NUEVO: Para almacenar una factura individual
  loading: false, 
  error: null,    
};

const facturasSlice = createSlice({
  name: 'facturas',
  initialState,
  reducers: {
    clearFacturaActual: (state) => {
      state.facturaActual = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch todas las facturas
      .addCase(fetchFacturas.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(fetchFacturas.fulfilled, (state, action) => {
        state.loading = false;
        state.facturas = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchFacturas.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.error.message || 'Error al cargar todas las facturas'; 
      })
      
      // Fetch facturas por usuario
      .addCase(fetchFacturasByUsuarioThunk.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(fetchFacturasByUsuarioThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.facturas = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchFacturasByUsuarioThunk.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload || action.error.message || 'Error al cargar facturas del usuario'; 
      })
      
      // ✅ NUEVO: Fetch factura por ID
      .addCase(fetchFacturaById.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(fetchFacturaById.fulfilled, (state, action) => {
        state.loading = false;
        state.facturaActual = action.payload; // Guardar la factura individual
      })
      .addCase(fetchFacturaById.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.error.message || 'Error al cargar la factura'; 
      })
      
      // Crear factura
      .addCase(createFacturaThunk.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(createFacturaThunk.fulfilled, (state, action) => { 
        state.loading = false;
        // ✅ Agregar la nueva factura al array si existe
        if (action.payload) {
          state.facturas.push(action.payload);
        }
      })
      .addCase(createFacturaThunk.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.error.message || 'Error al crear la factura'; 
      })
      
      // Actualizar factura
      .addCase(updateFacturaThunk.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(updateFacturaThunk.fulfilled, (state, action) => { 
        state.loading = false;
        // ✅ Actualizar la factura en el array
        if (action.payload) {
          const index = state.facturas.findIndex(f => f.IdFactura === action.payload.IdFactura);
          if (index !== -1) {
            state.facturas[index] = action.payload;
          }
          // También actualizar facturaActual si es la misma
          if (state.facturaActual?.IdFactura === action.payload.IdFactura) {
            state.facturaActual = action.payload;
          }
        }
      })
      .addCase(updateFacturaThunk.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.error.message || 'Error al actualizar la factura'; 
      })
      
      // Eliminar factura
      .addCase(deleteFacturaThunk.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(deleteFacturaThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.facturas = state.facturas.filter(f => f.IdFactura !== action.payload.idFactura);
          // ✅ Limpiar facturaActual si es la que se eliminó
          if (state.facturaActual?.IdFactura === action.payload.idFactura) {
            state.facturaActual = null;
          }
        }
      })
      .addCase(deleteFacturaThunk.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.error.message || 'Error al eliminar la factura'; 
      });
  }
});

export const { clearFacturaActual } = facturasSlice.actions;
export default facturasSlice.reducer;