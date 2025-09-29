import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);

const ExploreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76" />
  </svg>
);

const FollowingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const MessagesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const StudioIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

export const SimpleSidebar: React.FC = () => {
  const { user, isAuthenticated, isCreator } = useAuth();
  const [activeItem, setActiveItem] = React.useState('home');
  
  const getUserInitials = () => {
    if (!user) return 'G';
    return user.displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'explore', label: 'Explore', icon: ExploreIcon },
    { id: 'following', label: 'Following', icon: FollowingIcon },
    { id: 'messages', label: 'Messages', icon: MessagesIcon },
    ...(isCreator ? [{ id: 'studio', label: 'Creator Studio', icon: StudioIcon }] : []),
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];
  
  return (
    <nav className="flex flex-col h-full py-6">
      {/* Main Navigation */}
      <div className="px-4 mb-6">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveItem(item.id)}
                  className={`
                    flex items-center gap-3 w-full px-3 py-3 rounded-lg text-left text-sm font-medium
                    transition-all duration-200 hover:translate-x-1
                    ${isActive 
                      ? 'fanz-bg-primary text-white' 
                      : 'text-gray-300 hover:fanz-bg-card'
                    }
                  `}
                >
                  <Icon />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* User Info */}
      {isAuthenticated && user && (
        <div className="mt-auto px-4 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-3 p-3 fanz-bg-card rounded-lg">
            <div className="w-10 h-10 fanz-bg-secondary rounded-full flex items-center justify-center text-black text-sm font-medium flex-shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                getUserInitials()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">
                {user.displayName}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {isCreator ? 'Creator' : 'Fan'}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};