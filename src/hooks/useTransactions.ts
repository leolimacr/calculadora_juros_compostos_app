import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ref, push, remove, update, set, query as rtdbQuery, orderByChild, limitToLast, get, endBefore, startAt, endAt } from 'firebase/database';
import { db } from '../firebase';
import { queryKeys } from '../core/query/queryKeys';
import type { Transaction } from '../types';
import { useTransactionsContext } from '../contexts/TransactionsContext';
import { useMemo, useCallback } from 'react';
import { useDebts } from './useDebts';
import { useCards } from './useCards';
import { updateDebt } from '../services/debt/debtService';
import { updateCard } from '../services/cardService';
import { useSubscriptionAccess } from './useSubscriptionAccess';
import { isMonthFetchAllowed } from '../utils/historyTimeGate';

export const useTransactions = (userId?: string) => {
  const queryClient = useQueryClient();
  const { currentPlan } = useSubscriptionAccess();
  const { bridgeReady } = useTransactionsContext();
  const key = queryKeys.transactions.byUser(userId || 'anonymous');
  const extraKey = ['transactions_extra', userId || 'anonymous'];
  const registryKey = ['transactions_fetched_months', userId || 'anonymous'];

  const cachedRaw = typeof window !== 'undefined' 
    ? localStorage.getItem(`fpi_tx_${userId}`) 
    : null;
  const cachedData = cachedRaw 
    ? (() => { try { const p = JSON.parse(cachedRaw); return Date.now() - p.ts < 600_000 ? p.data : undefined; } catch { return undefined; } })()
    : undefined;

  // 1. Lançamentos em Realtime (limitados aos últimos 100)
  const { data: realtimeData, isLoading: loading, error, isFetching } = useQuery<Transaction[], Error>({
    queryKey: key,
    queryFn: () => {
      const currentData = queryClient.getQueryData<Transaction[]>(key);
      return Promise.resolve(currentData ?? cachedData ?? []);
    },
    placeholderData: cachedData,
    enabled: !!userId,
    staleTime: Infinity,
  });

  // 2. Lançamentos Históricos (carregados sob demanda)
  const { data: extraData } = useQuery<Transaction[]>({
    queryKey: extraKey,
    queryFn: () => queryClient.getQueryData<Transaction[]>(extraKey) ?? [],
    initialData: [],
    staleTime: Infinity,
  });

  // 3. Mesclagem Inteligente (Realtime + Histórico + Deduplicação)
  const transactions = useMemo(() => {
    const base = realtimeData || [];
    const extra = extraData || [];
    const merged = [...base, ...extra];
    
    // Deduplica por ID para evitar problemas se um item do realtime já existir no extra
    const uniqueMap = new Map();
    merged.forEach(t => {
      if (t?.id) uniqueMap.set(t.id, t);
    });
    
    return Array.from(uniqueMap.values()).sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    });
  }, [realtimeData, extraData]);

  // NOVO: Busca mês específico sob demanda (Cirúrgico para custo baixo)
  const fetchMonth = useCallback(async (year: number, month: number) => {
    if (!userId) return;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    
    const fetchedSet = queryClient.getQueryData<Set<string>>(registryKey) || new Set<string>();
    if (fetchedSet.has(monthKey)) return;

    if (!isMonthFetchAllowed(year, month, currentPlan)) {
      const blockedSet = new Set(fetchedSet);
      blockedSet.add(monthKey);
      queryClient.setQueryData(registryKey, blockedSet);
      return;
    }

    try {
      const transactionsRef = ref(db, `transactions/${userId}`);
      
      const q = rtdbQuery(
        transactionsRef, 
        orderByChild('date'), 
        startAt(`${monthKey}-01`), 
        endAt(`${monthKey}-31`)
      );
      
      const snapshot = await get(q);
      if (snapshot.exists()) {
        const newTx: Transaction[] = [];
        snapshot.forEach((child) => {
          const val = child.val();
          if (val?.date?.startsWith(monthKey)) {
            newTx.push({ id: child.key, ...val } as Transaction);
          }
        });

        // Atualiza o cache de extras
        const currentExtra = queryClient.getQueryData<Transaction[]>(extraKey) || [];
        const updatedExtra = [...currentExtra, ...newTx];
        
        // Mantém apenas IDs únicos no extra
        const uniqueExtra = Array.from(new Map(updatedExtra.map(t => [t.id, t])).values());
        queryClient.setQueryData(extraKey, uniqueExtra);
      }

      // Registra que o mês foi carregado com sucesso (criando novo Set para garantir imutabilidade)
      const updatedSet = new Set(fetchedSet);
      updatedSet.add(monthKey);
      queryClient.setQueryData(registryKey, updatedSet);
    } catch (err) {
      console.error(`[FinOps] Erro ao carregar mês ${monthKey}:`, err);
    }
  }, [userId, queryClient, extraKey, registryKey, currentPlan]);

  // NOVO: Busca histórico antigo (paginação robusta via sortKey)
  const fetchHistory = async (lastSortKey: string | null, limitCount = 50): Promise<Transaction[]> => {
    if (!userId) return [];
    try {
      const transactionsRef = ref(db, `transactions/${userId}`);
      
      let q;
      if (lastSortKey) {
        // endBefore evita baixar o último item novamente
        q = rtdbQuery(
          transactionsRef, 
          orderByChild('sortKey'), 
          endBefore(lastSortKey), 
          limitToLast(limitCount)
        );
      } else {
        q = rtdbQuery(transactionsRef, orderByChild('sortKey'), limitToLast(limitCount));
      }
      
      const snapshot = await get(q);
      if (!snapshot.exists()) return [];
      
      const results: Transaction[] = [];
      snapshot.forEach((child) => {
        const val = child.val();
        const id = child.key as string;
        const dateClean = val.date.replace(/-/g, '');
        
        // Fallback robusto: YYYYMMDD_0000000000000_ID
        const sortKey = val.sortKey || `${dateClean}_0000000000000_${id}`;
        
        results.push({ 
          id, 
          ...val, 
          sortKey 
        } as Transaction);
      });
      
      // RTDB retorna ASC, invertemos para DESC no UI
      return results.sort((a, b) => b.sortKey!.localeCompare(a.sortKey!));
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
      return [];
    }
  };

  const { debts } = useDebts(userId);
  const { cards } = useCards(userId);

  const saveLancamento = async (transaction: Omit<Transaction, 'id' | 'userId'> & { id?: string }) => {
    if (!userId) return;
    
    const now = Date.now();
    const dateClean = transaction.date.replace(/-/g, '');

    if (transaction.id) {
        // [Reactive Core] Reação Reversa: Edição
        const oldTx = transactions.find(t => t.id === transaction.id);
        if (oldTx && userId) {
            const oldDebtId = oldTx.linkedDebtId;
            const newDebtId = transaction.linkedDebtId;

            // Se houve mudança no vínculo ou no valor
            if (oldDebtId !== newDebtId || oldTx.amount !== Number(transaction.amount)) {
                // 1. Estorno do vínculo antigo (se existia)
                if (oldDebtId) {
                    const oldDebt = debts.find(d => d.id === oldDebtId);
                    if (oldDebt) {
                        let finalSaldo = oldDebt.saldoDevedor + oldTx.amount;
                        let finalParcelas = oldDebt.parcelasRestantes + 1;

                        // Se a dívida nova for a mesma, já aplicamos o novo abatimento aqui
                        if (oldDebtId === newDebtId) {
                            finalSaldo -= Number(transaction.amount);
                            finalParcelas -= 1;
                        }

                        try {
                            await updateDebt(userId, oldDebtId, {
                                saldoDevedor: Math.max(0, finalSaldo),
                                parcelasRestantes: Math.max(0, finalParcelas)
                            });
                            console.log(`[Reactive Core] Ajuste de dívida ${oldDebt.nome} por edição.`);
                        } catch (error) {
                            console.error("[Reactive Core] Erro no ajuste (edição - old):", error);
                        }
                    }
                }

                // 2. Aplicação do novo vínculo (se for uma dívida diferente e nova)
                if (newDebtId && newDebtId !== oldDebtId) {
                    const newDebt = debts.find(d => d.id === newDebtId);
                    if (newDebt) {
                        try {
                            await updateDebt(userId, newDebtId, {
                                saldoDevedor: Math.max(0, newDebt.saldoDevedor - Number(transaction.amount)),
                                parcelasRestantes: Math.max(0, newDebt.parcelasRestantes - 1)
                            });
                            console.log(`[Reactive Core] Novo vínculo com dívida ${newDebt.nome} por edição.`);
                        } catch (error) {
                            console.error("[Reactive Core] Erro no ajuste (edição - new):", error);
                        }
                    }
                }
            }
        }

        // [Reactive Core] Reação Reversa: Edição de Cartão
        if (oldTx && userId) {
            const oldCardId = oldTx.paymentMethod === 'credit' ? oldTx.cardId : oldTx.linkedCardId;
            const newCardId = transaction.paymentMethod === 'credit' ? transaction.cardId : transaction.linkedCardId;
            const wasBill = oldTx.isBillPayment;
            const isBill = transaction.isBillPayment;

            // 1. Mudança de valor ou de cartão (Crédito ou Pagamento)
            if (oldCardId !== newCardId || oldTx.amount !== Number(transaction.amount) || wasBill !== isBill) {
                // Estorna o efeito do lançamento antigo
                if (oldCardId) {
                    const card = cards.find(c => c.id === oldCardId);
                    if (card) {
                        try {
                            // Se era pagamento, estornar = voltar a consumir. Se era compra, estornar = liberar.
                            const factor = wasBill ? 1 : -1;
                            let newUsed = (card.saldoUtilizadoTotal || 0) + (oldTx.amount * factor);
                            
                            // Se o cartão novo for o mesmo, já aplicamos o novo efeito aqui para evitar duas escritas
                            if (oldCardId === newCardId) {
                                const newFactor = isBill ? -1 : 1;
                                newUsed += (Number(transaction.amount) * newFactor);
                            }

                            await updateCard(userId, oldCardId, { saldoUtilizadoTotal: Math.max(0, newUsed) });
                            console.log(`[Reactive Core] Ajuste de limite do cartão ${card.name} por edição.`);
                        } catch (error) {
                            console.error("[Reactive Core] Erro no ajuste de limite (edição - old):", error);
                        }
                    }
                }

                // Aplica o efeito no novo cartão (se for diferente)
                if (newCardId && newCardId !== oldCardId) {
                    const card = cards.find(c => c.id === newCardId);
                    if (card) {
                        try {
                            const factor = isBill ? -1 : 1;
                            const newUsed = (card.saldoUtilizadoTotal || 0) + (Number(transaction.amount) * factor);
                            await updateCard(userId, newCardId, { saldoUtilizadoTotal: Math.max(0, newUsed) });
                            console.log(`[Reactive Core] Novo vínculo de limite com cartão ${card.name} por edição.`);
                        } catch (error) {
                            console.error("[Reactive Core] Erro no ajuste de limite (edição - new):", error);
                        }
                    }
                }
            }
        }

        const transactionRef = ref(db, `transactions/${userId}/${transaction.id}`);
        const { id, ...dataToUpdate } = transaction;
        await update(transactionRef, dataToUpdate);
        queryClient.invalidateQueries({ queryKey: key });
        return;
    }

    // [Reactive Core] Reações em Cartões (Consumo de Limite / Pagamento de Fatura)
    if (userId) {
      if (transaction.isBillPayment && transaction.linkedCardId) {
        // Liberação de Limite por Pagamento de Fatura
        const card = cards.find(c => c.id === transaction.linkedCardId);
        if (card) {
          try {
            const newUsed = Math.max(0, (card.saldoUtilizadoTotal || 0) - Number(transaction.amount));
            await updateCard(userId, card.id, { saldoUtilizadoTotal: newUsed });
            console.log(`[Reactive Core] Limite do cartão ${card.name} liberado por pagamento de fatura.`);
          } catch (error) {
            console.error("[Reactive Core] Erro ao liberar limite do cartão:", error);
          }
        }
      } else if (transaction.paymentMethod === 'credit' && transaction.cardId) {
        // Consumo de Limite por Compra (Total)
        const card = cards.find(c => c.id === transaction.cardId);
        if (card) {
          try {
            const newUsed = (card.saldoUtilizadoTotal || 0) + Number(transaction.amount);
            await updateCard(userId, card.id, { saldoUtilizadoTotal: newUsed });
            console.log(`[Reactive Core] Limite do cartão ${card.name} consumido por nova compra.`);
          } catch (error) {
            console.error("[Reactive Core] Erro ao consumir limite do cartão:", error);
          }
        }
      }
    }

    // [Reactive Core] Amortização Assistida
    const linkedDebtId = transaction.linkedDebtId;
    if (linkedDebtId && userId) {
      const debt = debts.find(d => d.id === linkedDebtId);
      if (debt) {
        const amount = Number(transaction.amount);
        const newSaldo = Math.max(0, debt.saldoDevedor - amount);
        const newParcelas = Math.max(0, debt.parcelasRestantes - 1);
        
        try {
          await updateDebt(userId, linkedDebtId, {
            saldoDevedor: newSaldo,
            parcelasRestantes: newParcelas
          });
          console.log(`[Reactive Core] Dívida ${debt.nome} amortizada.`);
        } catch (error) {
          console.error("[Reactive Core] Erro na amortização:", error);
        }
      }
    }

    const transactionsRef = ref(db, `transactions/${userId}`);

    if (transaction.paymentMethod === 'credit' && transaction.installments && transaction.installments > 1) {
      const installmentId = `inst_${now}_${Math.random().toString(36).substr(2, 5)}`;
      const totalAmount = transaction.amount;
      const installmentAmount = totalAmount / transaction.installments;
      const baseDate = new Date(transaction.date.replace(/-/g, '/'));

      const promises = [];
      for (let i = 1; i <= transaction.installments; i++) {
        const installmentDate = new Date(baseDate);
        installmentDate.setMonth(baseDate.getMonth() + (i - 1));
        
        if (installmentDate.getDate() !== baseDate.getDate() && i > 1) {
            const lastDayOfIntendedMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 0);
            installmentDate.setDate(lastDayOfIntendedMonth.getDate());
            installmentDate.setMonth(lastDayOfIntendedMonth.getMonth());
            installmentDate.setFullYear(lastDayOfIntendedMonth.getFullYear());
        }

        const newRef = push(transactionsRef);
        const instDateStr = installmentDate.toISOString().split('T')[0];
        const instDateClean = instDateStr.replace(/-/g, '');
        
        const data = {
          ...transaction,
          userId,
          amount: installmentAmount,
          currentInstallment: i,
          installmentId,
          date: instDateStr,
          description: `${transaction.description} (${i}/${transaction.installments})`,
          createdAtMs: now + i,
          sortKey: `${instDateClean}_${now + i}_${newRef.key}`
        };
        promises.push(set(newRef, data));
      }
      await Promise.all(promises);
    } else {
      const newRef = push(transactionsRef);
      const data = { 
        ...transaction, 
        userId,
        createdAtMs: now,
        sortKey: `${dateClean}_${now}_${newRef.key}`
      };
      await set(newRef, data);
    }
    queryClient.invalidateQueries({ queryKey: key });
  };

  const deleteLancamento = async (id: string) => {
    if (!userId) return;

    // [Reactive Core] Reação Reversa: Exclusão
    const txToDelete = transactions.find(t => t.id === id);
    if (txToDelete && userId) {
      // 1. Estorno de Dívida
      if (txToDelete.linkedDebtId) {
        const debt = debts.find(d => d.id === txToDelete.linkedDebtId);
        if (debt) {
          try {
            await updateDebt(userId, txToDelete.linkedDebtId, {
              saldoDevedor: debt.saldoDevedor + txToDelete.amount,
              parcelasRestantes: debt.parcelasRestantes + 1
            });
            console.log(`[Reactive Core] Estorno de dívida ${debt.nome} por exclusão.`);
          } catch (error) {
            console.error("[Reactive Core] Erro no estorno (dívida):", error);
          }
        }
      }

      // 2. Estorno de Cartão (Consumo de Limite ou Pagamento de Fatura)
      if (txToDelete.isBillPayment && txToDelete.linkedCardId) {
        // Estorno de Pagamento de Fatura: Volta a consumir o limite
        const card = cards.find(c => c.id === txToDelete.linkedCardId);
        if (card) {
          try {
            const newUsed = (card.saldoUtilizadoTotal || 0) + txToDelete.amount;
            await updateCard(userId, card.id, { saldoUtilizadoTotal: newUsed });
            console.log(`[Reactive Core] Estorno de pagamento de fatura: Limite do cartão ${card.name} re-consumido.`);
          } catch (error) {
            console.error("[Reactive Core] Erro no estorno (pagamento fatura):", error);
          }
        }
      } else if (txToDelete.paymentMethod === 'credit' && txToDelete.cardId) {
        // Estorno de Compra: Libera o limite
        const card = cards.find(c => c.id === txToDelete.cardId);
        if (card) {
          try {
            // Restore only the individual transaction amount. 
            // If it's a series of installments, each deletion will release its part.
            const amountToRestore = txToDelete.amount;
              
            const newUsed = Math.max(0, (card.saldoUtilizadoTotal || 0) - amountToRestore);
            await updateCard(userId, card.id, { saldoUtilizadoTotal: newUsed });
            console.log(`[Reactive Core] Estorno de compra: Limite do cartão ${card.name} liberado.`);
          } catch (error) {
            console.error("[Reactive Core] Erro no estorno (compra crédito):", error);
          }
        }
      }
    }

    const transactionRef = ref(db, `transactions/${userId}/${id}`);
    await remove(transactionRef);
  };

  const isSyncing = isFetching && !loading;

  return {
    transactions,
    loading: loading && !cachedData && !bridgeReady,
    isSyncing,
    isFetching,
    error: error?.message || null,
    saveLancamento,
    deleteLancamento,
    fetchHistory,
    fetchMonth,
  };
};
