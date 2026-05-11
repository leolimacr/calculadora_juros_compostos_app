import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// IDs reservados por categoria para evitar duplicatas
const NOTIFICATION_IDS = {
  debt_due: 201,
  debt_inactive: 202,
  debt_context: 203,
  wealth_aport: 204,
  wealth_goal: 205,
  nexus_insight: 206,
  reengagement: 207,
} as const;

type NotificationCategory = keyof typeof NOTIFICATION_IDS;

export interface PresenceNotificationPayload {
  category: NotificationCategory;
  title: string;
  body: string;
  deepLink?: string;
}

export const NotificationService = {
  async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (error) {
      console.error('[NotificationService] Erro ao solicitar permissão:', error);
      return false;
    }
  },

  // Despacha um push contextual a partir de um evento de presença
  // Chamado pelo PresenceEventService após validar cooldown e frequency cap
  async dispatch(payload: PresenceNotificationPayload): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const id = NOTIFICATION_IDS[payload.category];

    try {
      // Cancela notificação anterior da mesma categoria (evita empilhamento)
      await LocalNotifications.cancel({ notifications: [{ id }] });

      await LocalNotifications.schedule({
        notifications: [
          {
            title: payload.title,
            body: payload.body,
            id,
            schedule: { at: new Date(Date.now() + 500) }, // imediato
            sound: 'default',
            extra: { deepLink: payload.deepLink ?? null },
          },
        ],
      });
    } catch (error) {
      console.error(`[NotificationService] Erro ao despachar categoria ${payload.category}:`, error);
    }
  },

  async cancelCategory(category: NotificationCategory): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_IDS[category] }] });
    } catch (error) {
      console.error(`[NotificationService] Erro ao cancelar ${category}:`, error);
    }
  },

  async cancelAll(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const all = Object.values(NOTIFICATION_IDS).map(id => ({ id }));
      await LocalNotifications.cancel({ notifications: all });
    } catch (error) {
      console.error('[NotificationService] Erro ao cancelar todas:', error);
    }
  },
};