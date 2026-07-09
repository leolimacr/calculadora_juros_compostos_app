import React, { useState, useMemo } from 'react';
import { Pencil, Trash2, ChevronDown } from 'lucide-react';
import { useCards } from '../../../hooks/useCards';
import { useAuth } from '../../../contexts/AuthContext';

interface TransactionHistoryProps {
  transactions: any[];
  onDelete: (id: string) => void;
  onEdit: (t: any) => void;
  isPrivacyMode: boolean;
  isDisabled?: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, onDelete, onEdit, isPrivacyMode, isDisabled }) => {
  const { user } = useAuth();
  const { cards: userCards } = useCards(user?.uid);

  const cardMap = useMemo(() => {
    const map: Record<string, string> = {};
    userCards.forEach(c => {
      map[c.id] = c.name;
    });
    return map;
  }, [userCards]);

  const [showFutures, setShowFutures] = useState(false);

  const regularTransactions = useMemo(
    () => transactions.filter(t => !(t as any).isFutureLaunch && !t.isVirtual),
    [transactions]
  );

  const futureTransactions = useMemo(
    () => transactions.filter(t => (t as any).isFutureLaunch || t.isVirtual),
    [transactions]
  );

  return (
    <div className={`bg-surface-primary border border-surface-elevated rounded-4xl overflow-hidden shadow-soft ${isDisabled ? 'opacity-70 pointer-events-none' : ''}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-secondary text-xxs font-black text-text-muted uppercase tracking-ultra-wide">
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-elevated">
            {regularTransactions.length === 0 && futureTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-muted font-bold uppercase text-xxs">
                  Nenhum lançamento encontrado
                </td>
              </tr>
            ) : (
              <>
                {futureTransactions.length > 0 && (
                  <>
                    <tr className="border-t-2 border-amber-200">
                      <td colSpan={5} className="px-4 py-2 bg-amber-50/40">
                        <button
                          type="button"
                          onClick={() => setShowFutures(!showFutures)}
                          className="flex items-center gap-2 w-full text-left text-[10px] font-black uppercase tracking-widest text-amber-800"
                        >
                          <ChevronDown
                            size={14}
                            className={`transition-transform duration-200 ${showFutures ? 'rotate-180' : ''}`}
                          />
                          Faturas previstas ({futureTransactions.length})
                        </button>
                      </td>
                    </tr>

                    {showFutures && futureTransactions.map((t) => {
                      const categoryClass = 'inline-flex items-center px-2.5 py-1 bg-amber-100 border border-amber-200 rounded-full text-xxs font-black text-amber-800 uppercase tracking-wider';

                      return (
                        <tr key={t.id} className="bg-amber-50/80 hover:bg-amber-100/70 transition-colors group align-middle border-l-4 border-l-amber-400">
                          <td className="px-4 py-3 text-xxs text-text-secondary font-medium whitespace-nowrap">
                            {'Lançamento futuro'}
                            {(t as any).dueDate && (
                              <div className="text-[9px] font-bold text-amber-700 mt-1">
                                Vence em {new Date((t as any).dueDate.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-text-primary font-bold leading-tight">
                            <div className="flex flex-col gap-1">
                              {t.description.replace(/^Lançamento futuro\s*[-–]\s*/i, '')}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={categoryClass}>
                              Lançamento futuro
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-black text-sm whitespace-nowrap text-amber-700">
                            {isPrivacyMode ? '••••' : `R$ ${Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 px-2 py-1 rounded-lg bg-amber-100 border border-amber-200">
                                Previsto
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                )}

                {regularTransactions.map((t) => {
                  const rowClass = 'hover:bg-surface-secondary/50 transition-colors group align-middle';
                  const categoryClass = 'inline-flex items-center px-2.5 py-1 bg-surface-secondary border border-surface-elevated rounded-full text-xxs font-bold text-text-secondary';

                  return (
                    <tr key={t.id} className={rowClass}>
                      <td className="px-4 py-3 text-xxs text-text-secondary font-medium whitespace-nowrap">
                        {new Date(t.date.replace(/-/g, '/')).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary font-bold leading-tight">
                        <div className="flex flex-col gap-1">
                          {t.description}
                          {t.paymentMethod === 'credit' && (
                            <div className="flex">
                              <span className="px-1.5 py-0.5 bg-brand-secondary/10 border border-brand-secondary/20 rounded-md text-[9px] font-black text-brand-secondary uppercase tracking-wider">
                                {t.cardId && cardMap[t.cardId] ? cardMap[t.cardId] : 'Crédito'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={categoryClass}>
                          {t.category}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-black text-sm whitespace-nowrap ${t.type === 'income' ? 'text-brand-primary' : 'text-status-danger'}`}>
                        {isPrivacyMode ? '••••' : `R$ ${Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => onEdit(t)}
                            disabled={isDisabled}
                            className="p-2 text-text-muted hover:text-brand-secondary hover:bg-brand-secondary/10 active:bg-brand-secondary/20 rounded-lg transition-all disabled:opacity-30"
                            title="Editar"
                          >
                            <Pencil size={16}/>
                          </button>
                          <button
                            onClick={() => { if (window.confirm(`Deseja excluir "${t.description}"?`)) onDelete(t.id); }}
                            disabled={isDisabled}
                            className="p-2 text-text-muted hover:text-status-danger hover:bg-status-danger/10 active:bg-status-danger/20 rounded-lg transition-all disabled:opacity-30"
                            title="Excluir"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}


              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;
