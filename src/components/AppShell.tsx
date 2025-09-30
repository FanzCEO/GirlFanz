'use client';

import React from 'react';
import { SimpleAppLayout } from './layout/SimpleAppLayout';
import { LoginModal } from './modals/LoginModal';
import { RegisterModal } from './modals/RegisterModal';

interface AppShellProps {
  children: React.ReactNode;
  useLayout?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ 
  children, 
  useLayout = false 
}) => {
  // For now, we'll render children directly when useLayout is false
  // This allows the existing landing page to work as-is
  if (!useLayout) {
    return (
      <>
        {children}
        
        {/* Global Modals */}
        <LoginModal />
        <RegisterModal />
      </>
    );
  }

  // For authenticated/app pages, use the full layout
  return (
    <SimpleAppLayout>
      {children}
      
      {/* Global Modals */}
      <LoginModal />
      <RegisterModal />
    </SimpleAppLayout>
  );
};