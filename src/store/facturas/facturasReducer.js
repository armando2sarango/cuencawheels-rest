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
  loading: false, 
  error: null,    
};

const facturasSlice = createSlice({
  name: 'facturas',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFacturas.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFacturas.fulfilled, (state, action) => {
        state.loading = false;
        state.facturas = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchFacturas.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.error.message || 'Error al cargar todas las facturas'; 
      })
      .addCase(fetchFacturasByUsuarioThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFacturasByUsuarioThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.facturas = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchFacturasByUsuarioThunk.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload || action.error.message || 'Error al cargar facturas del usuario'; 
      })
      
      .addCase(createFacturaThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createFacturaThunk.fulfilled, (state) => { 
      })
      .addCase(createFacturaThunk.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.error.message || 'Error al crear la factura'; 
      })
      .addCase(updateFacturaThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateFacturaThunk.fulfilled, (state) => { 
        state.loading = false; 
      })
      .addCase(updateFacturaThunk.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.error.message || 'Error al actualizar la factura'; 
      })
      .addCase(deleteFacturaThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteFacturaThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.facturas = state.facturas.filter(f => f.IdFactura !== action.payload.idFactura);
        }
      })
      .addCase(deleteFacturaThunk.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.error.message || 'Error al eliminar la factura'; 
      });
  }
});

export default facturasSlice.reducer;