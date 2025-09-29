import React from 'react';
import { styled } from 'styled-components';
import { theme } from '../../lib/constants/theme';
import { useAuth } from '../../hooks/useAuth';

const SidebarContainer = styled.nav`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: ${theme.spacing[6]} 0;
`;

const NavSection = styled.div`
  padding: 0 ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[6]};
`;

const SectionTitle = styled.h3`
  font-size: ${theme.typography.sizes.xs};
  font-weight: ${theme.typography.weights.semibold};
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 ${theme.spacing[3]} 0;
  padding: 0 ${theme.spacing[3]};
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[1]};
`;

const NavItem = styled.li``;

const NavLink = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  width: 100%;
  padding: ${theme.spacing[3]};
  border: none;
  background: ${({ $active }) => $active ? 'var(--color-primary)' : 'transparent'};
  color: ${({ $active }) => $active ? 'var(--text-inverse)' : 'var(--text-primary)'};
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  text-align: left;
  font-family: ${theme.typography.fonts.sans};
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${({ $active }) => $active ? theme.typography.weights.medium : theme.typography.weights.normal};
  transition: all ${theme.motion.duration.fast} ${theme.motion.easing.default};
  
  &:hover:not([disabled]) {
    background: ${({ $active }) => $active ? 'var(--color-primary)' : 'var(--bg-card)'};
    transform: translateX(2px);
  }
  
  &:focus-visible {
    outline: 2px solid var(--border-focus);
    outline-offset: 2px;
  }
  
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

const UserInfo = styled.div`
  margin-top: auto;
  padding: ${theme.spacing[4]};
  border-top: 1px solid var(--border-muted);
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[3]};
  background: var(--bg-card);
  border-radius: ${theme.borderRadius.md};
`;

const UserAvatar = styled.div<{ $src?: string }>`
  width: 40px;
  height: 40px;
  border-radius: ${theme.borderRadius.full};
  background: ${({ $src }) => $src ? `url(${$src})` : 'var(--color-secondary)'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.weights.medium};
  flex-shrink: 0;
`;

const UserDetails = styled.div`
  min-width: 0;
  flex: 1;
`;

const UserName = styled.div`
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.weights.medium};
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserRole = styled.div`
  font-size: ${theme.typography.sizes.xs};
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Mock icons - replace with your icon library
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);

const ExploreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76" />
  </svg>
);

const FollowingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const MessagesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const StudioIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

export const Sidebar: React.FC = () => {
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
  
  return (
    <SidebarContainer>
      <NavSection>
        <NavList>
          <NavItem>
            <NavLink
              $active={activeItem === 'home'}
              onClick={() => setActiveItem('home')}
            >
              <HomeIcon />
              Home
            </NavLink>
          </NavItem>
          
          <NavItem>
            <NavLink
              $active={activeItem === 'explore'}
              onClick={() => setActiveItem('explore')}
            >
              <ExploreIcon />
              Explore
            </NavLink>
          </NavItem>
          
          {isAuthenticated && (
            <>
              <NavItem>
                <NavLink
                  $active={activeItem === 'following'}
                  onClick={() => setActiveItem('following')}
                >
                  <FollowingIcon />
                  Following
                </NavLink>
              </NavItem>
              
              <NavItem>
                <NavLink
                  $active={activeItem === 'messages'}
                  onClick={() => setActiveItem('messages')}
                >
                  <MessagesIcon />
                  Messages
                </NavLink>
              </NavItem>
            </>
          )}
        </NavList>
      </NavSection>
      
      {isAuthenticated && isCreator && (
        <NavSection>
          <SectionTitle>Creator Tools</SectionTitle>
          <NavList>
            <NavItem>
              <NavLink
                $active={activeItem === 'studio'}
                onClick={() => setActiveItem('studio')}
              >
                <StudioIcon />
                Creator Studio
              </NavLink>
            </NavItem>
          </NavList>
        </NavSection>
      )}
      
      {isAuthenticated && (
        <NavSection>
          <SectionTitle>Account</SectionTitle>
          <NavList>
            <NavItem>
              <NavLink
                $active={activeItem === 'settings'}
                onClick={() => setActiveItem('settings')}
              >
                <SettingsIcon />
                Settings
              </NavLink>
            </NavItem>
          </NavList>
        </NavSection>
      )}
      
      {isAuthenticated && user && (
        <UserInfo>
          <UserCard>
            <UserAvatar $src={user.avatar}>
              {!user.avatar && getUserInitials()}
            </UserAvatar>
            <UserDetails>
              <UserName>{user.displayName}</UserName>
              <UserRole>{user.isCreator ? 'Creator' : 'Fan'}</UserRole>
            </UserDetails>
          </UserCard>
        </UserInfo>
      )}
    </SidebarContainer>
  );
};