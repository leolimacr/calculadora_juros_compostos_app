
import { Timestamp } from 'firebase/firestore';

export type AchievementId = 'first_step' | 'organizer' | 'saver' | 'investor' | 'fire_starter' | 'streak_master';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  condition: (stats: UserStats) => boolean;
  xpReward: number;
}

export interface UserStats {
  transactionsCount: number;
  goalsCompleted: number;
  toolsUsed: string[];
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string | null; // YYYY-MM-DD
  totalPoints: number;
  level: number;
  unlockedAchievements: AchievementId[];
}

export const LEVELS = [
  { level: 1, minPoints: 0, title: "Iniciante" },
  { level: 2, minPoints: 500, title: "Organizado" },
  { level: 3, minPoints: 1500, title: "Poupador" },
  { level: 4, minPoints: 3000, title: "Investidor" },
  { level: 5, minPoints: 6000, title: "Mestre das Finanças" },
  { level: 6, minPoints: 10000, title: "Lenda FIRE" },
];

export const BADGES: Achievement[] = [
  {
    id: 'first_step',
    title: 'Primeiro Passo',
    description: 'Adicionou a primeira transação.',
    icon: '🦶',
    condition: (s) => s.transactionsCount >= 1,
    xpReward: 100
  },
  {
    id: 'organizer',
    title: 'Organizador',
    description: 'Registrou 50 transações.',
    icon: '🗂️',
    condition: (s) => s.transactionsCount >= 50,
    xpReward: 500
  },
  {
    id: 'investor',
    title: 'Explorador',
    description: 'Usou 5 ferramentas diferentes.',
    icon: '🧭',
    condition: (s) => s.toolsUsed.length >= 5,
    xpReward: 300
  },
  {
    id: 'streak_master',
    title: 'Disciplinado',
    description: '7 dias consecutivos de uso.',
    icon: '🔥',
    condition: (s) => s.currentStreak >= 7,
    xpReward: 1000
  }
];
