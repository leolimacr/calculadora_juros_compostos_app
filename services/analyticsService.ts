
import { logEvent as logger } from './logger';

export function trackEvent(name: string, params?: Record<string, any>): void {
  // Log para dev
  logger('info', `Analytics: ${name}`, params);

  // Integração Google Analytics 4 (GA4)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, params);
  }
}

export function trackViewUpgradePage(): void {
  trackEvent('view_upgrade_page');
}

export function trackStartCheckout(planId: string): void {
  trackEvent('begin_checkout', { 
    currency: 'BRL',
    items: [{ item_id: planId }] 
  });
}

export function trackCheckoutSuccess(planId?: string): void {
  trackEvent('purchase', {
    currency: 'BRL',
    transaction_id: new Date().getTime().toString(), // Fallback ID
    items: planId ? [{ item_id: planId }] : undefined
  });
}

export function trackPaywallView(source: string): void {
  trackEvent('view_paywall', { source });
}
