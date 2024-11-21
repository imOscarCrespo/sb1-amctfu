import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const BASE_URL = 'https://onetoc-backend-production.up.railway.app';

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!accessToken || !refreshToken) {
    return config;
  }

  try {
    const { exp } = jwtDecode(accessToken);
    const isExpired = exp * 1000 < Date.now();

    if (isExpired) {
      const response = await axios.post(`${BASE_URL}/api/token/refresh/`, {
        refresh: refreshToken,
      });
      
      localStorage.setItem('accessToken', response.data.access);
      config.headers.Authorization = `Bearer ${response.data.access}`;
    } else {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  } catch (error) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }

  return config;
});