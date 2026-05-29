import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, CreditCard as CardIcon, Trash2, EyeOff, Eye, RefreshCw, Calendar, Settings2, Check } from 'lucide-react';
import { addCard, getCards, updateCard, deleteCard } from '../../../services/cardService';
import { CreditCard, Transaction } from '../../../types';

interface CardManagerProps {
  isOpen: boolean;
  onClose: (newCards?: CreditCard[]) => void;
  userId: string;
  transactions: Transaction[];
}

const CardManager: React.FC<CardManagerProps> = ({ isOpen, onClose, userId, transactions }) => {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [newCardName, setNewCardName] = useState('');
  const [newClosingDay, setNewClosingDay] = useState<string>('');
  const [newDueDay, setNewDueDay] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editClosingDay, setEditClosingDay] = useState<string>('');
  const [editDueDay, setEditDueDay] = useState<string>('');

  useEffect(() => {
    if (isOpen && userId) {
      loadCards();
    }
  }, [isOpen, userId]);

  const loadCards = async () => {
    setIsLoading(true);
    try {
      const data = await getCards(userId);
      setCards(data);
    } catch (error) {
      console.error("Erro ao carregar cartões:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newCardName.trim()) return;
    setIsAdding(true);
    try {
      await addCard(
        userId, 
        newCardName.trim(), 
        newClosingDay ? Number(newClosingDay) : undefined, 
        newDueDay ? Number(newDueDay) : undefined
      );
      setNewCardName('');
      setNewClosingDay('');
      setNewDueDay('');
      await loadCards();
    } catch (error) {
      console.error("Erro ao adicionar cartão:", error);
      alert("Erro ao salvar cartão.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (card: CreditCard) => {
    setEditingCardId(card.id);
    setEditClosingDay(card.closingDay?.toString() || '');
    setEditDueDay(card.dueDay?.toString() || '');
  };

  const handleSaveEdit = async (cardId: string) => {
    try {
      await updateCard(userId, cardId, {
        closingDay: editClosingDay ? Number(editClosingDay) : undefined,
        dueDay: editDueDay ? Number(editDueDay) : undefined
      });
      setEditingCardId(null);
      await loadCards();
    } catch (error) {
      console.error("Erro ao atualizar cartão:", error);
      alert("Erro ao salvar alterações.");
    }
  };

  const checkCardHistory = (cardId: string) => {
    return transactions.some(t => t.cardId === cardId);
  };

  const handleToggleStatus = async (card: CreditCard) => {
    const nextStatus = !card.isActive;
    try {
      await updateCard(userId, card.id, { isActive: nextStatus });
      await loadCards();
    } catch (error) {
      console.error("Erro ao atualizar status do cartão:", error);
      alert("Erro ao alterar visibilidade do cartão.");
    }
  };

  const handleDeleteCard = async (card: CreditCard) => {
    const hasHistory = checkCardHistory(card.id);
    
    if (hasHistory) {
      if (window.confirm(`O cartão "${card.name}" possui histórico de lançamentos e não pode ser excluído permanentemente para não afetar seus dados.\n\nDeseja apenas OCULTÁ-LO da lista de seleção?`)) {
        await handleToggleStatus(card);
      }
      return;
    }

    if (window.confirm(`Tem certeza que deseja EXCLUIR permanentemente o cartão "${card.name}"?`)) {
      try {
        await deleteCard(userId, card.id);
        await loadCards();
      } catch (error) {
        console.error("Erro ao excluir cartão:", error);
        alert("Erro ao excluir cartão.");
      }
    }
  };

  const filteredCards = useMemo(() => {
    return cards.filter(c => showHidden ? !c.isActive : c.isActive);
  }, [cards, showHidden]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-primary w-full max-w-md rounded-4xl shadow-2xl border border-surface-elevated overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-surface-elevated flex items-center justify-between bg-surface-secondary/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
              <CardIcon size={20} />
            </div>
            <h2 className="text-lg font-black text-text-primary uppercase tracking-tight">Meus Cartões</h2>
          </div>
          <button onClick={() => onClose(cards)} className="p-2 hover:bg-surface-elevated rounded-full transition-colors text-text-muted">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Tabs para Ativos/Ocultos */}
          <div className="flex bg-surface-elevated p-1 rounded-2xl border border-surface-elevated">
            <button 
              onClick={() => setShowHidden(false)} 
              className={`flex-1 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${!showHidden ? 'bg-surface-primary text-text-primary shadow-soft' : 'text-text-muted'}`}
            >
              Ativos
            </button>
            <button 
              onClick={() => setShowHidden(true)} 
              className={`flex-1 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${showHidden ? 'bg-surface-primary text-text-primary shadow-soft' : 'text-text-muted'}`}
            >
              Ocultos
            </button>
          </div>

          {!showHidden && (
            <div className="space-y-3 bg-surface-secondary/30 p-4 rounded-3xl border border-surface-elevated">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Novo Cartão</p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome do cartão (ex: Nubank)"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  className="w-full bg-surface-primary p-4 rounded-2xl text-text-primary font-medium outline-none border border-surface-elevated focus:border-brand-primary text-sm shadow-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Dia Fechamento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Ex: 5"
                      value={newClosingDay}
                      onChange={(e) => setNewClosingDay(e.target.value)}
                      className="w-full bg-surface-primary p-3 rounded-xl text-text-primary font-bold outline-none border border-surface-elevated focus:border-brand-primary text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Dia Vencimento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Ex: 12"
                      value={newDueDay}
                      onChange={(e) => setNewDueDay(e.target.value)}
                      className="w-full bg-surface-primary p-3 rounded-xl text-text-primary font-bold outline-none border border-surface-elevated focus:border-brand-primary text-xs"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAdd}
                  disabled={isAdding || !newCardName.trim()}
                  className="w-full py-4 bg-brand-primary text-text-onBrand rounded-2xl shadow-brand-glow active:scale-95 disabled:opacity-50 transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Adicionar Cartão
                </button>
              </div>
            </div>
          )}

          {/* Lista de cartões */}
          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                {showHidden ? 'Cartões Ocultos' : 'Cartões Cadastrados'}
              </p>
              {isLoading && <RefreshCw size={12} className="animate-spin text-text-muted" />}
            </div>
            
            {filteredCards.length === 0 ? (
              <div className="text-center py-8 bg-surface-secondary/30 rounded-3xl border border-dashed border-surface-elevated">
                <p className="text-xxs text-text-muted font-bold uppercase tracking-widest leading-loose px-4">
                  {showHidden ? 'Nenhum cartão oculto.' : 'Nenhum cartão ativo.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {filteredCards.map((card) => {
                  const hasHistory = checkCardHistory(card.id);
                  const isEditing = editingCardId === card.id;

                  return (
                    <div key={card.id} className="bg-surface-secondary rounded-3xl border border-surface-elevated overflow-hidden transition-all group hover:border-text-muted/30">
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-text-primary">{card.name}</span>
                          {!isEditing && (card.closingDay || card.dueDay) && (
                            <div className="flex items-center gap-3 mt-1">
                              {card.closingDay && (
                                <div className="flex items-center gap-1 text-text-muted">
                                  <Calendar size={10} />
                                  <span className="text-[9px] font-bold uppercase tracking-tighter">Corte: Dia {card.closingDay}</span>
                                </div>
                              )}
                              {card.dueDay && (
                                <div className="flex items-center gap-1 text-brand-primary">
                                  <Calendar size={10} />
                                  <span className="text-[9px] font-bold uppercase tracking-tighter">Venc: Dia {card.dueDay}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!showHidden ? (
                            <>
                              {!isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(card)}
                                    className="p-2 text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all"
                                    title="Configurar Datas"
                                  >
                                    <Settings2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(card)}
                                    className="p-2 text-text-muted hover:text-brand-secondary hover:bg-brand-secondary/10 rounded-xl transition-all"
                                    title="Ocultar Cartão"
                                  >
                                    <EyeOff size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCard(card)}
                                    className={`p-2 transition-all rounded-xl ${hasHistory ? 'text-text-muted/40 cursor-not-allowed' : 'text-text-muted hover:text-status-danger hover:bg-status-danger/10'}`}
                                    title={hasHistory ? "Não pode excluir (tem histórico)" : "Excluir Cartão"}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setEditingCardId(null)}
                                  className="p-2 text-text-muted hover:text-status-danger hover:bg-status-danger/10 rounded-xl transition-all"
                                  title="Cancelar Edição"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(card)}
                              className="p-2 text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all flex items-center gap-2 px-3"
                            >
                              <Eye size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Reativar</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Área de Edição de Datas */}
                      {isEditing && (
                        <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                          <div className="bg-surface-primary/50 p-4 rounded-2xl border border-surface-elevated space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Dia Corte</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="31"
                                  value={editClosingDay}
                                  onChange={(e) => setEditClosingDay(e.target.value)}
                                  className="w-full bg-surface-primary p-2 rounded-xl text-text-primary font-bold outline-none border border-surface-elevated focus:border-brand-primary text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Dia Vencimento</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="31"
                                  value={editDueDay}
                                  onChange={(e) => setEditDueDay(e.target.value)}
                                  className="w-full bg-surface-primary p-2 rounded-xl text-text-primary font-bold outline-none border border-surface-elevated focus:border-brand-primary text-xs"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => handleSaveEdit(card.id)}
                              className="w-full py-3 bg-brand-primary text-text-onBrand rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                            >
                              <Check size={14} /> Salvar Configuração
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-surface-secondary/50 border-t border-surface-elevated">
          <button
            onClick={() => onClose(cards)}
            className="w-full py-4 bg-surface-elevated text-text-primary font-black rounded-3xl uppercase text-xxs tracking-ultra-wide hover:bg-surface-secondary transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardManager;
