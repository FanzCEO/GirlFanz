import React from 'react';
import { styled } from 'styled-components';
import { theme } from '../../lib/constants/theme';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
  isInvalid?: boolean;
}

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[1]};
  width: 100%;
`;

const Label = styled.label`
  font-family: ${theme.typography.fonts.sans};
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.weights.medium};
  color: ${theme.colors.text.primary};
  cursor: pointer;
`;

const InputWrapper = styled.div<{ hasLeftIcon: boolean; hasRightIcon: boolean; isInvalid: boolean; variant: string }>`
  position: relative;
  display: flex;
  align-items: center;
  
  ${({ variant }) => {
    switch (variant) {
      case 'filled':
        return `
          background: ${theme.colors.background.elevated};
          border: 1px solid ${theme.colors.border.muted};
          border-radius: ${theme.borderRadius.md};
        `;
      default:
        return `
          background: ${theme.colors.background.page};
          border: 1px solid ${theme.colors.border.muted};
          border-radius: ${theme.borderRadius.md};
        `;
    }
  }}
  
  ${({ isInvalid }) => isInvalid && `
    border-color: ${theme.colors.status.danger};
    box-shadow: 0 0 0 3px rgba(255, 87, 87, 0.1);
  `}
  
  &:focus-within {
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(124, 77, 255, 0.1);
  }
  
  transition: all ${theme.motion.duration.fast} ${theme.motion.easing.default};
`;

const StyledInput = styled.input<InputProps>`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: ${theme.typography.fonts.sans};
  font-size: ${theme.typography.sizes.base};
  color: ${theme.colors.text.primary};
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  
  ${({ leftIcon }) => leftIcon && `padding-left: ${theme.spacing[12]};`}
  ${({ rightIcon }) => rightIcon && `padding-right: ${theme.spacing[12]};`}
  
  &::placeholder {
    color: ${theme.colors.text.muted};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Remove default appearance for specific input types */
  &[type="search"] {
    appearance: none;
    &::-webkit-search-cancel-button {
      display: none;
    }
  }
  
  &[type="number"] {
    appearance: textfield;
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      display: none;
    }
  }
`;

const IconContainer = styled.div<{ position: 'left' | 'right' }>`
  position: absolute;
  ${({ position }) => position}: ${theme.spacing[3]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.text.muted};
  pointer-events: none;
  z-index: 1;
`;

const HelperText = styled.div<{ isError?: boolean }>`
  font-family: ${theme.typography.fonts.sans};
  font-size: ${theme.typography.sizes.xs};
  color: ${({ isError }) => isError ? theme.colors.status.danger : theme.colors.text.muted};
  min-height: 16px;
`;

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  variant = 'default',
  isInvalid,
  id,
  className,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = isInvalid || !!error;
  
  return (
    <InputContainer className={className}>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      
      <InputWrapper
        hasLeftIcon={!!leftIcon}
        hasRightIcon={!!rightIcon}
        isInvalid={hasError}
        variant={variant}
      >
        {leftIcon && (
          <IconContainer position="left">
            {leftIcon}
          </IconContainer>
        )}
        
        <StyledInput
          id={inputId}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          aria-invalid={hasError}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        
        {rightIcon && (
          <IconContainer position="right">
            {rightIcon}
          </IconContainer>
        )}
      </InputWrapper>
      
      <HelperText isError={hasError} id={error ? `${inputId}-error` : `${inputId}-hint`}>
        {error || hint}
      </HelperText>
    </InputContainer>
  );
};