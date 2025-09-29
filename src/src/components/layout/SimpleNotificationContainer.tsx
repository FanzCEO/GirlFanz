import React from 'react';
import { useAppStore } from '../../stores/appStore';

const CheckIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"></polyline>
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export const SimpleNotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useAppStore();

  if (notifications.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckIcon />;
      case 'error':
        return <AlertIcon />;
      case 'warning':
        return <AlertIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-900 border-green-700 text-green-100';
      case 'error':
        return 'bg-red-900 border-red-700 text-red-100';
      case 'warning':
        return 'bg-yellow-900 border-yellow-700 text-yellow-100';
      default:
        return 'bg-blue-900 border-blue-700 text-blue-100';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm
            transform transition-all duration-300 ease-in-out
            animate-in slide-in-from-right-5
            ${getStyles(notification.type)}
          `}
          role="alert"
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            {notification.title && (
              <h4 className="text-sm font-medium mb-1">
                {notification.title}
              </h4>
            )}
            <p className="text-sm opacity-90">
              {notification.message}
            </p>
          </div>
          
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            aria-label="Dismiss notification"
          >
            <XIcon />
          </button>
        </div>
      ))}
    </div>
  );
};