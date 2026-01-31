import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAiAgent } from '../hooks/useAiAgent';
import { Sparkles, Send, PlusCircle, Folder, Terminal, Cpu, Activity, X } from 'lucide-react';
import { 
  saveChatHistory, 
  loadUserChatHistory, 
  updateChatHistory,
  deleteChatHistory,
  type ChatHistoryItem 
} from '../services/chatHistoryService';

// Função auxiliar para transformar Markdown simples (**texto**) em HTML real
const formatMarkdown = (text: string) => {
  return text.split('\n').map((line, i) => {
    // Processa negrito: substitui **texto** por <strong>texto</strong>
    const formattedLine = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-black text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return (
      <p key={i} className={line.trim().startsWith('•') ? "ml-2 mb-1" : "mb-3"}>
        {formattedLine}
      </p>
    );
  });
};

const AiAdvisor: React.FC<any> = ({ transactions = [], currentCalcResult, goals, currentTool }) => {
  const { user } = useAuth();
  const { sendToNexus, isLoading: isAiLoading, error: aiError } = useAiAgent();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [conversationHistory, setConversationHistory] = useState<ChatHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  const getUserName = () => {
    if (user?.displayName) return user.displayName.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return "Investidor";
  };

  const capitalizedName = getUserName().charAt(0).toUpperCase() + getUserName().slice(1);

  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'ai', 
      isIntro: true,
      text: `=== CONSULTOR IA NEXUS ===\nUsuário: ${capitalizedName}\nStatus: Conectado aos dados financeiros\nModo: ${currentTool || 'chat_web'}`,
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.uid) return;
      try {
        const history = await loadUserChatHistory(user.uid);
        setConversationHistory(history);
      } catch (error) {
        console.error('❌ Falha ao carregar histórico:', error);
      }
    };
    loadHistory();
  }, [user]);

  const loadFromHistory = async (historyItem: ChatHistoryItem) => {
    if (!user?.uid) return;
    try {
      const loadedMessages: any[] = historyItem.messages.map(msg => ({
        role: msg.role,
        text: msg.text,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(loadedMessages);
      setCurrentChatId(historyItem.id || null);
      setIsHistoryOpen(false);
    } catch (error) {
      console.error('❌ Erro ao carregar conversa:', error);
    }
  };

  const saveToHistory = async (title: string) => {
    if (messages.length <= 1 || !user?.uid) return;
    const historyItem: Omit<ChatHistoryItem, 'id'> = {
      userId: user.uid,
      title: title || `Conversa ${new Date().toLocaleDateString()}`,
      messages: messages.map(msg => ({
        role: msg.role,
        text: msg.text,
        timestamp: msg.timestamp.getTime()
      })),
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      toolContext: currentTool
    };
    try {
      const newChatId = await saveChatHistory(user.uid, historyItem);
      setCurrentChatId(newChatId);
      const updatedHistory = await loadUserChatHistory(user.uid);
      setConversationHistory(updatedHistory);
    } catch (error) {}
  };

  const handleSend = async () => {
    if (!input.trim() || isAiLoading || !user) return;
    const userMsg = input.trim();
    const newMessages = [...messages, { role: 'user', text: userMsg, timestamp: new Date() } as any];
    setMessages(newMessages);
    setInput('');

    const response = await sendToNexus(
      userMsg,
      { transactions: transactions.slice(0, 50), currentTool, goals, currentCalcResult },
      capitalizedName,
      messages.filter(m => !m.isIntro).map(m => ({ role: m.role, text: m.text })),
      messages.length === 1
    );

    if (response) {
      const updatedWithAi = [...newMessages, { role: 'ai', text: response.answer, timestamp: new Date() } as any];
      setMessages(updatedWithAi);
      if (!currentChatId) await saveToHistory(`Análise: ${userMsg.substring(0, 20)}...`);
      else await updateCurrentChat();
    }
  };

  const updateCurrentChat = async () => {
    if (!currentChatId || !user?.uid) return;
    await updateChatHistory(user.uid, currentChatId, {
      messages: messages.map(msg => ({ role: msg.role, text: msg.text, timestamp: msg.timestamp.getTime() })),
      lastUpdated: Date.now()
    });
  };

  const startNewConversation = () => {
    setCurrentChatId(null);
    setMessages([{ 
      role: 'ai', 
      isIntro: true, 
      text: `=== CONSULTOR IA NEXUS ===\nUsuário: ${capitalizedName}\nStatus: Reinicializado\nModo: ${currentTool || 'chat_web'}`, 
      timestamp: new Date() 
    }]);
  };

  return (
    <div className="flex flex-col h-full bg-[#020617] relative font-sans">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#020617]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20"><Cpu size={18} className="text-sky-400" /></div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-tighter">Nexus Core v2.1</h3>
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Neural Link Active</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="p-2 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-xl transition-all"><Folder size={20} /></button>
          <button onClick={startNewConversation} className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"><PlusCircle size={20} /></button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
        {messages.map((msg: any, i: number) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.isIntro ? (
              <div className="w-full max-w-lg bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Usuário</span>
                        <span className="text-xs text-white font-mono">{capitalizedName}</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Status</span>
                        <div className="flex items-center gap-2"><Activity size={12} className="text-emerald-500" /><span className="text-xs text-emerald-400 font-mono">CONNECTED</span></div>
                    </div>
                 </div>
                 <div className="mt-6 pt-4 border-t border-slate-800/50">
                    <p className="text-xs text-slate-400 font-medium font-mono text-center">Converse com o Nexus, digite sua pergunta!</p>
                 </div>
              </div>
            ) : (
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-sky-600 text-white rounded-tr-none' : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700'
              }`}>
                {/* ✅ A MÁGICA DO NEGRITO ACONTECE AQUI */}
                <div className="markdown-container">
                  {formatMarkdown(msg.text)}
                </div>
              </div>
            )}
          </div>
        ))}
        {isAiLoading && <div className="flex justify-start"><div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex items-center gap-3"><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:0.4s]"></div></div><span className="text-[10px] text-slate-500 font-black uppercase">Processing</span></div></div>}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 md:p-6 bg-[#020617] border-t border-slate-800">
        <div className="max-w-4xl mx-auto relative">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Sua dúvida financeira..." className="w-full bg-slate-900/50 border border-slate-800 text-white p-4 pr-14 rounded-2xl outline-none focus:border-sky-500 transition-all text-sm" />
          <button onClick={handleSend} disabled={isAiLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-sky-600 text-white rounded-xl active:scale-90 transition-all"><Send size={18} /></button>
        </div>
      </div>
      {isHistoryOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#020617] border-l border-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center"><h4 className="text-white font-black text-xs uppercase tracking-widest">Conversas</h4><button onClick={() => setIsHistoryOpen(false)} className="text-slate-500"><X size={20}/></button></div>
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
                {conversationHistory.map((item) => (
                    <div key={item.id} onClick={() => loadFromHistory(item)} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-sky-500/50 cursor-pointer group">
                        <p className="text-slate-300 font-bold text-sm truncate group-hover:text-white">{item.title}</p>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAdvisor;