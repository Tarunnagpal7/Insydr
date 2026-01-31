import apiClient, { getErrorMessage } from './api';

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  email_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

export interface OTPResponse {
  message: string;
  email: string;
  expires_in_minutes: number;
}

// Auth API functions
export const authApi = {
  // Signup
  signup: async (email: string, password: string, full_name: string): Promise<OTPResponse> => {
    const response = await apiClient.post<OTPResponse>('/auth/signup', {
      email,
      password,
      full_name,
    });
    return response.data;
  },

  // Login
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    // Store token and user
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email: string, otp_code: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/verify-otp', {
      email,
      otp_code,
    });
    // Store token and user
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (email: string): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  // Reset Password
  resetPassword: async (email: string, otp_code: string, new_password: string): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/reset-password', {
      email,
      otp_code,
      new_password,
    });
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email: string, purpose: 'email_verification' | 'password_reset'): Promise<OTPResponse> => {
    const response = await apiClient.post<OTPResponse>('/auth/resend-otp', {
      email,
      purpose,
    });
    return response.data;
  },

  // Get current user
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  // Logout
  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  },

  // Get stored user
  getStoredUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export { getErrorMessage };
