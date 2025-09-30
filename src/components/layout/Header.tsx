import React from 'react';
import styled from 'styled-components';
import { useAppStore } from '../../stores/appStore';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../styles/theme';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.spacing[6]};
  height: 60px;
  
  @media (max-width: 768px) {
    padding: 0 ${theme.spacing[4]};
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[4]};
`;

const MenuButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  transition: background-color ${theme.motion.duration.fast} ${theme.motion.easing.default};
  
  &:hover {
    background: var(--bg-card);
  }
  
  &:focus-visible {
    outline: 2px solid var(--border-focus);
    outline-offset: 2px;
  }
  
  @media (max-width: 1024px) {
    display: flex;
  }
`;

const Logo = styled.div`
  font-size: ${theme.typography.sizes.xl};
  font-weight: ${theme.typography.weights.bold};
  color: var(--color-primary);
  text-decoration: none;
  cursor: pointer;
  
  .brand {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
`;

const SearchBar = styled.div`
  display: none;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border-muted);
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  width: 300px;
  
  input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-size: ${theme.typography.sizes.sm};
    
    &::placeholder {
      color: var(--text-muted);
    }
  }
  
  @media (min-width: 768px) {
    display: flex;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
`;

const UserAvatar = styled.div<{ $src?: string }>`
  width: 32px;
  height: 32px;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $src }) => $src ? `url(${$src})` : 'var(--color-primary)'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.weights.medium};
  cursor: pointer;
  transition: transform ${theme.motion.duration.fast} ${theme.motion.easing.default};
  
  &:hover {
    transform: scale(1.05);
  }
`;

const NotificationBadge = styled.button`
  position: relative;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color ${theme.motion.duration.fast} ${theme.motion.easing.default};
  
  &:hover {
    background: var(--bg-card);
  }
  
  &:focus-visible {
    outline: 2px solid var(--border-focus);
    outline-offset: 2px;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    background: var(--color-accent);
    border-radius: 50%;
    opacity: 0;
    transform: scale(0);
    transition: all ${theme.motion.duration.fast} ${theme.motion.easing.default};
  }
  
  &[data-has-notifications="true"]::after {
    opacity: 1;
    transform: scale(1);
  }
`;

const LoginButton = styled.button`
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:focus-visible {
    outline: 2px solid var(--border-focus);
    outline-offset: 2px;
  }
`;

// Mock SVG icons - replace with your icon library
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

export const Header: React.FC = () => {
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
    <HeaderContainer>
      <LeftSection>
        <MenuButton onClick={toggleSidebar} aria-label="Toggle menu">
          <MenuIcon />
        </MenuButton>
        
        <Logo>
          <span className="brand">GirlFanz</span>
        </Logo>
      </LeftSection>
      
      <SearchBar>
        <SearchIcon />
        <input
          type="search"
          placeholder="Search creators, content..."
          aria-label="Search"
        />
      </SearchBar>
      
      <RightSection>
        <UserSection>
          <NotificationBadge
            data-has-notifications={notifications.length > 0}
            aria-label={`Notifications ${notifications.length > 0 ? `(${notifications.length})` : ''}`}
          >
            <BellIcon />
          </NotificationBadge>
          
          {isAuthenticated ? (
            <UserAvatar
              $src={user?.avatar}
              onClick={handleUserClick}
              aria-label="User menu"
            >
              {!user?.avatar && getUserInitials()}
            </UserAvatar>
          ) : (
            <LoginButton
              onClick={() => openModal('loginModal')}
            >
              Login
            </LoginButton>
          )}
        </UserSection>
      </RightSection>
    </HeaderContainer>
  );
};