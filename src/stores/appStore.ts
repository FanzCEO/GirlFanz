import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  createdAt: Date;
}

export interface AppState {
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  isOnline: boolean;
  
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Modal state
  modals: {
    loginModal: boolean;
    registerModal: boolean;
    profileModal: boolean;
  };
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  
  // Modal actions
  openModal: (modal: keyof AppState['modals']) => void;
  closeModal: (modal: keyof AppState['modals']) => void;
  closeAllModals: () => void;
  
  // Network status
  setOnlineStatus: (online: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  sidebarOpen: false,
  theme: 'dark',
  notifications: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  globalLoading: false,
  loadingStates: {},
  modals: {
    loginModal: false,
    registerModal: false,
    profileModal: false,
  },
  
  // Sidebar actions
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },
  
  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },
  
  // Theme actions
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
    
    // Update document data attribute for CSS
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    
    // Store theme preference
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fanz-theme', theme);
    }
  },
  
  // Notification actions
  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      id,
      ...notification,
      createdAt: new Date(),
    };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }));
    
    // Auto remove notification if not persistent
    if (!notification.persistent) {
      const duration = notification.duration || 5000;
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },
  
  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },
  
  clearNotifications: () => {
    set({ notifications: [] });
  },
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => {
    set({ globalLoading: loading });
  },
  
  setLoading: (key: string, loading: boolean) => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [key]: loading
      }
    }));
  },
  
  // Modal actions
  openModal: (modal) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modal]: true
      }
    }));
  },
  
  closeModal: (modal) => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modal]: false
      }
    }));
  },
  
  closeAllModals: () => {
    set({
      modals: {
        loginModal: false,
        registerModal: false,
        profileModal: false,
      }
    });
  },
  
  // Network status
  setOnlineStatus: (online: boolean) => {
    set({ isOnline: online });
  }
}));

// Initialize theme on app start
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('fanz-theme') as 'light' | 'dark' | null;
  if (savedTheme) {
    useAppStore.getState().setTheme(savedTheme);
  }
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    useAppStore.getState().setOnlineStatus(true);
  });
  
  window.addEventListener('offline', () => {
    useAppStore.getState().setOnlineStatus(false);
  });
}