import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
  isAnyOf,
  type UnknownAction,
} from '@reduxjs/toolkit';
import api from '../../api/api';
import type {
  User,
  CreateCourtAssistantDTO,
  CreateCourtAssistantResponse,
} from '../../types/auth.types';
import { AxiosError } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user:            User | null;
  accessToken:     string | null;
  isAuthenticated: boolean;
  loading:         boolean;
  error:           string | null;
  message:         string | null;
}

interface ApiError {
  message: string;
}

interface UpdateStationResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
    station: string | null;
  };
}

interface LoginResponse {
  success:      boolean;
  user:         User;
  accessToken:  string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    id:      number;
    name:    string;
    email:   string;
    role:    string;
    station: string | null;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const handleAxiosError = (err: unknown, defaultMessage: string): string => {
  const error = err as AxiosError<ApiError>;
  return error.response?.data?.message || defaultMessage;
};

const getInitialUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr || userStr === 'null' || userStr === 'undefined') return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user:            getInitialUser(),
  accessToken:     localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading:         false,
  error:           null,
  message:         null,
};

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk <
  RegisterResponse,
  { name: string; email: string; password: string; station: string },
  { rejectValue: string }
>(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post<RegisterResponse>('/auth/register', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(handleAxiosError(err, 'Registration failed'));
    }
  }
);

export const loginUser = createAsyncThunk <
  LoginResponse,
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post<LoginResponse>('/auth/login', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(handleAxiosError(err, 'Login failed'));
    }
  }
);

export const verifyEmail = createAsyncThunk <
  { message: string },
  string,
  { rejectValue: string }
>(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const res = await api.get<{ message: string }>(`/auth/verify-email/${token}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(handleAxiosError(err, 'Email verification failed'));
    }
  }
);

export const forgotPassword = createAsyncThunk <
  { message: string },
  { email: string },
  { rejectValue: string }
>(
  'auth/forgotPassword',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post<{ message: string }>('/auth/forgot-password', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(handleAxiosError(err, 'Failed to send reset email'));
    }
  }
);

export const resetPassword = createAsyncThunk <
  { message: string },
  { token: string; password: string },
  { rejectValue: string }
>(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const res = await api.patch<{ message: string }>(`/auth/reset-password/${token}`, { password });
      return res.data;
    } catch (err) {
      return rejectWithValue(handleAxiosError(err, 'Password reset failed'));
    }
  }
);

export const refreshTokens = createAsyncThunk <
  { accessToken: string },
  void,
  { rejectValue: string }
>(
  'auth/refreshTokens',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post<{ success: boolean; accessToken: string }>(
        '/auth/refresh-tokens',
        {}
      );
      return { accessToken: res.data.accessToken };
    } catch (err) {
      return rejectWithValue(handleAxiosError(err, 'Session refresh failed'));
    }
  }
);

export const logoutUser = createAsyncThunk<void, void>(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await api.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(authSlice.actions.clearCredentials());
    }
  }
);

export const updatePassword = createAsyncThunk <
  { message: string },
  { currentPassword: string; newPassword: string },
  { rejectValue: string }
>(
  'auth/updatePassword',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.patch<{ message: string }>('/auth/update-password', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(handleAxiosError(err, 'Password update failed'));
    }
  }
);

export const getCurrentUser = createAsyncThunk <
  { success: boolean; user: User },
  void,
  { rejectValue: string }
>(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<{ success: boolean; user: User }>('/auth/me');
      return res.data;
    } catch (err) {
      return rejectWithValue(handleAxiosError(err, 'Failed to fetch user details'));
    }
  }
);

export const updateDrStation = createAsyncThunk <
  UpdateStationResponse,
  { station: string },
  { rejectValue: string }
>(
  'auth/updateDrStation',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.patch<UpdateStationResponse>('/auth/dr/station', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(handleAxiosError(err, 'Failed to update station'));
    }
  }
);
 
export const updateDrStationById = createAsyncThunk <
  UpdateStationResponse,
  { id: string; station: string },
  { rejectValue: string }
>(
  'auth/updateDrStationById',
  async ({ id, station }, { rejectWithValue }) => {
    try {
      const res = await api.patch<UpdateStationResponse>(`/auth/dr/${id}/station`, { station });
      return res.data;
    } catch (err) {
      return rejectWithValue(handleAxiosError(err, 'Failed to update DR station'));
    }
  }
);

export const createCourtAssistant = createAsyncThunk <
  CreateCourtAssistantResponse,
  CreateCourtAssistantDTO,
  { rejectValue: string }
>(
  'auth/createCourtAssistant',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post<CreateCourtAssistantResponse>('/auth/court-assistant', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(handleAxiosError(err, 'Failed to create court assistant account'));
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ accessToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      localStorage.setItem('accessToken', action.payload.accessToken);
    },
    clearCredentials: (state) => {
      state.user            = null;
      state.accessToken     = null;
      state.isAuthenticated = false;
      state.error           = null;
      state.message         = null;
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    },
    clearAuthError: (state) => {
      state.error   = null;
      state.message = null;
    },
    updateUserStation: (state, action: PayloadAction<string | null>) => {
      if (state.user) {
        state.user.station = action.payload;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    builder

      // ── Register ──────────────────────────────────────────────────────────
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<RegisterResponse>) => {
        state.loading         = false;
        state.isAuthenticated = false;
        state.user            = null;
        state.accessToken     = null;
        state.error           = null;
        state.message         = action.payload.message;
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      })

      // ── Login ─────────────────────────────────────────────────────────────
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading         = false;
        state.user            = action.payload.user;
        state.accessToken     = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error           = null;
        state.message         = null;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('accessToken', action.payload.accessToken);
      })

    // ── verifyEmail — fully isolated, component uses local state ──────────
.addCase(verifyEmail.pending,   () => { /* intentionally blank */ })
.addCase(verifyEmail.fulfilled, () => { /* intentionally blank */ })
.addCase(verifyEmail.rejected,  () => { /* intentionally blank */ })

      // ── createCourtAssistant ──────────────────────────────────────────────
      .addCase(createCourtAssistant.pending, (state) => {
        state.loading = true;
        state.error   = null;
        state.message = null;
      })
      .addCase(createCourtAssistant.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(createCourtAssistant.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload ?? 'Failed to create court assistant account';
      })

      // ── getCurrentUser ────────────────────────────────────────────────────
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload.user;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload ?? 'Failed to fetch user details';
      })

      // ── updateDrStation ───────────────────────────────────────────────────
      .addCase(updateDrStation.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(updateDrStation.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user.station = action.payload.data.station;
          localStorage.setItem('user', JSON.stringify(state.user));
        }
        state.message = action.payload.message;
      })
      .addCase(updateDrStation.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload ?? 'Failed to update station';
      })

      // ── updateDrStationById ───────────────────────────────────────────────
      .addCase(updateDrStationById.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(updateDrStationById.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user && String(state.user.id) === String(action.payload.data.id)) {
          state.user.station = action.payload.data.station;
          localStorage.setItem('user', JSON.stringify(state.user));
        }
        state.message = action.payload.message;
      })
      .addCase(updateDrStationById.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload ?? 'Failed to update DR station';
      })

      // ── refreshTokens ─────────────────────────────────────────────────────
      .addCase(refreshTokens.fulfilled, (state, action: PayloadAction<{ accessToken: string }>) => {
        state.loading     = false;
        state.accessToken = action.payload.accessToken;
        state.error       = null;
        localStorage.setItem('accessToken', action.payload.accessToken);
      })
      .addCase(refreshTokens.rejected, (state, action) => {
        state.loading         = false;
        state.error           = action.payload ?? 'Session refresh failed';
        state.user            = null;
        state.accessToken     = null;
        state.isAuthenticated = false;
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      })

      // ── message-only responses ────────────────────────────────────────────
      .addMatcher(
        isAnyOf(
          forgotPassword.fulfilled,
          resetPassword.fulfilled,
          updatePassword.fulfilled,
        ),
        (state, action: PayloadAction<{ message: string }>) => {
          state.loading = false;
          state.error   = null;
          state.message = action.payload.message;
        }
      )

      // ── pending — global catch-all ────────────────────────────────────────
      .addMatcher(
        (action: UnknownAction) =>
          typeof action.type === 'string' &&
          action.type.startsWith('auth/') &&
          action.type.endsWith('/pending') &&
          !action.type.includes('verifyEmail') &&        // ← excluded
          !action.type.includes('createCourtAssistant') &&
          !action.type.includes('getCurrentUser') &&
          !action.type.includes('updateDrStation') &&
          !action.type.includes('refreshTokens'),
        (state) => {
          state.loading = true;
          state.error   = null;
          state.message = null;
        }
      )

      // ── rejected — global catch-all ───────────────────────────────────────
      .addMatcher(
        (action: UnknownAction) =>
          typeof action.type === 'string' &&
          action.type.startsWith('auth/') &&
          action.type.endsWith('/rejected') &&
          !action.type.includes('verifyEmail') &&        // ← excluded
          !action.type.includes('createCourtAssistant') &&
          !action.type.includes('refreshTokens'),
        (state, action: UnknownAction) => {
          state.loading = false;
          state.error   = (action as PayloadAction<string | undefined>).payload
            ?? 'An unexpected error occurred';
        }
      );
  },
});

export const { setCredentials, clearCredentials, clearAuthError, updateUserStation } = authSlice.actions;
export default authSlice.reducer;