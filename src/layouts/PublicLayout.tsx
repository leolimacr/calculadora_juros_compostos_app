import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';

const PublicLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { isPro, isPremium } = useSubscriptionAccess();

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
        isPro={isPro}
        isPremium={isPremium}
      />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
