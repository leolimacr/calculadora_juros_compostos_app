import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAiAgent } from '../hooks/useAiAgent';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';
import { Sparkles, Send, PlusCircle, Folder, Cpu, Activity, X, Trash2, Lock } from 'lucide-react';
import { saveChatHistory, loadUserChatHistory, updateChatHistory, deleteChatHistory, type ChatHistoryItem } from '../services/chatHistoryService';
import { Preferences } from '@capacitor/preferences';

interface AiAdvisorProps { transactions: any[]; currentCalcResult: any[]; goals: any[]; currentTool: string; }
interface Message { role: 'user' | 'ai'; text: string; timestamp: Date; isIntro?: boolean; }

const formatMarkdown = (text: string) => {
  return text.split('\n').map((line, i) => {
    const formattedLine = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={j} className="font-black text-white">{part.slice(2, -2)}</strong>;
      return part;
    });
    return <p key={i} className={line.trim().startsWith('•') ? "ml-2 mb-1" : "mb-3"}>{formattedLine}</p>;
  });
};

const AiAdvisor: React.FC<AiAdvisorProps> = ({ transactions = [], currentCalcResult = [], goals = [], currentTool }) => {
  const { user } = useAuth();
  const { sendToNexus, isLoading: isAiLoading } = useAiAgent();
  const { isPro, isPremium } = useSubscriptionAccess(); 
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [conversationHistory, setConversationHistory] = useState<ChatHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [dailyCount, setDailyCount] = useState(0);
  const FREE_DAILY_LIMIT = 5;

  const getUserName = () => {
    if (user?.displayName) return user.displayName.split(' ')[0];
    const emailName = user?.email ? user.email.split('@')[0] : "Investidor";
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  };
  const capitalizedName = getUserName();

  const [messages, setMessages] = useState<Message[]>([{ role: 'ai', isIntro: true, text: `=== NEXUS CONSULTOR ===\nUsuário: ${capitalizedName}\nStatus: Conexão Segura Ativa`, timestamp: new Date() }]);
  const [input, setInput] = useState('');

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isAiLoading]);

  useEffect(() => {
    const checkLimit = async () => {
        if (!user?.uid) return;
        const today = new Date().toISOString().split('T')[0];
        const { value } = await Preferences.get({ key: `nexus_count_${user.uid}_${today}` });
        setDailyCount(value ? parseInt(value) : 0);
    };
    checkLimit();
  }, [user]);

  const incrementDailyCount = async () => {
      if (isPro || isPremium) return;
      const today = new Date().toISOString().split('T')[0];
      const newCount = dailyCount + 1;
      setDailyCount(newCount);
      await Preferences.set({ key: `nexus_count_${user?.uid}_${today}`, value: newCount.toString() });
  };

  const refreshHistory = async () => {
    if (!user?.uid) return;
    try {
      const history = await loadUserChatHistory(user.uid);
      let daysLimit = 3; if (isPremium) daysLimit = 90; else if (isPro) daysLimit = 30;
      const cutoff = Date.now() - (daysLimit * 24 * 60 * 60 * 1000);
      setConversationHistory(history.filter(item => item.createdAt > cutoff));
    } catch (e) {}
  };

  useEffect(() => { refreshHistory(); }, [user, isPro, isPremium]);

  const loadFromHistory = async (historyItem: ChatHistoryItem) => {
    if (!user?.uid) return;
    const loadedMessages: Message[] = historyItem.messages.map(msg => ({ role: msg.role as 'user' | 'ai', text: msg.text, timestamp: new Date(msg.timestamp) }));
    setMessages(loadedMessages);
    setCurrentChatId(historyItem.id || null);
    setIsHistoryOpen(false);
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (window.confirm("Excluir esta conversa?")) {
      await deleteChatHistory(user!.uid, chatId);
      if (currentChatId === chatId) startNewConversation();
      await refreshHistory();
    }
  };

  const saveToHistory = async (title: string, messagesToSave: Message[]) => {
    if (messagesToSave.length <= 1 || !user?.uid) return;
    const historyItem: Omit<ChatHistoryItem, 'id'> = {
      userId: user.uid,
      title: title || `Conversa ${new Date().toLocaleDateString()}`,
      messages: messagesToSave.map(msg => ({ role: msg.role, text: msg.text, timestamp: msg.timestamp.getTime() })),
      createdAt: Date.now(), lastUpdated: Date.now(), toolContext: currentTool
    };
    const newChatId = await saveChatHistory(user.uid, historyItem);
    setCurrentChatId(newChatId);
    await refreshHistory();
  };

  const handleSend = async () => {
    if (!input.trim() || isAiLoading || !user) return;
    if (!isPro && !isPremium && dailyCount >= FREE_DAILY_LIMIT) {
        setMessages(prev => [...prev, { role: 'ai', text: "**LIMITE DIÁRIO ATINGIDO**\n\nAtualize para o plano Pro para continuar.", timestamp: new Date() }]);
        return;
    }
    const userMsg = input.trim();
    const newMessages: Message[] = [...messages, { role: 'user', text: userMsg, timestamp: new Date() }];
    setMessages(newMessages);
    setInput('');
    await incrementDailyCount();
    
    // ✅ EnviauserName e o contexto completo (transactions + simulations)
    const response = await sendToNexus(
      userMsg, 
      { transactions, simulations: currentCalcResult, currentTool }, 
      capitalizedName, 
      newMessages.filter(m => !m.isIntro).map(m => ({ role: m.role, text: m.text })), 
      newMessages.length === 2
    );

    if (response) {
      const updatedWithAi: Message[] = [...newMessages, { role: 'ai', text: response.answer, timestamp: new Date() }];
      setMessages(updatedWithAi);
      if (!currentChatId) await saveToHistory(`Análise: ${userMsg.substring(0, 20)}...`, updatedWithAi);
      else await updateCurrentChat(updatedWithAi);
    }
  };

  const updateCurrentChat = async (updatedMessages: Message[]) => {
    if (!currentChatId || !user?.uid) return;
    await updateChatHistory(user.uid, currentChatId, { messages: updatedMessages.map(msg => ({ role: msg.role, text: msg.text, timestamp: msg.timestamp.getTime() })), lastUpdated: Date.now() });
  };

  const startNewConversation = () => {
    setCurrentChatId(null);
    setMessages([{ role: 'ai', isIntro: true, text: `=== NEXUS CONSULTOR ===\nUsuário: ${capitalizedName}\nStatus: Conexão Segura Ativa`, timestamp: new Date() }]);
  };

  return (
    <div className="flex flex-col h-full bg-[#020617] relative font-sans">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#020617]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20"><Cpu size={18} className="text-sky-400" /></div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-tighter">Nexus Core v2.5</h3>
            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span><span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Active</span></div>
          </div>
        </div>
        <div className="flex gap-2">
          {!isPro && !isPremium && <div className="flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full border border-slate-700"><span className="text-[10px] text-slate-400 font-bold">Free: {FREE_DAILY_LIMIT - dailyCount} r.</span></div>}
          <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="p-2 text-slate-500 hover:text-sky-400 transition-all"><Folder size={20} /></button>
          <button onClick={startNewConversation} className="p-2 text-slate-500 hover:text-emerald-400 transition-all"><PlusCircle size={20} /></button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
        {messages.map((msg: Message, i: number) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.isIntro ? (
              <div className="w-full max-w-lg bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-slate-800/50"><span className="text-[10px] text-slate-500 font-bold uppercase">Usuário</span><span className="text-xs text-white font-mono">{capitalizedName}</span></div>
                    <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-slate-800/50"><span className="text-[10px] text-slate-500 font-bold uppercase">Status</span><div className="flex items-center gap-2"><Activity size={12} className="text-emerald-500" /><span className="text-xs text-emerald-400 font-mono">CONNECTED</span></div></div>
                 </div>
              </div>
            ) : (<div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-sky-600 text-white rounded-tr-none' : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700'}`}><div className="markdown-container">{formatMarkdown(msg.text)}</div></div>)}
          </div>
        ))}
        {isAiLoading && <div className="flex justify-start"><div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex items-center gap-3"><span className="text-[10px] text-slate-500 font-black uppercase tracking-widest animate-pulse">Analisando dados...</span></div></div>}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 md:p-6 bg-[#020617] border-t border-slate-800">
        <div className="max-w-4xl mx-auto relative">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder={!isPro && !isPremium && dailyCount >= FREE_DAILY_LIMIT ? "Limite diário atingido." : "Pergunte ao Nexus..."} disabled={!isPro && !isPremium && dailyCount >= FREE_DAILY_LIMIT} className="w-full bg-slate-900/50 border border-slate-800 text-white p-4 pr-14 rounded-2xl outline-none focus:border-sky-500 transition-all text-sm disabled:opacity-50" />
          <button onClick={handleSend} disabled={isAiLoading || !input.trim() || (!isPro && !isPremium && dailyCount >= FREE_DAILY_LIMIT)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-sky-600 text-white rounded-xl active:scale-90 transition-all disabled:opacity-50">{!isPro && !isPremium && dailyCount >= FREE_DAILY_LIMIT ? <Lock size={18}/> : <Send size={18} />}</button>
        </div>
      </div>
      {isHistoryOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#020617] border-l border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center"><h4 className="text-white font-black text-xs uppercase tracking-widest">Suas Conversas</h4><button onClick={() => setIsHistoryOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button></div>
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
                {conversationHistory.length === 0 ? (<p className="text-slate-600 text-xs text-center mt-10 italic">Nenhuma conversa encontrada.</p>) : (
                  conversationHistory.map((item) => (
                      <div key={item.id} onClick={() => loadFromHistory(item)} className={`p-4 bg-slate-900/50 border rounded-2xl cursor-pointer group transition-all relative flex justify-between items-center ${currentChatId === item.id ? 'border-sky-500/50 bg-sky-500/5' : 'border-slate-800 hover:border-slate-700'}`}>
                          <div className="flex-grow overflow-hidden mr-2"><p className="text-slate-300 font-bold text-sm truncate group-hover:text-white">{item.title}</p><p className="text-[9px] text-slate-600 mt-1 uppercase font-bold tracking-tighter">{new Date(item.createdAt).toLocaleDateString()}</p></div>
                          <button onClick={(e) => handleDeleteChat(e, item.id!)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </div>
                  ))
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAdvisor;