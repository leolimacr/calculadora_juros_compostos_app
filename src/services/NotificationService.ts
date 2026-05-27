import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { NexusInsight } from './nexusInsightEngine';

// IDs reservados por categoria para evitar duplicatas
const NOTIFICATION_IDS = {
  debt_due: 201,
  debt_inactive: 202,
  debt_context: 203,
  wealth_aport: 204,
  wealth_goal: 205,
  nexus_insight: 206,
  reengagement: 207,
  daily_reminder: 208,
} as const;

export type NotificationCategory = keyof typeof NOTIFICATION_IDS;

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

  async scheduleDailyReminder(insight?: NexusInsight | null): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const title = insight?.message.title || "Hora de organizar?";
    const body = insight?.message.body || "Que tal registrar suas movimentações de hoje? Manter a rotina gera clareza.";
    const deepLink = insight?.deepLink || 'transaction-form';

    try {
      await this.cancelCategory('daily_reminder');
      
      const scheduledTime = new Date();
      scheduledTime.setHours(20, 0, 0, 0); // Todo dia às 20h
      
      // Se já passou das 20h hoje, agenda para amanhã
      if (new Date().getTime() > scheduledTime.getTime()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIFICATION_IDS.daily_reminder,
            title,
            body,
            schedule: { at: scheduledTime, repeats: true },
            sound: 'default',
            extra: { deepLink },
          }
        ]
      });
    } catch (error) {
      console.error('[NotificationService] Erro ao agendar lembrete diário:', error);
    }
  },

  async scheduleReengagementReminder(estimatedBalance: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const formatCurrency = (val: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    try {
      await this.cancelCategory('reengagement');

      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      threeDaysLater.setHours(10, 0, 0, 0); // Às 10h da manhã

      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIFICATION_IDS.reengagement,
            title: "Foco na Eficiência",
            body: `Seu saldo atual estimado é de ${formatCurrency(estimatedBalance)}. Mantenha a precisão lançando suas últimas compras.`,
            schedule: { at: threeDaysLater },
            sound: 'default',
            extra: { deepLink: 'transaction-form' },
          }
        ]
      });
    } catch (error) {
      console.error('[NotificationService] Erro ao agendar reengajamento:', error);
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