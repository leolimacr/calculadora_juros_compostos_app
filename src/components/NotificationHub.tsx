import React, { useState } from 'react';
import { Bell, X, Sparkles, ChevronRight, CheckCheck, Inbox, History, RefreshCcw } from 'lucide-react';
import type { NexusEvent } from '../contexts/NotificationContext';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationHubProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

const NotificationHub: React.FC<NotificationHubProps> = ({ isOpen, onClose, onNavigate }) => {
  const { unreadEvents, historyEvents, dismiss, markAllAsRead, loadMoreHistory, hasMoreHistory, loading } = useNotifications();
  const [activeTab, setActiveTab] = useState<'unread' | 'history'>('unread');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  if (!isOpen) return null;

  const handleAction = (event: NexusEvent) => {
    if (event.deepLink) {
        onNavigate(event.deepLink);
    }
    if (!event.read) {
        dismiss(event.id);
    }
    onClose();
  };

  const handleLoadMore = async () => {
      setIsLoadingMore(true);
      await loadMoreHistory();
      setIsLoadingMore(false);
  };

  const renderEventCard = (event: NexusEvent) => (
    <div 
      key={event.id}
      className={`group relative bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.99] overflow-hidden ${
        !event.read && event.urgency === 'high' ? 'border-l-4 border-l-rose-500' : 
        !event.read && event.urgency === 'medium' ? 'border-l-4 border-l-amber-500' : 
        !event.read ? 'border-l-4 border-l-sky-500' : 'opacity-80'
      }`}
    >
      {/* Dismiss Button (Only for unread) */}
      {!event.read && (
          <button 
            onClick={() => dismiss(event.id)}
            className="absolute top-4 right-4 p-1 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X size={16} />
          </button>
      )}

      <div className="flex items-start gap-4">
        <div className={`mt-1 p-2.5 rounded-xl text-white ${
             event.read ? 'bg-slate-300' :
             event.urgency === 'high' ? 'bg-rose-500' : 
             event.urgency === 'medium' ? 'bg-amber-500' : 
             'bg-sky-500'
        }`}>
          <Sparkles size={18} />
        </div>
        <div className="flex-1">
          <h4 className={`text-sm font-black text-slate-900 leading-tight mb-1 uppercase tracking-tight ${event.read ? 'text-slate-500' : ''}`}>
            {event.message.title}
          </h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
            {event.message.body}
          </p>
          
          {event.message.ctaLabel && (
            <button
              onClick={() => handleAction(event)}
              className="flex items-center gap-2 text-[10px] font-black text-sky-600 uppercase tracking-widest hover:text-sky-700 transition-colors"
            >
              {event.message.ctaLabel}
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      {/* Drawer */}
      <div className="relative w-full max-w-xl h-screen h-[100dvh] bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
        
        {/* Header */}
        <div className="bg-white px-6 pt-4 pb-1 border-b border-slate-200 flex flex-col shadow-sm shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Bell size={24} className="text-slate-900" />
                    {unreadEvents.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white">
                            {unreadEvents.length}
                        </span>
                    )}
                </div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Comunicações</h2>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={onClose}
                    className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <X size={24} />
                </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('unread')}
                className={`pb-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                    activeTab === 'unread' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-600'
                }`}
              >
                  Entrada ({unreadEvents.length})
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`pb-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                    activeTab === 'history' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-600'
                }`}
              >
                  Histórico
              </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {loading && unreadEvents.length === 0 && historyEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 opacity-50">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Buscando atualizações...</p>
            </div>
          ) : activeTab === 'unread' ? (
              <div className="space-y-3">
                  {unreadEvents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-[2.5rem] shadow-sm flex items-center justify-center border border-slate-100">
                            <Inbox size={40} className="text-slate-200" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Nada novo por aqui</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium mb-6">
                                Suas mensagens lidas estão guardadas no histórico.
                            </p>
                            <button 
                                onClick={() => setActiveTab('history')}
                                className="flex items-center gap-2 mx-auto px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                <History size={14} /> Acessar Histórico
                            </button>
                        </div>
                      </div>
                  ) : (
                      <>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Não lidas</span>
                            <button 
                                onClick={markAllAsRead}
                                className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors"
                            >
                                <CheckCheck size={12} /> Marcar tudo como lido
                            </button>
                        </div>
                        {unreadEvents.map(renderEventCard)}
                      </>
                  )}
              </div>
          ) : (
              <div className="space-y-3">
                  {historyEvents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-2">
                        <p className="text-xs text-slate-500 font-medium">Nenhum histórico encontrado.</p>
                      </div>
                  ) : (
                      <>
                        {historyEvents.map(renderEventCard)}
                        {hasMoreHistory && (
                            <button 
                                onClick={handleLoadMore}
                                disabled={isLoadingMore}
                                className="w-full mt-6 py-4 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-sky-600 hover:border-sky-300 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isLoadingMore ? (
                                    <RefreshCcw size={14} className="animate-spin" />
                                ) : (
                                    <>Ver mais mensagens</>
                                )}
                            </button>
                        )}
                      </>
                  )}
              </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-200 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                Finanças Pro Invest · Nexus AI
            </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationHub;
