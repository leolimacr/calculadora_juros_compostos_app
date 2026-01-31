import { useState, useEffect } from 'react';
import { 
  ref, 
  push, 
  onValue, 
  remove, 
  update 
} from 'firebase/database';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc,
  deleteDoc // Novo import
} from 'firebase/firestore';
import { db, firestore } from '../firebase';
import { Transaction, Category, UserMeta } from '../types';

// Categorias Padrão (Seed)
const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'userId'>[] = [
  { name: 'Moradia', type: 'expense', color: '#EF4444', icon: 'home' },
  { name: 'Alimentação', type: 'expense', color: '#F59E0B', icon: 'shopping-cart' },
  { name: 'Transporte', type: 'expense', color: '#3B82F6', icon: 'truck' },
  { name: 'Lazer', type: 'expense', color: '#10B981', icon: 'smile' },
  { name: 'Saúde', type: 'expense', color: '#EC4899', icon: 'heart' },
  { name: 'Educação', type: 'expense', color: '#8B5CF6', icon: 'book' },
  { name: 'Salário', type: 'income', color: '#10B981', icon: 'dollar-sign' },
  { name: 'Investimentos', type: 'income', color: '#3B82F6', icon: 'trending-up' },
  { name: 'Extras', type: 'income', color: '#F59E0B', icon: 'plus' }
];

export const useFirebase = (userId?: string) => {
  const [lancamentos, setLancamentos] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega Dados
  useEffect(() => {
    if (!userId) {
      setLancamentos([]);
      setCategories([]);
      setUserMeta(null);
      setLoading(false);
      return;
    }

    // 1. Transações (Realtime DB)
    const transactionsRef = ref(db, `transactions/${userId}`);
    const unsubscribeTransactions = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedTransactions: Transaction[] = [];
      if (data) {
        Object.entries(data).forEach(([id, value]: [string, any]) => {
          loadedTransactions.push({ id, ...value });
        });
        // Ordena por data (mais recente primeiro)
        loadedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      setLancamentos(loadedTransactions);
    });

    // 2. Metadados e Plano (Firestore)
    const userDocRef = doc(firestore, 'users', userId);
    const unsubscribeMeta = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserMeta(docSnap.data() as UserMeta);
      }
    });

    // 3. Categorias (Firestore)
    const categoriesRef = doc(firestore, 'categories', userId);
    const unsubscribeCategories = onSnapshot(categoriesRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.list) {
          setCategories(data.list);
        }
      } else {
        // Auto-seed: Cria categorias padrão se não existirem
        const initialCategories = DEFAULT_CATEGORIES.map(cat => ({ ...cat, userId, id: crypto.randomUUID() }));
        await setDoc(categoriesRef, { list: initialCategories });
        setCategories(initialCategories as Category[]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeMeta();
      unsubscribeCategories();
    };
  }, [userId]);

  // --- AÇÕES ---

  const saveLancamento = async (transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!userId) return;
    const transactionsRef = ref(db, `transactions/${userId}`);
    await push(transactionsRef, { ...transaction, userId });
  };

  const deleteLancamento = async (id: string) => {
    if (!userId) return;
    const transactionRef = ref(db, `transactions/${userId}/${id}`);
    await remove(transactionRef);
  };

  const saveCategory = async (category: Omit<Category, 'userId'>) => {
    if (!userId) return;
    const categoriesRef = doc(firestore, 'categories', userId);
    const newCategory = { ...category, userId };
    
    // Se tem ID, é edição. Se não, cria novo.
    let newList;
    if (category.id) {
      newList = categories.map(c => c.id === category.id ? newCategory : c);
    } else {
      newCategory.id = crypto.randomUUID();
      newList = [...categories, newCategory];
    }
    
    await setDoc(categoriesRef, { list: newList }, { merge: true });
  };

  const deleteCategory = async (categoryId: string) => {
    if (!userId) return;
    const categoriesRef = doc(firestore, 'categories', userId);
    const newList = categories.filter(c => c.id !== categoryId);
    await setDoc(categoriesRef, { list: newList }, { merge: true });
  };

  // ✅ NOVA FUNÇÃO: APAGAR TUDO (LIXEIRO)
  const wipeUserData = async () => {
    if (!userId) return;
    try {
      // 1. Apaga Transações (Realtime)
      await remove(ref(db, `transactions/${userId}`));
      // 2. Apaga Metadados (Firestore)
      await deleteDoc(doc(firestore, 'users', userId));
      // 3. Apaga Categorias (Firestore)
      await deleteDoc(doc(firestore, 'categories', userId));
      // 4. Apaga Histórico do Chat (Firestore - Coleção chatHistory)
      // Nota: Isso exigiria listar e deletar subcoleções, mas por hora apagamos o principal
      console.log('Dados do usuário apagados com sucesso.');
    } catch (error) {
      console.error('Erro ao apagar dados:', error);
      throw error;
    }
  };

  // Lógica de Limite (Free Plan)
  const isLimitReached = !userMeta?.subscription?.active && lancamentos.length >= 25;
  const usagePercentage = userMeta?.subscription?.active ? 0 : Math.min((lancamentos.length / 25) * 100, 100);

  return {
    lancamentos,
    categories,
    userMeta,
    loading,
    saveLancamento,
    deleteLancamento,
    saveCategory,
    deleteCategory,
    wipeUserData, // Exportando a função nova
    isLimitReached,
    usagePercentage
  };
};