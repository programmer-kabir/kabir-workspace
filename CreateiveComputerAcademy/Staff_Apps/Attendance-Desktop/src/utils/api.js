import axios from 'axios';

export const getApiBase = () => {
  const custom = localStorage.getItem('cca_api_base_url');
  if (custom && custom.trim()) {
    return custom.trim().endsWith('/') ? custom.trim() : custom.trim() + '/';
  }
  return import.meta.env.VITE_API_BASE_URL || 'https://api.creativecomputeracademy.com/';
};

export const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBase();
  return config;
});

export const loginApi = async (identifier, password) => {
  const response = await api.post('api/auth/login.php', {
    identifier,
    password
  });
  return response.data;
};

export const verifyTokenApi = async (token) => {
  const response = await api.post('api/auth/verify.php', { token });
  return response.data;
};

export const getAttendanceApi = async (userId) => {
  const response = await api.post('api/attendance/get_attendance.php', {
    user_id: userId
  });
  return response.data;
};

export const checkInApi = async (userId, deviceInfo, location, appVersion = '1.0.0') => {
  const response = await api.post('api/attendance/check_in.php', {
    user_id: userId,
    device_info: deviceInfo,
    location: location,
    app_version: appVersion
  });
  return response.data;
};

export const checkOutApi = async (userId, deviceInfo, location) => {
  const response = await api.post('api/attendance/check_out.php', {
    user_id: userId,
    device_info: deviceInfo,
    location: location
  });
  return response.data;
};

export const logoutApi = async (token) => {
  try {
    await api.post('api/auth/logout.php', { token });
  } catch (e) {
    // ignore
  }
};

export default api;
