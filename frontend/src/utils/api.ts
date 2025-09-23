import axios from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Solver API endpoints
export const solverApi = {
  solve: (data: any) => api.post<ApiResponse>('/solve', data),
  solvePushFold: (data: any) => api.post<ApiResponse>('/solve/push-fold', data),
  solveMultiWay: (data: any) => api.post<ApiResponse>('/solve/multi-way', data),
};

// Range API endpoints
export const rangeApi = {
  getPositionalRange: (position: string, action?: string) =>
    api.get<ApiResponse>(`/ranges/${position}`, { params: { action } }),
  parseRange: (data: { rangeString: string; format?: string }) =>
    api.post<ApiResponse>('/ranges/parse', data),
  calculateEquity: (data: any) => api.post<ApiResponse>('/ranges/equity', data),
  getPreflopCharts: (stackDepth?: string) =>
    api.get<ApiResponse>('/ranges/preflop-charts', { params: { stackDepth } }),
  calculateCombos: (data: { hands: string[]; deadCards?: any[] }) =>
    api.post<ApiResponse>('/ranges/combos', data),
};

// ICM API endpoints
export const icmApi = {
  calculate: (data: { stacks: number[]; payouts: number[]; playerIndex?: number }) =>
    api.post<ApiResponse>('/icm/calculate', data),
  calculateBubbleFactor: (data: { stacks: number[]; payouts: number[]; playerIndex?: number }) =>
    api.post<ApiResponse>('/icm/bubble-factor', data),
  calculatePushFoldEV: (data: any) => api.post<ApiResponse>('/icm/push-fold-ev', data),
  getScenarios: () => api.get<ApiResponse>('/icm/scenarios'),
};

// Hand API endpoints
export const handApi = {
  analyze: (data: any) => api.post<ApiResponse>('/hands/analyze', data),
  evaluate: (data: { cards: any[] }) => api.post<ApiResponse>('/hands/evaluate', data),
  calculateEquity: (data: any) => api.post<ApiResponse>('/hands/equity', data),
  getStartingHands: (category?: string, limit?: number) =>
    api.get<ApiResponse>('/hands/starting-hands', { params: { category, limit } }),
  calculateOdds: (data: { handType: string; scenario: any }) =>
    api.post<ApiResponse>('/hands/odds', data),
};

// Charts API endpoints
export const chartsApi = {
  getPushFoldCharts: (params?: any) =>
    api.get<ApiResponse>('/charts/push-fold', { params }),
  generateCustomChart: (data: any) => api.post<ApiResponse>('/charts/custom', data),
  getPreflopGrid: (params?: any) =>
    api.get<ApiResponse>('/charts/preflop-grid', { params }),
  getICMPressureChart: (params?: any) =>
    api.get<ApiResponse>('/charts/icm-pressure', { params }),
};

// Health check
export const healthApi = {
  check: () => api.get('/health'),
};

export default api;