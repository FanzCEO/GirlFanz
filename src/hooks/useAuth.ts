import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    updateUser,
    clearError,
    refreshToken
  } = useAuthStore();

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Derived state
    isCreator: user?.isCreator || false,
    isVerified: user?.isVerified || false,
    
    // Actions
    login,
    logout,
    register,
    updateUser,
    clearError,
    refreshToken,
    
    // Helper functions
    can: (permission: string) => {
      // Implement permission checking logic here
      // For now, just check if user is authenticated
      return isAuthenticated;
    },
    
    hasRole: (role: 'user' | 'creator' | 'admin') => {
      if (!user) return false;
      
      switch (role) {
        case 'creator':
          return user.isCreator;
        case 'admin':
          return user.email.includes('@fanz.'); // Simple admin check
        default:
          return true;
      }
    }
  };
};