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
export const getAdvice = () => api.get('/expenses/advice'); // Returns both advice and spending analysis
export const shareExpenseToCommunity = (id) => api.post(`/expenses/share/${id}`);



// Community API calls
export const getCommunityPosts = () => api.get('/community');
export const createCommunityPost = (postData) => api.post('/community', postData);
export const likeCommunityPost = (id) => api.post(`/community/like/${id}`);
export const commentOnCommunityPost = (id, commentData) => api.post(`/community/comment/${id}`, commentData);

// Daily Saving API calls
export const toggleDailySaving = (data) => api.post('/daily-saving/toggle', data);
export const getDailySavingStatus = () => api.get('/daily-saving/today');
export const getDailySavingHistory = () => api.get('/daily-saving/history');
export const seedSavingQuotes = () => api.post('/daily-saving/seed-quotes');

// Book Store API calls
export const getBooks = () => api.get('/books');
export const getUserBooks = () => api.get('/books/user');
export const getBookById = (id) => api.get(`/books/${id}`);
export const purchaseBook = (id) => api.post(`/books/purchase/${id}`);
export const seedBooks = () => api.post('/books/seed');

// Token API calls
export const rewardTokens = (data) => api.post('/tokens/reward', data);
export const getTransactionHistory = () => api.get('/tokens/transactions');
export const transferTokens = (data) => api.post('/tokens/transfer', data); // Using POST instead of GET

// Quiz API calls
export const getRandomQuizzes = (category, count) => {
  const params = {};
  if (category) params.category = category;
  if (count) params.count = count;
  return api.get('/quiz/random', { params });
};
export const submitQuizAnswer = (quizId, answer) => api.post('/quiz/submit', { quizId, answer });
export const getQuizLeaderboard = () => api.get('/quiz/leaderboard');
export const getUserQuizStats = () => api.get('/quiz/stats');
export const seedQuizQuestions = () => api.post('/quiz/seed');

export default api;