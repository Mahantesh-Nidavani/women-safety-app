import axios from 'axios';

const API = axios.create({
  baseURL: 'https://women-safety-app-ggng.onrender.com/api'
});

// Add token to every request automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getUserProfile = () => API.get('/auth/profile');

export const getContacts = () => API.get('/contacts');
export const addContact = (data) => API.post('/contacts', data);
export const deleteContact = (id) => API.delete(`/contacts/${id}`);

export const triggerSOS = (data) => API.post('/sos/trigger', data);
export const getSOSHistory = () => API.get('/sos/history');