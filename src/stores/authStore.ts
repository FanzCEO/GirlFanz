import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  isVerified: boolean;
  isCreator: boolean;
  subscription?: {
    plan: 'free' | 'premium' | 'creator';
    expiresAt: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
  createdAt: string;
  lastActiveAt: string;
}

export interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
  refreshToken: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
  displayName: string;
  isCreator?: boolean;
}

// Mock API functions - replace with actual API calls
const authAPI = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'test@girlfanz.com' && password === 'password') {
      const user: User = {
        id: '1',
        email,
        username: 'testuser',
        displayName: 'Test User',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5cc?w=150',
        isVerified: true,
        isCreator: false,
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            inApp: true
          }
        },
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };
      
      return { user, token: 'mock-jwt-token' };
    }
    
    throw new Error('Invalid credentials');
  },
  
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      isVerified: false,
      isCreator: data.isCreator || false,
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          inApp: true
        }
      },
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };
    
    return { user, token: 'mock-jwt-token' };
  },
  
  async refreshToken(): Promise<{ user: User; token: string }> {
    // Simulate token refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    throw new Error('Token expired');
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { user, token } = await authAPI.login(email, password);
          
          // Store token in localStorage
          localStorage.setItem('fanz_token', token);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false
          });
          throw error;
        }
      },
      
      logout: () => {
        // Clear token
        localStorage.removeItem('fanz_token');
        
        set({
          user: null,
          isAuthenticated: false,
          error: null
        });
      },
      
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const { user, token } = await authAPI.register(data);
          
          // Store token
          localStorage.setItem('fanz_token', token);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false
          });
          throw error;
        }
      },
      
      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...updates }
          });
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      refreshToken: async () => {
        try {
          const { user, token } = await authAPI.refreshToken();
          localStorage.setItem('fanz_token', token);
          set({ user, isAuthenticated: true });
        } catch (error) {
          // Token refresh failed, logout user
          get().logout();
          throw error;
        }
      }
    }),
    {
      name: 'fanz-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);