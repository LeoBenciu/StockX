import axios from 'axios';
import { log, logError } from '../utils/log';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

log('API client init', { baseURL: API_URL, hasViteApiUrl: !!import.meta.env.VITE_API_URL });

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  log(`API ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (unauthorized) + log all API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? error.config?.baseURL;
    const method = error.config?.method?.toUpperCase();
    logError(`API error ${method} ${url}`, { status, message: error.message, data: error.response?.data });
    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* ===================== AUTH ===================== */

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  register: async (data: { email: string; password: string; name: string }) => {
    const { data: response } = await api.post('/auth/register', data);
    return response;
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

/* ===================== INVOICES ===================== */

export const invoicesApi = {
  getAll: async () => {
    const { data } = await api.get('/invoices');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/invoices/${id}`);
    return data;
  },

  create: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/invoices', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data;
  },

  delete: async (id: string) => {
    await api.delete(`/invoices/${id}`);
  },

  addToInventory: async (id: string) => {
    const { data } = await api.post(`/invoices/${id}/add-to-inventory`);
    return data;
  },
};

/* ===================== RECEIPTS ===================== */

export const receiptsApi = {
  getAll: async () => {
    const { data } = await api.get('/receipts');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/receipts/${id}`);
    return data;
  },

  create: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/receipts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data;
  },

  delete: async (id: string) => {
    await api.delete(`/receipts/${id}`);
  },
};

/* ===================== INVENTORY ===================== */

export const inventoryApi = {
  getAll: async () => {
    const { data } = await api.get('/inventory');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/inventory/${id}`);
    return data;
  },

  getLowStock: async () => {
    const { data } = await api.get('/inventory/low-stock');
    return data;
  },

  updateThreshold: async (id: string, minThreshold: number) => {
    const { data } = await api.patch(
      `/inventory/${id}/threshold`,
      { minThreshold }
    );
    return data;
  },

  // 🔴 ADĂUGAT – DELETE INVENTORY
  delete: async (id: string) => {
    const { data } = await api.delete(`/inventory/${id}`);
    return data;
  },
};

/* ===================== RECIPES ===================== */

export const recipesApi = {
  getAll: async () => {
    const { data } = await api.get('/recipes');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/recipes/${id}`);
    return data;
  },

  create: async (recipe: any) => {
    const { data } = await api.post('/recipes', recipe);
    return data;
  },

  update: async (id: string, recipe: any) => {
    const { data } = await api.patch(`/recipes/${id}`, recipe);
    return data;
  },

  delete: async (id: string) => {
    await api.delete(`/recipes/${id}`);
  },
};

/* ===================== DASHBOARD ===================== */

export const dashboardApi = {
  getMonthlyStats: async (year: number, month: number) => {
    const { data } = await api.get('/dashboard/monthly-stats', {
      params: { year, month },
    });
    return data;
  },
};

export default api;
