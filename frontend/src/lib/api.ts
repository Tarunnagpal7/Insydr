import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:800/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Check if the error is 401 and we are NOT on the login page already
    // Also skip redirect if the request was to the login endpoint itself (failed login)
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    
    if (error.response?.status === 401 && !isLoginRequest) {
      if (typeof window !== 'undefined') {
        const isLoginPage = window.location.pathname === '/login';
        
        if (!isLoginPage) {
          // Clear token and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// API Error type
export interface ApiError {
  detail: string;
  status: number;
}

// Helper to extract error message
// Helper to extract error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    
    // Handle string error message (backend custom errors)
    if (typeof detail === 'string') {
      return detail;
    }

    // Handle array of errors (e.g. Pydantic validation errors)
    if (Array.isArray(detail)) {
      return detail.map((err: any) => err.msg || JSON.stringify(err)).join('. ');
    }
    
    // Fallback for network errors or other axios errors
    if (error.code === 'ERR_NETWORK') {
      return "Unable to connect to the server. Please check your internet connection.";
    }
    
    return error.message || 'Something went wrong. Please try again later.';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

export default apiClient;
