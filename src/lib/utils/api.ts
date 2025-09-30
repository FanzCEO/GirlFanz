// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

class ApiClient {
  private baseURL: string;
  
  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        data,
        message: data.message
      };
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('fanz_token');
  }
  
  // HTTP Methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  
  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
  
  // File upload
  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }
    
    const token = this.getAuthToken();
    const config: RequestInit = {
      method: 'POST',
      body: formData,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        data,
        message: data.message
      };
    } catch (error) {
      console.error(`File upload failed: ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Convenience functions
export const get = <T>(endpoint: string) => apiClient.get<T>(endpoint);
export const post = <T>(endpoint: string, data?: unknown) => apiClient.post<T>(endpoint, data);
export const put = <T>(endpoint: string, data?: unknown) => apiClient.put<T>(endpoint, data);
export const patch = <T>(endpoint: string, data?: unknown) => apiClient.patch<T>(endpoint, data);
export const del = <T>(endpoint: string) => apiClient.delete<T>(endpoint);
export const uploadFile = <T>(endpoint: string, file: File, data?: Record<string, unknown>) => 
  apiClient.uploadFile<T>(endpoint, file, data);

// User type definitions
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: string;
  isCreator?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Auth API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    post<AuthResponse>('/auth/login', { email, password }),
    
  register: (userData: {
    email: string;
    password: string;
    username: string;
    displayName: string;
    isCreator?: boolean;
  }) => post<AuthResponse>('/auth/register', userData),
  
  logout: () => post('/auth/logout'),
  
  refreshToken: () => post<{ token: string }>('/auth/refresh'),
  
  forgotPassword: (email: string) => post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, newPassword: string) =>
    post('/auth/reset-password', { token, newPassword }),
    
  verifyEmail: (token: string) => post('/auth/verify-email', { token }),
  
  getCurrentUser: () => get<User>('/auth/me'),
};

// User API endpoints
export const userAPI = {
  getProfile: (userId: string) => get<User>(`/users/${userId}`),
  
  updateProfile: (updates: Partial<User>) => patch<User>('/users/me', updates),
  
  uploadAvatar: (file: File) => uploadFile<{ avatarUrl: string }>('/users/me/avatar', file),
  
  followUser: (userId: string) => post(`/users/${userId}/follow`),
  
  unfollowUser: (userId: string) => del(`/users/${userId}/follow`),
  
  getFollowing: (userId?: string) => get<User[]>(`/users/${userId || 'me'}/following`),
  
  getFollowers: (userId?: string) => get<User[]>(`/users/${userId || 'me'}/followers`),
};

// Content type definitions
export interface Content {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  contentId: string;
  comment: string;
  createdAt: string;
}

// Content API endpoints
export const contentAPI = {
  getFeed: (params?: { page?: number; limit?: number }) => 
    get<Content[]>(`/content/feed?${new URLSearchParams(params as Record<string, string>).toString()}`),
    
  getContent: (contentId: string) => get<Content>(`/content/${contentId}`),
  
  createContent: (contentData: Partial<Content>) => post<Content>('/content', contentData),
  
  updateContent: (contentId: string, updates: Partial<Content>) =>
    patch<Content>(`/content/${contentId}`, updates),
    
  deleteContent: (contentId: string) => del(`/content/${contentId}`),
  
  likeContent: (contentId: string) => post(`/content/${contentId}/like`),
  
  unlikeContent: (contentId: string) => del(`/content/${contentId}/like`),
  
  getComments: (contentId: string) => get<Comment[]>(`/content/${contentId}/comments`),
  
  addComment: (contentId: string, comment: string) =>
    post(`/content/${contentId}/comments`, { comment }),
};

// Error handler for async operations
export const handleApiError = (error: unknown): ApiError => {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    
    if (err.response && typeof err.response === 'object') {
      const response = err.response as Record<string, unknown>;
      const data = response.data as Record<string, unknown> | undefined;
      return {
        message: (data?.message as string) || 'Server error',
        status: (response.status as number) || 500,
        code: data?.code as string | undefined
      };
    }
    
    if (err.request) {
      return {
        message: 'Network error - please check your connection',
        status: 0
      };
    }
    
    if (err.message && typeof err.message === 'string') {
      return {
        message: err.message,
        status: 500
      };
    }
  }
  
  return {
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    status: 500
  };
};

// Retry mechanism for failed requests
export const withRetry = async <T>(
  fn: () => Promise<ApiResponse<T>>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<ApiResponse<T>> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn();
      if (result.success) {
        return result;
      }
      
      if (i === maxRetries - 1) {
        return result;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
  }
  
  throw new Error('Max retries exceeded');
};