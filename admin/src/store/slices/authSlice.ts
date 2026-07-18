import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

const initialState = { user: null as any, isAuthenticated: false, isLoading: false, error: null as string | null };

export const loginAdmin = createAsyncThunk('auth/loginAdmin', async (creds: any, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.login(creds);
    if (data.data.user.role !== 'admin') throw new Error('Admin access only');
    localStorage.setItem('adminToken', data.data.accessToken);
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Login failed');
  }
});

export const fetchAdminMe = createAsyncThunk('auth/fetchAdminMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.getMe();
    if (data.data.role !== 'admin') throw new Error('Not admin');
    return data.data;
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('adminToken');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(loginAdmin.fulfilled, (s, a) => { s.isLoading = false; s.user = a.payload.user; s.isAuthenticated = true; })
      .addCase(loginAdmin.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; })
      .addCase(fetchAdminMe.fulfilled, (s, a) => { s.user = a.payload; s.isAuthenticated = true; })
      .addCase(fetchAdminMe.rejected, (s) => { s.isAuthenticated = false; });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
