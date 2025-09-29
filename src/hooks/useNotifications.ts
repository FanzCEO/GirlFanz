import { useAppStore } from '../stores/appStore';

export const useNotifications = () => {
  const {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications
  } = useAppStore();

  const showSuccess = (title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => {
    addNotification({
      type: 'success',
      title,
      message,
      ...options
    });
  };

  const showError = (title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => {
    addNotification({
      type: 'error',
      title,
      message,
      persistent: true, // Errors should be persistent by default
      ...options
    });
  };

  const showWarning = (title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => {
    addNotification({
      type: 'warning',
      title,
      message,
      ...options
    });
  };

  const showInfo = (title: string, message?: string, options?: { duration?: number; persistent?: boolean }) => {
    addNotification({
      type: 'info',
      title,
      message,
      ...options
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};