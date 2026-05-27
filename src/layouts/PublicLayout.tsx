import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../contexts/AuthContext';

const PublicLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        isAuthenticated={isAuthenticated}
        userMeta={null}
        userDisplayName={user?.displayName || undefined}
        isPrivacyMode={false}
        onTogglePrivacy={() => {}}
        onLogout={() => {}}
        onOpenMobileMenu={() => {}}
      />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
