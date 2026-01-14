import { createSlice } from '@reduxjs/toolkit';
import { fetchUsuarios, createUsuarioThunk, loginThunk, updateUsuarioThunk, deleteUsuarioThunk } from './thunks';

const initialState = {
  usuarios: [], 
  loading: false,
  error: null
};

const usuariosSlice = createSlice({
  name: 'usuarios',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsuarios.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsuarios.fulfilled, (state, action) => {
  state.loading = false;
  // ✅ Busca en .data primero, si no, mira si el payload mismo es el array
  const lista = action.payload?.data || (Array.isArray(action.payload) ? action.payload : []);
  state.usuarios = lista;
})
      .addCase(fetchUsuarios.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al cargar';
      })
      .addCase(createUsuarioThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(createUsuarioThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createUsuarioThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al crear';
      })
      .addCase(updateUsuarioThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUsuarioThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateUsuarioThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al actualizar';
      })
      .addCase(deleteUsuarioThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteUsuarioThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.id) {
            state.usuarios = state.usuarios.filter(u => u.IdUsuario !== action.payload.id);
        }
      })
      .addCase(deleteUsuarioThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al eliminar';
      })
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al iniciar sesión';
      });
  }
});

export const { clearError } = usuariosSlice.actions;
export default usuariosSlice.reducer;