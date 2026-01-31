import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User, authApi, AuthResponse, getErrorMessage } from '@/src/lib/auth';

// Auth State Interface
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

// Initial State
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// Async Thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      if (typeof window === 'undefined') {
        return { user: null, token: null };
      }
      
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      
      if (!token) {
        return { user: null, token: null };
      }

      // If we have a stored user, use it initially
      if (storedUser) {
        const user = JSON.parse(storedUser) as User;
        // Optionally verify token by fetching current user
        try {
          const freshUser = await authApi.getMe();
          localStorage.setItem('user', JSON.stringify(freshUser));
          return { user: freshUser, token };
        } catch {
          // Token might be expired, clear storage
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          return { user: null, token: null };
        }
      }

      return { user: null, token: null };
    } catch (error) {
      return rejectWithValue('Failed to initialize auth');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.login(email, password);
      return response;
    } catch (error: any) {
      // Use the shared helper to extract and format the error message
      // This handles strings, arrays (Pydantic), and network errors consistently
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    authApi.logout();
    return null;
  }
);

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Initialize Auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = !!action.payload.token && !!action.payload.user;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { setCredentials, clearCredentials, setError, clearError } = authSlice.actions;
export default authSlice.reducer;
