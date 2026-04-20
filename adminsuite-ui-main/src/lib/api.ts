import axios from 'axios';

// JWT decode utility
export const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Public API instance without authentication for viewing published content
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Check expiration before sending request
      try {
        const decoded = decodeJwt(token);
        if (decoded && decoded.exp) {
          const expirationTime = decoded.exp * 1000;
          if (Date.now() >= expirationTime) {
            console.warn('Token expired in interceptor, logging out...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            return Promise.reject(new axios.Cancel('Token expired'));
          }
        }
      } catch (e) {
        // Ignore errors, let backend handle validation
      }

      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      error.userMessage = 'Access denied. You don\'t have permission to perform this action.';
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      error.userMessage = 'Resource not found.';
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      error.userMessage = 'Server error. Please try again later.';
    }

    // Handle network errors
    if (!error.response) {
      error.userMessage = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    // FIX: Send as form-urlencoded to satisfy Spring Security Default Form Login
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await api.post('/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (data: { username: string; email: string; password: string; roles: string[] }) => {
    const response = await api.post('/api/users/register', data);
    return response.data;
  },
};

// Users API
export const usersApi = {
  getMe: () => api.get('/api/users/me').then(res => res.data),
  getAll: () => api.get('/api/users').then(res => res.data),
  getById: (id: number) => api.get(`/api/users/${id}`).then(res => res.data),
  create: (data: { username: string; email: string; password: string; roles: string[] }) =>
    api.post('/api/users', data).then(res => res.data),
  update: (id: number, data: any) =>
    api.put(`/api/users/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/api/users/${id}`).then(res => res.data),
};


// OTP API
export const otpApi = {
  requestOtp: (email: string, purpose: 'REGISTRATION' | 'PASSWORD_RESET') =>
    api.post('/api/otp/request', { email, purpose }).then(res => res.data),

  verifyOtp: (email: string, otp: string, purpose: 'REGISTRATION' | 'PASSWORD_RESET') =>
    api.post('/api/otp/verify', { email, otp, purpose }).then(res => res.data),
};

// Roles API
export const rolesApi = {
  getAll: () => api.get('/api/roles').then(res => res.data),
  getById: (id: number) => api.get(`/api/roles/${id}`).then(res => res.data),
  create: (data: any) => api.post('/api/roles', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/api/roles/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/api/roles/${id}`).then(res => res.data),
};

// Modules API
export const modulesApi = {
  getAll: () => api.get('/api/modules').then(res => res.data),
  getById: (id: number) => api.get(`/api/modules/${id}`).then(res => res.data),
  create: (data: any) => api.post('/api/modules', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/api/modules/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/api/modules/${id}`).then(res => res.data),
  fixPermissions: () => api.post('/api/modules/fix-permissions').then(res => res.data),
};

export const functionsApi = {
  getAll: () => api.get('/api/functions').then(res => res.data),
};

// CMS API
export const cmsApi = {
  // Authenticated operations (for admin users)
  getContent: (moduleCode: string) => api.get(`/api/content/${moduleCode}`).then(res => res.data),
  getContentById: (moduleCode: string, id: number) => api.get(`/api/content/${moduleCode}/${id}`).then(res => res.data),
  createContent: (moduleCode: string, data: any) => api.post(`/api/content/${moduleCode}`, data).then(res => res.data),
  updateContent: (moduleCode: string, id: number, data: any) => api.put(`/api/content/${moduleCode}/${id}`, data).then(res => res.data),
  deleteContent: (moduleCode: string, id: number) => api.delete(`/api/content/${moduleCode}/${id}`).then(res => res.data),
  getSchema: (moduleCode: string) => api.get(`/api/schema/${moduleCode}`).then(res => res.data),
  createSchema: (data: any) => api.post('/api/admin/schema', data).then(res => res.data),

  // Public operations (for viewing published content without authentication)
  getPublicContent: (moduleCode: string) => publicApi.get(`/api/content/${moduleCode}`).then(res => res.data),
  getPublicContentById: (moduleCode: string, id: number) => publicApi.get(`/api/content/${moduleCode}/${id}`).then(res => res.data),
  getPublicSchema: (moduleCode: string) => publicApi.get(`/api/schema/${moduleCode}`).then(res => res.data),
};