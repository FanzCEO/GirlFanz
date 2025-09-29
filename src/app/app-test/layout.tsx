import React from 'react';
import { AppShell } from '../../src/components/AppShell';

export default function AppTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell useLayout={true}>
      {children}
    </AppShell>
  );
}