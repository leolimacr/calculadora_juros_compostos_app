import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase'; // ⭐ CORREÇÃO: importar firestore, não db
import { doc, onSnapshot } from 'firebase/firestore';

console.log("✅ useSubscriptionAccess.ts carregado - Versão corrigida");

export const useSubscriptionAccess = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<'free' | 'pro' | 'premium'>('free');
  const [loadingSubscription, setLoading] = useState(true);

  console.log("🔍 useSubscriptionAccess chamado com user:", user?.email);

  useEffect(() => {
    console.log("🔄 useSubscriptionAccess useEffect acionado");
    
    if (!user) {
      console.log("👤 Nenhum usuário - definindo role: free");
      setRole('free');
      setLoading(false);
      return;
    }

    console.log("📄 Acessando Firestore para usuário:", user.uid);
    console.log("📄 Instância firestore disponível:", !!firestore);

    // CRÍTICO: Verificar se firestore existe
    if (!firestore) {
      console.error("❌ ERRO: firestore é undefined! Usando valores padrão.");
      setRole('free');
      setLoading(false);
      return;
    }

    try {
      // ⭐ CORREÇÃO: Usar firestore, não db
      const userDocRef = doc(firestore, 'users', user.uid);
      console.log("📄 Referência do documento criada:", userDocRef.path);

      const unsub = onSnapshot(
        userDocRef,
        (docSnapshot) => {
          console.log("📄 Snapshot recebido");
          
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            console.log("📄 Dados do documento:", data);
            
            // BLINDAGEM AQUI TAMBÉM
            const sub = data?.subscription;
            const status = sub?.status || 'inactive';
            const planId = sub?.planId || '';

            console.log("📄 Subscription data:", { status, planId });

            if (status === 'active' || status === 'trialing') {
              if (planId.includes('premium')) {
                console.log("👑 Definindo role: premium");
                setRole('premium');
              } else if (planId.includes('pro')) {
                console.log("👑 Definindo role: pro");
                setRole('pro');
              } else {
                console.log("👑 Definindo role: free (plano ativo mas não pro/premium)");
                setRole('free');
              }
            } else {
              console.log("👑 Definindo role: free (status inativo)");
              setRole('free');
            }
          } else {
            console.log("📄 Documento não existe - definindo role: free");
            setRole('free');
          }
          setLoading(false);
        },
        (err) => {
          console.error('❌ Erro assinatura:', err);
          // Em caso de erro, assume Free para não travar o app
          setRole('free');
          setLoading(false);
        }
      );

      return () => {
        console.log("🧹 Limpando listener do Firestore");
        unsub();
      };
    } catch (error: any) {
      console.error("❌ Erro ao configurar Firestore:", error);
      setRole('free');
      setLoading(false);
    }
  }, [user]);

  const isPro = role === 'pro' || role === 'premium';
  const isPremium = role === 'premium';
  
  console.log("✅ useSubscriptionAccess retornando:", { isPro, isPremium, role, loadingSubscription });

  return {
    isPro,
    isPremium,
    loadingSubscription,
    role
  };
};