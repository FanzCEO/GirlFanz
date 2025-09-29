import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { useAuth } from '../../hooks/useAuth';

export const SimpleHeader: React.FC = () => {
  const { toggleSidebar, openModal, notifications } = useAppStore();
  const { user, isAuthenticated } = useAuth();
  
  const handleUserClick = () => {
    if (isAuthenticated) {
      openModal('profileModal');
    } else {
      openModal('loginModal');
    }
  };
  
  const getUserInitials = () => {
    if (!user) return 'G';
    return user.displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <header className="flex items-center justify-between px-6 py-3 fanz-bg-elevated border-b border-gray-700">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        
        <div className="text-xl font-bold fanz-brand-primary">
          GirlFanz
        </div>
      </div>
      
      {/* Center - Search Bar */}
      <div className="hidden md:flex items-center bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 w-96">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 mr-2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="search"
          placeholder="Search creators, content..."
          className="bg-transparent border-none outline-none text-white placeholder-gray-500 flex-1"
        />
      </div>
      
      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          className="relative p-2 text-gray-400 hover:text-white transition-colors"
          aria-label={`Notifications ${notifications.length > 0 ? `(${notifications.length})` : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>
        
        {/* User menu */}
        {isAuthenticated ? (
          <button
            onClick={handleUserClick}
            className="w-8 h-8 fanz-bg-secondary rounded-full flex items-center justify-center text-black text-sm font-medium hover:opacity-90 transition-opacity"
            aria-label="User menu"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              getUserInitials()
            )}
          </button>
        ) : (
          <button
            onClick={() => openModal('loginModal')}
            className="px-4 py-2 fanz-bg-primary hover:opacity-90 text-white rounded-lg text-sm font-medium transition-opacity"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
};