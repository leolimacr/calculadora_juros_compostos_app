
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { UserStats, BADGES, LEVELS, AchievementId } from '../types/gamification';

const DEFAULT_STATS: UserStats = {
  transactionsCount: 0,
  goalsCompleted: 0,
  toolsUsed: [],
  currentStreak: 0,
  longestStreak: 0,
  lastLoginDate: null,
  totalPoints: 0,
  level: 1,
  unlockedAchievements: []
};

export function useGamification() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);

  // 1. Load Stats from Firestore on mount
  useEffect(() => {
    if (!user) {
      setStats(DEFAULT_STATS);
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        const userRef = db.collection('users').doc(user.uid);
        const snap = await userRef.get();
        
        if (snap.exists) {
          const data = snap.data();
          const remoteStats = data?.gamification || DEFAULT_STATS;
          
          // Check Streak Logic
          const today = new Date().toISOString().split('T')[0];
          const lastDate = remoteStats.lastLoginDate;
          
          let newStreak = remoteStats.currentStreak;
          
          if (lastDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastDate === yesterdayStr) {
              newStreak += 1;
            } else {
              newStreak = 1; // Quebrou o streak ou primeiro login
            }
            
            // Update immediately if streak changed
            const updatedStats = {
                ...remoteStats,
                currentStreak: newStreak,
                longestStreak: Math.max(newStreak, remoteStats.longestStreak),
                lastLoginDate: today
            };
            setStats(updatedStats);
            await userRef.update({ gamification: updatedStats });
          } else {
            setStats(remoteStats);
          }
        } else {
            // First time init
            const today = new Date().toISOString().split('T')[0];
            const initialStats = { ...DEFAULT_STATS, lastLoginDate: today, currentStreak: 1, longestStreak: 1 };
            setStats(initialStats);
            await userRef.set({ gamification: initialStats }, { merge: true });
        }
      } catch (e) {
        console.error("Gamification Load Error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  // 2. Action Handler
  const trackAction = async (action: 'add_transaction' | 'complete_goal' | 'use_tool', payload?: any) => {
    if (!user) return;

    let newStats = { ...stats };
    let pointsEarned = 0;

    switch (action) {
      case 'add_transaction':
        newStats.transactionsCount += 1;
        pointsEarned = 10;
        break;
      case 'complete_goal':
        newStats.goalsCompleted += 1;
        pointsEarned = 50;
        break;
      case 'use_tool':
        if (payload && !newStats.toolsUsed.includes(payload)) {
          newStats.toolsUsed.push(payload);
          pointsEarned = 20;
        }
        break;
    }

    newStats.totalPoints += pointsEarned;

    // Check Level Up
    const nextLevel = LEVELS.slice().reverse().find(l => newStats.totalPoints >= l.minPoints);
    if (nextLevel && nextLevel.level > newStats.level) {
      newStats.level = nextLevel.level;
      // TODO: Trigger Level Up Modal
    }

    // Check Badges
    const newlyUnlocked: string[] = [];
    BADGES.forEach(badge => {
      if (!newStats.unlockedAchievements.includes(badge.id) && badge.condition(newStats)) {
        newStats.unlockedAchievements.push(badge.id);
        newStats.totalPoints += badge.xpReward;
        newlyUnlocked.push(badge.title);
      }
    });

    if (newlyUnlocked.length > 0) {
      setNewUnlocks(newlyUnlocked);
      setTimeout(() => setNewUnlocks([]), 5000);
    }

    setStats(newStats);

    // Persist debounce
    try {
      const userRef = db.collection('users').doc(user.uid);
      await userRef.update({ gamification: newStats });
    } catch (e) {
      console.error("Failed to sync stats", e);
    }
  };

  const getNextLevel = () => {
    return LEVELS.find(l => l.level === stats.level + 1) || LEVELS[LEVELS.length - 1];
  };

  const getProgressToNextLevel = () => {
    const currentLvlConfig = LEVELS.find(l => l.level === stats.level) || LEVELS[0];
    const nextLvlConfig = getNextLevel();
    if (currentLvlConfig.level === nextLvlConfig.level) return 100;

    const range = nextLvlConfig.minPoints - currentLvlConfig.minPoints;
    const current = stats.totalPoints - currentLvlConfig.minPoints;
    return Math.min(100, Math.max(0, (current / range) * 100));
  };

  return {
    stats,
    loading,
    trackAction,
    progress: getProgressToNextLevel(),
    currentLevelTitle: LEVELS.find(l => l.level === stats.level)?.title || "Iniciante",
    newUnlocks
  };
}
