import React from 'react';
import { styled } from 'styled-components';
import { theme } from '../../lib/constants/theme';
import { useAppStore } from '../../stores/appStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { NotificationContainer } from './NotificationContainer';

interface AppLayoutProps {
  children: React.ReactNode;
}

const LayoutContainer = styled.div`
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main";
  grid-template-columns: 280px 1fr;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  background: var(--bg-page);
  color: var(--text-primary);
  font-family: ${theme.typography.fonts.sans};
  
  @media (max-width: 1024px) {
    grid-template-areas:
      "header"
      "main";
    grid-template-columns: 1fr;
  }
`;

const HeaderArea = styled.header`
  grid-area: header;
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-muted);
  backdrop-filter: blur(12px);
`;

const SidebarArea = styled.aside<{ $isOpen: boolean }>`
  grid-area: sidebar;
  background: var(--bg-elevated);
  border-right: 1px solid var(--border-muted);
  transition: transform ${theme.motion.duration.normal} ${theme.motion.easing.default};
  
  @media (max-width: 1024px) {
    position: fixed;
    top: 60px;
    left: 0;
    bottom: 0;
    width: 280px;
    z-index: 50;
    transform: translateX(${({ $isOpen }) => $isOpen ? '0' : '-100%'});
    box-shadow: ${({ $isOpen }) => $isOpen ? theme.shadows.lg : 'none'};
  }
`;

const MainContent = styled.main<{ $sidebarOpen: boolean }>`
  grid-area: main;
  min-height: 0; /* Allow content to shrink */
  overflow: auto;
  
  @media (max-width: 1024px) {
    transition: transform ${theme.motion.duration.normal} ${theme.motion.easing.default};
    ${({ $sidebarOpen }) => $sidebarOpen && `
      transform: translateX(280px);
    `}
  }
`;

const Overlay = styled.div<{ $show: boolean }>`
  display: none;
  
  @media (max-width: 1024px) {
    display: block;
    position: fixed;
    inset: 0;
    background: var(--bg-overlay);
    z-index: 40;
    opacity: ${({ $show }) => $show ? 1 : 0};
    visibility: ${({ $show }) => $show ? 'visible' : 'hidden'};
    transition: opacity ${theme.motion.duration.normal} ${theme.motion.easing.default};
  }
`;

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  
  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };
  
  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    const handleRouteChange = () => {
      if (window.innerWidth <= 1024) {
        setSidebarOpen(false);
      }
    };
    
    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [setSidebarOpen]);
  
  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);
  
  return (
    <LayoutContainer>
      <HeaderArea>
        <Header />
      </HeaderArea>
      
      <SidebarArea $isOpen={sidebarOpen}>
        <Sidebar />
      </SidebarArea>
      
      <MainContent $sidebarOpen={sidebarOpen}>
        {children}
      </MainContent>
      
      <Overlay $show={sidebarOpen} onClick={handleOverlayClick} />
      
      <NotificationContainer />
    </LayoutContainer>
  );
};