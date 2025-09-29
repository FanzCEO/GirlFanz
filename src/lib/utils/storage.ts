// Safe storage operations for SSR compatibility

export const isClient = typeof window !== 'undefined';

// LocalStorage utilities
export const localStorage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (!isClient) return defaultValue || null;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue || null;
    }
  },
  
  set: <T>(key: string, value: T): boolean => {
    if (!isClient) return false;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
      return false;
    }
  },
  
  remove: (key: string): boolean => {
    if (!isClient) return false;
    
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      return false;
    }
  },
  
  clear: (): boolean => {
    if (!isClient) return false;
    
    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },
  
  has: (key: string): boolean => {
    if (!isClient) return false;
    return window.localStorage.getItem(key) !== null;
  },
  
  keys: (): string[] => {
    if (!isClient) return [];
    return Object.keys(window.localStorage);
  }
};

// SessionStorage utilities
export const sessionStorage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (!isClient) return defaultValue || null;
    
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return defaultValue || null;
    }
  },
  
  set: <T>(key: string, value: T): boolean => {
    if (!isClient) return false;
    
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
      return false;
    }
  },
  
  remove: (key: string): boolean => {
    if (!isClient) return false;
    
    try {
      window.sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error);
      return false;
    }
  },
  
  clear: (): boolean => {
    if (!isClient) return false;
    
    try {
      window.sessionStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
      return false;
    }
  },
  
  has: (key: string): boolean => {
    if (!isClient) return false;
    return window.sessionStorage.getItem(key) !== null;
  }
};

// Storage event listener for cross-tab communication
export const onStorageChange = (callback: (event: StorageEvent) => void): (() => void) => {
  if (!isClient) return () => {};
  
  window.addEventListener('storage', callback);
  
  return () => {
    window.removeEventListener('storage', callback);
  };
};

// Utility for creating typed storage hooks
export const createStorageHook = <T>(
  storage: typeof localStorage | typeof sessionStorage,
  key: string,
  defaultValue: T
) => {
  return {
    get: () => storage.get<T>(key, defaultValue),
    set: (value: T) => storage.set(key, value),
    remove: () => storage.remove(key),
    has: () => storage.has(key)
  };
};

// FANZ specific storage keys
export const FANZ_STORAGE_KEYS = {
  AUTH_TOKEN: 'fanz_token',
  USER_PREFERENCES: 'fanz_user_preferences',
  THEME: 'fanz_theme',
  LANGUAGE: 'fanz_language',
  ONBOARDING_STATE: 'fanz_onboarding_state',
  CREATOR_DRAFT: 'fanz_creator_draft',
  SEARCH_HISTORY: 'fanz_search_history',
  FEED_POSITION: 'fanz_feed_position',
  NOTIFICATION_SETTINGS: 'fanz_notification_settings'
} as const;

// Type-safe storage for FANZ data
export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  autoplay: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
  };
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  skippedSteps: string[];
  completedAt?: string;
}

export interface CreatorDraft {
  title: string;
  description: string;
  tags: string[];
  price?: number;
  mediaFiles: File[];
  savedAt: string;
}

// Typed storage helpers
export const fanzStorage = {
  // Auth token
  getAuthToken: () => localStorage.get<string>(FANZ_STORAGE_KEYS.AUTH_TOKEN),
  setAuthToken: (token: string) => localStorage.set(FANZ_STORAGE_KEYS.AUTH_TOKEN, token),
  removeAuthToken: () => localStorage.remove(FANZ_STORAGE_KEYS.AUTH_TOKEN),
  
  // User preferences
  getUserPreferences: () => localStorage.get<UserPreferences>(
    FANZ_STORAGE_KEYS.USER_PREFERENCES,
    {
      theme: 'dark',
      language: 'en',
      autoplay: true,
      notifications: {
        email: true,
        push: true,
        inApp: true
      },
      privacy: {
        showOnlineStatus: true,
        allowDirectMessages: true
      }
    }
  ),
  setUserPreferences: (prefs: UserPreferences) => 
    localStorage.set(FANZ_STORAGE_KEYS.USER_PREFERENCES, prefs),
  
  // Theme
  getTheme: () => localStorage.get<'light' | 'dark'>(FANZ_STORAGE_KEYS.THEME, 'dark'),
  setTheme: (theme: 'light' | 'dark') => localStorage.set(FANZ_STORAGE_KEYS.THEME, theme),
  
  // Onboarding state
  getOnboardingState: () => localStorage.get<OnboardingState>(
    FANZ_STORAGE_KEYS.ONBOARDING_STATE,
    {
      completed: false,
      currentStep: 0,
      skippedSteps: []
    }
  ),
  setOnboardingState: (state: OnboardingState) => 
    localStorage.set(FANZ_STORAGE_KEYS.ONBOARDING_STATE, state),
  
  // Creator draft
  getCreatorDraft: () => sessionStorage.get<CreatorDraft>(FANZ_STORAGE_KEYS.CREATOR_DRAFT),
  setCreatorDraft: (draft: CreatorDraft) => 
    sessionStorage.set(FANZ_STORAGE_KEYS.CREATOR_DRAFT, draft),
  removeCreatorDraft: () => sessionStorage.remove(FANZ_STORAGE_KEYS.CREATOR_DRAFT),
  
  // Search history
  getSearchHistory: () => localStorage.get<string[]>(FANZ_STORAGE_KEYS.SEARCH_HISTORY, []),
  addSearchTerm: (term: string) => {
    const history = fanzStorage.getSearchHistory();
    const updated = [term, ...history.filter(h => h !== term)].slice(0, 10);
    localStorage.set(FANZ_STORAGE_KEYS.SEARCH_HISTORY, updated);
  },
  clearSearchHistory: () => localStorage.remove(FANZ_STORAGE_KEYS.SEARCH_HISTORY)
};

// Storage quota management
export const getStorageInfo = (): { used: number; available: number; quota: number } | null => {
  if (!isClient || !('storage' in navigator) || !('estimate' in navigator.storage)) {
    return null;
  }
  
  return navigator.storage.estimate().then(estimate => ({
    used: estimate.usage || 0,
    available: (estimate.quota || 0) - (estimate.usage || 0),
    quota: estimate.quota || 0
  })).catch(() => null);
};

// Clear all FANZ storage
export const clearAllFanzStorage = (): void => {
  Object.values(FANZ_STORAGE_KEYS).forEach(key => {
    localStorage.remove(key);
    sessionStorage.remove(key);
  });
};