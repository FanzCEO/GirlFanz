import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { SimpleHeader } from './SimpleHeader';
import { SimpleSidebar } from './SimpleSidebar';
import { SimpleNotificationContainer } from './SimpleNotificationContainer';

interface SimpleAppLayoutProps {
  children: React.ReactNode;
}

export const SimpleAppLayout: React.FC<SimpleAppLayoutProps> = ({ children }) => {
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
    <div className="grid grid-cols-[280px_1fr] grid-rows-[auto_1fr] min-h-screen fanz-bg-page text-white lg:grid-cols-1">
      {/* Header */}
      <header className="col-span-full sticky top-0 z-50 fanz-bg-elevated border-b border-gray-700 backdrop-blur-md">
        <SimpleHeader />
      </header>
      
      {/* Sidebar */}
      <aside className={`
        fanz-bg-elevated border-r border-gray-700 transition-transform duration-300 ease-in-out
        lg:fixed lg:top-16 lg:left-0 lg:bottom-0 lg:w-72 lg:z-40
        ${sidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}
      `}>
        <SimpleSidebar />
      </aside>
      
      {/* Main Content */}
      <main className={`
        min-h-0 overflow-auto
        lg:transition-transform lg:duration-300 lg:ease-in-out
        ${sidebarOpen ? 'lg:translate-x-72' : 'lg:translate-x-0'}
      `}>
        {children}
      </main>
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:block hidden"
          onClick={handleOverlayClick}
        />
      )}
      
      {/* Notifications */}
      <SimpleNotificationContainer />
    </div>
  );
};