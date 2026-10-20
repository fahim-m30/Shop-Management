import axios from 'axios';

const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    // Local development only when developing on laptop localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }
  // Production 24/7 Cloud Backend on Render
  return 'https://shop-management-jj6y.onrender.com/api';
};

const API = axios.create({
  baseURL: getBaseURL()
});

// Attach token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Stock
export const addStock = (data) => API.post('/stock', data);
export const getStock = (params) => API.get('/stock', { params });
export const deleteStock = (id) => API.delete(`/stock/${id}`);

// Sales
export const addSales = (data) => API.post('/sales', data);
export const getSales = (params) => API.get('/sales', { params });
export const deleteSales = (id) => API.delete(`/sales/${id}`);

// Dashboard
export const getDashboard = (params) => API.get('/dashboard', { params });
