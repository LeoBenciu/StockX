import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (unauthorized) - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
    const { data } = await api.patch(`/inventory/${id}/threshold`, { minThreshold });
    return data;
  },
};

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

export default api;

