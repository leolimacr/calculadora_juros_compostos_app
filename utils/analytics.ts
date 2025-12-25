
// Utility for Google Analytics 4 Events
declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
  }
}

export const logEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, params);
  } else {
    // Fallback para dev/debug
    console.log(`[Analytics Dev] ${eventName}`, params);
  }
};

export const ANALYTICS_EVENTS = {
  VIEW_MANAGER: 'view_gerenciador_financeiro', // Novo: Visualizou o Dashboard
  ADD_TRANSACTION: 'add_transaction',
  VIEW_DAILY_SUMMARY: 'view_daily_summary', // Novo: Viu o resumo diário (engajamento)
  GOAL_PROGRESS_VIEW: 'goal_progress_view',
  GOAL_COMPLETED: 'goal_completed', // Novo: Atingiu 100% de uma meta
  PWA_INSTALL_CLICK: 'pwa_install_click',
  PWA_INSTALLED: 'pwa_installed'
};
