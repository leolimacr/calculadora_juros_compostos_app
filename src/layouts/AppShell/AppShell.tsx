import React from 'react';

interface AppShellProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  bottomNavigation?: React.ReactNode;
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ 
  header, 
  sidebar, 
  bottomNavigation, 
  children 
}) => {
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {header && <header>{header}</header>}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {sidebar && (
          <aside className="hidden md:flex w-64 border-r border-slate-200">
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      {bottomNavigation && (
        <div className="md:hidden">
          {bottomNavigation}
        </div>
      )}
    </div>
  );
};

export default AppShell;
