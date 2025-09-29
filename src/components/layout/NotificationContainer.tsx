import React from 'react';
import { styled } from 'styled-components';
import { theme } from '../../lib/constants/theme';
import { useNotifications } from '../../hooks/useNotifications';

const Container = styled.div`
  position: fixed;
  top: ${theme.spacing[4]};
  right: ${theme.spacing[4]};
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
  pointer-events: none;
  
  @media (max-width: 768px) {
    top: ${theme.spacing[3]};
    right: ${theme.spacing[3]};
    left: ${theme.spacing[3]};
  }
`;

const NotificationItem = styled.div<{ $type: string }>`
  background: var(--bg-elevated);
  border: 1px solid var(--border-elevated);
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing[4]};
  box-shadow: ${theme.shadows.lg};
  pointer-events: auto;
  min-width: 320px;
  max-width: 400px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${({ $type }) => {
      switch ($type) {
        case 'success': return 'var(--success)';
        case 'error': return 'var(--danger)';
        case 'warning': return 'var(--warning)';
        default: return 'var(--info)';
      }
    }};
  }
  
  @media (max-width: 768px) {
    min-width: auto;
    max-width: none;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${theme.spacing[1]};
`;

const Title = styled.h4`
  margin: 0;
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.weights.semibold};
  color: var(--text-primary);
  line-height: ${theme.typography.lineHeights.tight};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.borderRadius.sm};
  transition: color ${theme.motion.duration.fast} ${theme.motion.easing.default};
  
  &:hover {
    color: var(--text-primary);
  }
  
  &:focus-visible {
    outline: 2px solid var(--border-focus);
    outline-offset: 1px;
  }
`;

const Message = styled.p`
  margin: 0;
  font-size: ${theme.typography.sizes.sm};
  color: var(--text-secondary);
  line-height: ${theme.typography.lineHeights.normal};
`;

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();
  
  if (notifications.length === 0) {
    return null;
  }
  
  return (
    <Container>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          $type={notification.type}
          role="alert"
          aria-live="polite"
        >
          <Header>
            <Title>{notification.title}</Title>
            <CloseButton
              onClick={() => removeNotification(notification.id)}
              aria-label="Close notification"
            >
              <CloseIcon />
            </CloseButton>
          </Header>
          
          {notification.message && (
            <Message>{notification.message}</Message>
          )}
        </NotificationItem>
      ))}
    </Container>
  );
};