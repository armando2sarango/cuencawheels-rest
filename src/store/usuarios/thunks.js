import { createAsyncThunk } from '@reduxjs/toolkit';
import * as usuarioAPI from './restCalls';
export const fetchUsuarios= createAsyncThunk('usuarios/fetchAll',async () => {const data = await usuarioAPI.getUsuarios();return data;});
export const fetchUsuarioById = createAsyncThunk('usuarios/fetchById',async (id) => {const data = await usuarioAPI.getUsuarioById(id);return data;});
export const createUsuarioThunk = createAsyncThunk('usuarios/create',async (body) => {const data = await usuarioAPI.createUsuario(body);return data;});
export const loginThunk = createAsyncThunk('usuarios/login',async (body) => {const data = await usuarioAPI.login(body);return data;});
export const updateUsuarioThunk = createAsyncThunk('usuarios/update',async ({ id, body }) => {const data = await usuarioAPI.updateUsuario(id, body);return data;});
export const deleteUsuarioThunk = createAsyncThunk('usuarios/delete',async (id) => {const success = await usuarioAPI.deleteUsuario(id);return { id, success };});
