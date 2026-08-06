import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface AlarmInfo {
  commitmentId: string;
  title: string;
  dateStr: string;
  alarmAt: Date;
}

let scheduledInterval: ReturnType<typeof setInterval> | null = null;
let onAlarmDue: ((info: AlarmInfo) => void) | null = null;
const firedIds = new Set<string>();

const isNative = Capacitor.isNativePlatform();

/** Register callback for when an alarm is due */
export function setAlarmCallback(cb: (info: AlarmInfo) => void) {
  onAlarmDue = cb;
}

/** Schedule a single alarm */
export async function scheduleAlarm(info: AlarmInfo) {
  if (isNative) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: hashId(info.commitmentId),
          title: 'Agenda',
          body: info.title,
          schedule: { at: info.alarmAt },
          extra: { commitmentId: info.commitmentId, dateStr: info.dateStr },
        }],
      });
    } catch {
      // fallback: will be picked up by periodic check
    }
  }
  // Desktop: periodic check handles it — no extra setup needed
}

/** Cancel a scheduled alarm */
export async function cancelAlarm(commitmentId: string) {
  if (isNative) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: hashId(commitmentId) }] });
    } catch {
      // ignore
    }
  }
}

/** Start periodic check (every 30s) for due alarms */
export function startAlarmChecker(commitments: AlarmInfo[]) {
  stopAlarmChecker();

  const tick = () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    const now = Date.now();
    for (const c of commitments) {
      const diff = c.alarmAt.getTime() - now;
      if (diff > 30000 || diff < -60000) {
        firedIds.delete(c.commitmentId);
      }
      if (diff <= 30000 && diff >= -1000 && !firedIds.has(c.commitmentId)) {
        firedIds.add(c.commitmentId);
        fireAlarm(c);
      }
    }
  };

  scheduledInterval = setInterval(tick, 30000);
}

/** Stop periodic check and reset internal state */
export function stopAlarmChecker() {
  if (scheduledInterval) {
    clearInterval(scheduledInterval);
    scheduledInterval = null;
  }
  firedIds.clear();
}

function fireAlarm(info: AlarmInfo) {
  if (!isNative && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      const n = new Notification('Agenda', {
        body: info.title,
        tag: `agenda-${info.commitmentId}`,
      });
      n.onclick = () => {
        window.focus();
        if (onAlarmDue) onAlarmDue(info);
      };
    } catch {
      // fallback
    }
  }
  if (onAlarmDue) onAlarmDue(info);
}

/** Request notification permission (desktop web) */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative) return true;
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h) + id.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
