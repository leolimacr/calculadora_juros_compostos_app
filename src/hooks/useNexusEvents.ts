import { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export interface NexusEvent {
  id: string;
  message: { title: string; body: string; ctaLabel?: string };
  deepLink?: string;
  urgency?: 'high' | 'medium' | 'low';
  createdAt?: any;
  read?: boolean;
  expiresAt?: any;
}

export const useNexusEvents = () => {
  const { user } = useAuth();
  const [event, setEvent] = useState<NexusEvent | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      try {
        const eventsRef = collection(firestore, 'users', user.uid, 'presenceEvents');
        // [FINOPS] Troca de onSnapshot por getDocs para carregamento único
        const q = query(eventsRef, orderBy('createdAt', 'desc'), limit(20));
        const snapshot = await getDocs(q);
        
        const now = Date.now();
        const events: NexusEvent[] = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as NexusEvent))
          .filter(e => {
              const isRead = e.read === true;
              if (isRead) return false;
              
              if (e.expiresAt && typeof e.expiresAt.toMillis === 'function') {
                  return e.expiresAt.toMillis() > now;
              }
              return true;
          });

        const urgencyMap = { high: 3, medium: 2, low: 1 };
        const sorted = events.sort((a, b) => {
          const uA = urgencyMap[a.urgency || 'low'] || 0;
          const uB = urgencyMap[b.urgency || 'low'] || 0;
          if (uA !== uB) return uB - uA;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });

        setEvent(sorted[0] || null);
      } catch (error) {
        console.error('Erro ao buscar eventos Nexus:', error);
        setEvent(null);
      }
    };

    fetchEvents();
  }, [user]);

  const dismiss = async (eventId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(firestore, 'users', user.uid, 'presenceEvents', eventId), { read: true });
      setEvent(null); // Atualiza estado local após descartar
    } catch (e) {
      console.error('Erro ao descartar evento:', e);
    }
  };

  return { event, dismiss };
};
