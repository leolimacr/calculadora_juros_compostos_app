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
  deleteDoc 
} from 'firebase/firestore';
import { db, firestore } from '../firebase';
import { Transaction, Category, UserMeta } from '../types';

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

  // ✅ FUNÇÃO DE MIGRAÇÃO: Adiciona categorias usadas nos lançamentos que não existem no Firestore
  const migrateCategoriesFromTransactions = async (
    transactions: Transaction[], 
    existingCategories: Category[], 
    userId: string
  ) => {
    if (transactions.length === 0) return;

    // Extrai categorias únicas dos lançamentos
    const usedCategories = new Map<string, 'income' | 'expense'>();
    
    transactions.forEach(t => {
      if (t.category && !usedCategories.has(t.category)) {
        usedCategories.set(t.category, t.type);
      }
    });

    // Identifica categorias faltantes
    const existingNames = existingCategories.map(c => c.name);
    const missingCategories: Category[] = [];

    usedCategories.forEach((type, name) => {
      if (!existingNames.includes(name)) {
        missingCategories.push({
          id: crypto.randomUUID(),
          name,
          type,
          color: type === 'expense' ? '#64748b' : '#10B981',
          icon: 'tag',
          userId
        });
      }
    });

    // Adiciona categorias faltantes ao Firestore
    if (missingCategories.length > 0) {
      const categoriesRef = doc(firestore, 'categories', userId);
      const updatedList = [...existingCategories, ...missingCategories];
      await setDoc(categoriesRef, { list: updatedList }, { merge: true });
      console.log(`✅ Migração: ${missingCategories.length} categoria(s) adicionada(s) automaticamente`);
    }
  };

  useEffect(() => {
    if (!userId) {
      setLancamentos([]);
      setCategories([]);
      setUserMeta(null);
      setLoading(false);
      return;
    }

    let loadedTransactions: Transaction[] = [];
    let loadedCategories: Category[] = [];
    let migrationExecuted = false;

    const transactionsRef = ref(db, `transactions/${userId}`);
    const unsubscribeTransactions = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      const transactions: Transaction[] = [];
      if (data) {
        Object.entries(data).forEach(([id, value]: [string, any]) => {
          transactions.push({ id, ...value });
        });
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      loadedTransactions = transactions;
      setLancamentos(transactions);

      // Executa migração após carregar transações e categorias
      if (loadedCategories.length > 0 && !migrationExecuted) {
        migrationExecuted = true;
        migrateCategoriesFromTransactions(loadedTransactions, loadedCategories, userId);
      }
    });

    const userDocRef = doc(firestore, 'users', userId);
    const unsubscribeMeta = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserMeta(docSnap.data() as UserMeta);
      }
    });

    const categoriesRef = doc(firestore, 'categories', userId);
    const unsubscribeCategories = onSnapshot(categoriesRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.list) {
          loadedCategories = data.list;
          setCategories(data.list);
        }
      } else {
        const initialCategories = DEFAULT_CATEGORIES.map(cat => ({ ...cat, userId, id: crypto.randomUUID() }));
        await setDoc(categoriesRef, { list: initialCategories });
        loadedCategories = initialCategories as Category[];
        setCategories(initialCategories as Category[]);
      }
      setLoading(false);

      // Executa migração após carregar transações e categorias
      if (loadedTransactions.length > 0 && !migrationExecuted) {
        migrationExecuted = true;
        migrateCategoriesFromTransactions(loadedTransactions, loadedCategories, userId);
      }
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeMeta();
      unsubscribeCategories();
    };
  }, [userId]);

  const saveLancamento = async (transaction: Omit<Transaction, 'id' | 'userId'> & { id?: string }) => {
    if (!userId) return;
    
    // Se tiver ID, é edição
    if (transaction.id) {
        const transactionRef = ref(db, `transactions/${userId}/${transaction.id}`);
        const { id, ...dataToUpdate } = transaction; // Remove ID do payload
        await update(transactionRef, dataToUpdate);
    } else {
        // Se não, é criação
        const transactionsRef = ref(db, `transactions/${userId}`);
        await push(transactionsRef, { ...transaction, userId });
    }
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
    let newList;
    if (category.id) {
      newList = categories.map(c => c.id === category.id ? newCategory : c);
    } else {
      newCategory.id = crypto.randomUUID();
      newList = [...categories, newCategory];
    }
    await setDoc(categoriesRef, { list: newList }, { merge: true });
  };

  // ✅ EXCLUSÃO COM PROTEÇÃO INTELIGENTE
  const deleteCategory = async (categoryId: string) => {
    if (!userId) return;
    
    // Encontra o nome da categoria que será excluída
    const categoryToDelete = categories.find(c => c.id === categoryId);
    if (!categoryToDelete) return;
    
    // ✅ PROTEÇÃO: Verifica se categoria está sendo usada
    const usageCount = lancamentos.filter(t => t.category === categoryToDelete.name).length;
    
    if (usageCount > 0) {
      alert(`⚠️ Não é possível excluir "${categoryToDelete.name}"\n\nEsta categoria está sendo usada em ${usageCount} lançamento(s).\n\nPara removê-la, primeiro altere ou exclua esses lançamentos.`);
      return;
    }
    
    // Se não está em uso, prossegue com a exclusão
    const categoriesRef = doc(firestore, 'categories', userId);
    const newList = categories.filter(c => c.id !== categoryId);
    await setDoc(categoriesRef, { list: newList }, { merge: true });
  };

  const wipeUserData = async () => {
    if (!userId) return;
    try {
      await remove(ref(db, `transactions/${userId}`));
      await deleteDoc(doc(firestore, 'users', userId));
      await deleteDoc(doc(firestore, 'categories', userId));
    } catch (error) {
      throw error;
    }
  };

  const isLimitReached = !userMeta?.subscription?.active && lancamentos.length >= 30;
  const usagePercentage = userMeta?.subscription?.active ? 0 : Math.min((lancamentos.length / 30) * 100, 100);

  return {
    lancamentos,
    categories,
    userMeta,
    loading,
    saveLancamento,
    deleteLancamento,
    saveCategory,
    deleteCategory,
    wipeUserData, 
    isLimitReached,
    usagePercentage
  };
};
