import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bird_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bird_token');
      localStorage.removeItem('bird_user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

export const speciesApi = {
  getList: (params) => api.get('/species', { params }),
  getById: (id) => api.get(`/species/${id}`),
  getMeta: () => api.get('/species/meta'),
};

export const observationApi = {
  add: (data) => api.post('/observations', data),
  getList: (params) => api.get('/observations', { params }),
  getById: (id) => api.get(`/observations/${id}`),
  delete: (id) => api.delete(`/observations/${id}`),
};

export const lifeListApi = {
  getList: (params) => api.get('/life-list', { params }),
  getStats: () => api.get('/life-list/stats'),
};

export const achievementApi = {
  getList: () => api.get('/achievements'),
};

export const heatmapApi = {
  getData: (params) => api.get('/heatmap', { params }),
  getHotspotDetail: (location, params) =>
    api.get(`/heatmap/hotspot/${encodeURIComponent(location)}`, { params }),
};

export const activityApi = {
  create: (data) => api.post('/activities', data),
  getList: (params) => api.get('/activities', { params }),
  getById: (id) => api.get(`/activities/${id}`),
  join: (id) => api.post(`/activities/${id}/join`),
  quit: (id) => api.post(`/activities/${id}/quit`),
  cancel: (id) => api.delete(`/activities/${id}`),
};

export default api;
