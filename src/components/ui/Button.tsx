import React from 'react';
import { styled } from 'styled-components';
import { theme } from '../../lib/constants/theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[2]};
  font-family: ${theme.typography.fonts.sans};
  font-weight: ${theme.typography.weights.medium};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid transparent;
  cursor: pointer;
  transition: all ${theme.motion.duration.fast} ${theme.motion.easing.default};
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  
  /* Accessibility */
  &:focus-visible {
    outline: 2px solid ${theme.colors.border.focus};
    outline-offset: 2px;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  /* Size variants */
  ${({ size = 'md' }) => {
    switch (size) {
      case 'sm':
        return `
          padding: ${theme.spacing[2]} ${theme.spacing[3]};
          font-size: ${theme.typography.sizes.sm};
          min-height: 32px;
        `;
      case 'lg':
        return `
          padding: ${theme.spacing[4]} ${theme.spacing[6]};
          font-size: ${theme.typography.sizes.lg};
          min-height: 48px;
        `;
      default:
        return `
          padding: ${theme.spacing[3]} ${theme.spacing[4]};
          font-size: ${theme.typography.sizes.base};
          min-height: 40px;
        `;
    }
  }}
  
  /* Color variants */
  ${({ variant = 'primary' }) => {
    switch (variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark});
          color: ${theme.colors.text.inverse};
          box-shadow: ${theme.shadows.sm};
          
          &:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: ${theme.shadows.md};
          }
          
          &:active {
            transform: translateY(0);
          }
        `;
      case 'secondary':
        return `
          background: ${theme.colors.secondary};
          color: ${theme.colors.text.inverse};
          box-shadow: ${theme.shadows.sm};
          
          &:hover:not(:disabled) {
            background: #00B8E6;
            transform: translateY(-1px);
            box-shadow: ${theme.shadows.md};
          }
        `;
      case 'outline':
        return `
          background: transparent;
          border-color: ${theme.colors.border.elevated};
          color: ${theme.colors.text.primary};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.background.elevated};
            border-color: ${theme.colors.primary};
          }
        `;
      case 'ghost':
        return `
          background: transparent;
          color: ${theme.colors.text.primary};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.background.elevated};
          }
        `;
      case 'danger':
        return `
          background: ${theme.colors.status.danger};
          color: ${theme.colors.text.inverse};
          
          &:hover:not(:disabled) {
            background: #E53E3E;
            transform: translateY(-1px);
            box-shadow: ${theme.shadows.md};
          }
        `;
      default:
        return '';
    }
  }}
  
  ${({ fullWidth }) => fullWidth && 'width: 100%;'}
  
  /* Loading state */
  ${({ isLoading }) => isLoading && `
    position: relative;
    color: transparent;
    
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: inherit;
      border-radius: inherit;
    }
  `}
`;

const LoadingSpinner = styled.div`
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  rightIcon,
  fullWidth,
  disabled,
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      isLoading={isLoading}
      fullWidth={fullWidth}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {leftIcon && !isLoading && leftIcon}
      {children}
      {rightIcon && !isLoading && rightIcon}
      {isLoading && <LoadingSpinner />}
    </StyledButton>
  );
};