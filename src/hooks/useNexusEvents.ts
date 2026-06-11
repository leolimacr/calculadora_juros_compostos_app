import { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, orderBy, limit, onSnapshot } from 'firebase/firestore';
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
  const [events, setEvents] = useState<NexusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const eventsRef = collection(firestore, 'users', user.uid, 'presenceEvents');
    const q = query(eventsRef, orderBy('createdAt', 'desc'), limit(20));

    // [NEXUS REALTIME] Listener em tempo real para o sino e o hub estarem sempre sincronizados
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const loadedEvents: NexusEvent[] = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as NexusEvent))
        .filter(e => {
            if (e.read === true) return false;
            
            // Verifica expiração
            if (e.expiresAt && typeof e.expiresAt.toMillis === 'function') {
                return e.expiresAt.toMillis() > now;
            }
            return true;
        });

      const urgencyMap = { high: 3, medium: 2, low: 1 };
      const sorted = loadedEvents.sort((a, b) => {
        const uA = urgencyMap[a.urgency || 'low'] || 0;
        const uB = urgencyMap[b.urgency || 'low'] || 0;
        if (uA !== uB) return uB - uA;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });

      setEvents(sorted);
      setLoading(false);
    }, (error) => {
      console.error('Erro no listener de eventos Nexus:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]); // Dependência apenas do UID para estabilidade

  const dismiss = async (eventId: string) => {
    if (!user) return;
    try {
      const eventRef = doc(firestore, 'users', user.uid, 'presenceEvents', eventId);
      await updateDoc(eventRef, { read: true });
      // O onSnapshot cuidará de atualizar o estado local automaticamente
    } catch (e) {
      console.error('Erro ao descartar evento:', e);
    }
  };

  const markAllAsRead = async () => {
    if (!user || events.length === 0) return;
    try {
        const promises = events.map(e => 
            updateDoc(doc(firestore, 'users', user.uid, 'presenceEvents', e.id), { read: true })
        );
        await Promise.all(promises);
    } catch (e) {
        console.error('Erro ao marcar todas como lidas:', e);
    }
  };

  return { 
    events, 
    event: events[0] || null,
    dismiss, 
    markAllAsRead,
    loading 
  };
};
