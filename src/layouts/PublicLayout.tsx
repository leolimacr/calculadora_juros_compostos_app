import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { useEntitlement } from '../hooks/useEntitlement';

const PublicLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { effectiveTier } = useEntitlement();
  const isPro = effectiveTier !== 'free';
  const isPremium = effectiveTier === 'premium';

  return (
    <div className="min-h-screen bg-surface-secondary">
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
