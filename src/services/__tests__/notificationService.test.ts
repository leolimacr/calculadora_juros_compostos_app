import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockSchedule = vi.hoisted(() => vi.fn());
const mockCancel = vi.hoisted(() => vi.fn());

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => true),
  },
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    requestPermissions: vi.fn(async () => ({ display: 'granted' })),
    schedule: mockSchedule,
    cancel: mockCancel,
  },
}));

import { NotificationService } from '../NotificationService';

describe('NotificationService recurring bill scheduling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSchedule.mockClear();
    mockCancel.mockClear();
    vi.setSystemTime(new Date('2026-06-29T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('agenda conta recorrente para 06:00 no dia do vencimento', async () => {
    await NotificationService.scheduleRecurringBillDueNotification(
      {
        id: 'bill-123',
        userId: 'user-1',
        name: 'Aluguel',
        amount: 1200,
        dueDay: 30,
        category: 'Moradia',
        isActive: true,
        type: 'fixed',
      },
      'user-1'
    );

    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockSchedule).toHaveBeenCalledTimes(1);

    const scheduled = mockSchedule.mock.calls[0][0].notifications[0];
    expect(scheduled.title).toContain('Aluguel');
    expect(scheduled.extra).toMatchObject({
      billId: 'bill-123',
      userId: 'user-1',
      deepLink: 'app://mark-bill-paid/bill-123',
    });

    const scheduledAt = scheduled.schedule.at as Date;
    expect(scheduledAt.getDate()).toBe(30);
    expect(scheduledAt.getHours()).toBe(6);
    expect(scheduledAt.getMinutes()).toBe(0);
  });
});
