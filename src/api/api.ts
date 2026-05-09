// api.ts - Updated version
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { setCredentials, clearCredentials } from '../store/slices/authSlice';
import type { AppStore } from '../store/store';

let injectedStore: AppStore;

export const injectStore = (_store: AppStore) => {
  injectedStore = _store;
};

interface RefreshResponse {
  success: boolean;
  accessToken: string;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // ← CRITICAL: This allows cookies to be sent/received
});

// ─── Request Interceptor ──────────────────────────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = injectedStore?.getState().auth.accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Token Refresh State ──────────────────────────────────────────────────────

let refreshPromise: Promise<string> | null = null;

// ─── Response Interceptor ─────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // ── Don't retry these routes ──────────────────────────────────────────
    const excludedRoutes = [
  '/auth/refresh-tokens',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/verify-email',  // ← add this
];

    if (excludedRoutes.some((route) => originalRequest.url?.includes(route))) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const response = await axios.post<RefreshResponse>(
              `${import.meta.env.VITE_API_URL}/auth/refresh-tokens`,
              {},
              { withCredentials: true }
            );
            const { accessToken } = response.data;
            queueMicrotask(() => {
              injectedStore?.dispatch(setCredentials({ accessToken }));
            });
            return accessToken;
          })().finally(() => {
            refreshPromise = null;
          });
        }

        const accessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        refreshPromise = null;
        injectedStore?.dispatch(clearCredentials());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;