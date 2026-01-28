import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: '/api', // This will be proxied in webpack config
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add any authentication headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle responses
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Auth API
export const login = (credentials) => {
  return apiClient.post('/login', credentials);
};

// Photos API
export const getPhotos = () => {
  return apiClient.get('/photos');
};

export const uploadPhoto = (formData) => {
  return apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updatePhoto = (id, data) => {
  return apiClient.put(`/photo/${id}`, data);
};

export const deletePhoto = (id) => {
  return apiClient.delete(`/photo/${id}`);
};