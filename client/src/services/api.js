import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to include auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API calls
export const login = (email, password) => api.post('/auth/login', { email, password });
export const signup = (name, email, password) => api.post('/auth/signup', { name, email, password });

// Expense API calls
export const getExpenses = () => api.get('/expenses');
export const addExpense = (expenseData) => api.post('/expenses', expenseData);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);
export const getAdvice = () => api.get('/expenses/advice');

// Challenge API calls
export const getChallenges = () => api.get('/challenges');
export const getChallengeById = (id) => api.get(`/challenges/${id}`);
export const createChallenge = (challengeData) => api.post('/challenges/create', challengeData);
export const completeChallenge = (id) => api.patch(`/challenges/complete/${id}`);

// Token API calls
export const rewardTokens = (data) => api.post('/tokens/reward', data);

export default api;