// [CONTEÚDO INTEGRAL DE src/services/NotificationService.ts]
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const NotificationService = {
  // Solicita permissão ao usuário (obrigatório no Android)
  async requestPermission() {
    if (!Capacitor.isNativePlatform()) return false;
    
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (error) {
      console.error("Erro ao solicitar permissão de notificações:", error);
      return false;
    }
  },

  // Agenda um lembrete diário para as 20:00h
  async scheduleDailyReminder() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Cancela agendamentos antigos com o mesmo ID para não duplicar
      await LocalNotifications.cancel({ notifications: [{ id: 101 }] });

      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Hora de organizar o patrimônio! 💰",
            body: "Não esqueça de lançar seus gastos de hoje no Controla.",
            id: 101,
            schedule: {
              on: {
                hour: 20,
                minute: 0
              },
              every: 'day',
              allowWhileIdle: true
            },
            sound: 'default',
            extra: null
          }
        ]
      });
      console.log("Lembrete diário agendado para as 20h.");
    } catch (error) {
      console.error("Erro ao agendar notificação:", error);
    }
  },

  // Limpa notificações (útil no Logout)
  async cancelAll() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 101 }] });
    } catch (error) {
      console.error("Erro ao cancelar notificações:", error);
    }
  }
};