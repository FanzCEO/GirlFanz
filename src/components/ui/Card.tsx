import React from 'react';
import { styled } from 'styled-components';
import { theme } from '../../lib/constants/theme';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  children: React.ReactNode;
}

interface CardHeaderProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
}

interface CardContentProps {
  children: React.ReactNode;
}

interface CardFooterProps {
  children: React.ReactNode;
}

const StyledCard = styled.div<CardProps>`
  border-radius: ${theme.borderRadius.lg};
  transition: all ${theme.motion.duration.normal} ${theme.motion.easing.default};
  overflow: hidden;
  
  /* Variant styles */
  ${({ variant = 'default' }) => {
    switch (variant) {
      case 'elevated':
        return `
          background: ${theme.colors.background.elevated};
          border: 1px solid ${theme.colors.border.muted};
          box-shadow: ${theme.shadows.md};
        `;
      case 'outlined':
        return `
          background: ${theme.colors.background.page};
          border: 1px solid ${theme.colors.border.elevated};
        `;
      case 'glass':
        return `
          background: rgba(14, 14, 20, 0.8);
          border: 1px solid ${theme.colors.border.muted};
          backdrop-filter: blur(12px);
          box-shadow: ${theme.shadows.lg};
        `;
      default:
        return `
          background: ${theme.colors.background.card};
          border: 1px solid ${theme.colors.border.muted};
          box-shadow: ${theme.shadows.sm};
        `;
    }
  }}
  
  /* Padding variants */
  ${({ padding = 'md' }) => {
    switch (padding) {
      case 'none':
        return 'padding: 0;';
      case 'sm':
        return `padding: ${theme.spacing[3]};`;
      case 'lg':
        return `padding: ${theme.spacing[6]};`;
      default:
        return `padding: ${theme.spacing[4]};`;
    }
  }}
  
  /* Interactive state */
  ${({ interactive }) => interactive && `
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.lg};
    }
    
    &:active {
      transform: translateY(0);
    }
    
    &:focus-visible {
      outline: 2px solid ${theme.colors.border.focus};
      outline-offset: 2px;
    }
  `}
`;

const CardHeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing[4]};
  
  /* If card has no padding, add padding to header */
  .card-no-padding & {
    padding: ${theme.spacing[4]} ${theme.spacing[4]} 0;
  }
`;

const CardTitle = styled.h3`
  font-family: ${theme.typography.fonts.sans};
  font-size: ${theme.typography.sizes.lg};
  font-weight: ${theme.typography.weights.semibold};
  color: ${theme.colors.text.primary};
  margin: 0;
  line-height: ${theme.typography.lineHeights.tight};
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

const CardContentContainer = styled.div`
  /* If card has no padding, add padding to content */
  .card-no-padding & {
    padding: 0 ${theme.spacing[4]};
  }
`;

const CardFooterContainer = styled.div`
  margin-top: ${theme.spacing[4]};
  padding-top: ${theme.spacing[4]};
  border-top: 1px solid ${theme.colors.border.muted};
  
  /* If card has no padding, add padding to footer */
  .card-no-padding & {
    padding: ${theme.spacing[4]} ${theme.spacing[4]} 0;
  }
`;

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  interactive,
  children,
  className,
  ...props
}) => {
  const cardClassName = `${className || ''} ${padding === 'none' ? 'card-no-padding' : ''}`.trim();
  
  return (
    <StyledCard
      variant={variant}
      padding={padding}
      interactive={interactive}
      className={cardClassName}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, actions }) => {
  return (
    <CardHeaderContainer>
      {typeof children === 'string' ? <CardTitle>{children}</CardTitle> : children}
      {actions && <CardActions>{actions}</CardActions>}
    </CardHeaderContainer>
  );
};

export const CardContent: React.FC<CardContentProps> = ({ children }) => {
  return <CardContentContainer>{children}</CardContentContainer>;
};

export const CardFooter: React.FC<CardFooterProps> = ({ children }) => {
  return <CardFooterContainer>{children}</CardFooterContainer>;
};