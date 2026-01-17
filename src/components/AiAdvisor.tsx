import React, { useState, useEffect, useRef } from 'react';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';
import { useFirebase } from '../hooks/useFirebase';

const AiAdvisor: React.FC<any> = ({ transactions = [] }) => {
  const { user } = useAuth();
  const { 
    currentMessages, 
    saveChatMessage, 
    chatSessions, 
    currentSessionId, 
    setCurrentSessionId, 
    createNewChatSession 
  } = useFirebase(user?.uid);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const userName = user?.displayName || user?.email?.split('@')[0] || "Investidor";
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    await saveChatMessage('user', userMsg);

    try {
      const getAiAdvice = httpsCallable(functions, 'getAiAdvice');
      const response: any = await getAiAdvice({
        prompt: userMsg,
        context: JSON.stringify(transactions.slice(0, 50)),
        userName: capitalizedName,
        history: currentMessages.slice(-5)
      });
      await saveChatMessage('ai', response.data.answer);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    await createNewChatSession();
    setShowHistory(false);
  };

  return (
    <div className="flex flex-col h-[75vh] bg-slate-900/50 rounded-t-[2.5rem] border-t border-slate-800 overflow-hidden shadow-2xl relative">
      
      {/* HEADER DO CHAT - ALTERAÇÃO AQUI */}
      <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2">
            {/* Ícone de brilho */}
            <span className="text-2xl">✨</span>
            <div>
                {/* Título com Cores Personalizadas */}
                <h3 className="font-bold text-sm flex flex-wrap gap-1 items-center leading-tight">
                  <span className="text-white">Consultor</span>
                  <span className="text-sky-400">Finanças Pro Invest</span>
                  <span className="text-yellow-400">IA</span>
                </h3>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</p>
            </div>
        </div>
        <button 
            onClick={() => setShowHistory(true)} 
            className="bg-slate-800 p-2 px-4 rounded-xl text-xs font-bold text-slate-300 border border-slate-700 hover:text-white"
        >
            🗂️ Histórico
        </button>
      </div>

      {/* MENU LATERAL DE HISTÓRICO */}
      {showHistory && (
        <div className="absolute inset-0 z-50 flex">
            <div className="w-64 bg-slate-900 h-full shadow-2xl border-r border-slate-800 flex flex-col animate-in slide-in-from-left">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <span className="font-bold text-white">Suas Conversas</span>
                    <button onClick={() => setShowHistory(false)} className="text-slate-500">✕</button>
                </div>
                
                <div className="p-4">
                    <button 
                        onClick={handleNewChat}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg mb-4"
                    >
                        <span>+</span> Nova Conversa
                    </button>

                    <div className="space-y-2 overflow-y-auto max-h-[50vh]">
                        {chatSessions.map((session: any) => (
                            <button 
                                key={session.id}
                                onClick={() => { setCurrentSessionId(session.id); setShowHistory(false); }}
                                className={`w-full text-left p-3 rounded-xl text-xs font-medium truncate ${currentSessionId === session.id ? 'bg-slate-800 text-white border border-emerald-500/50' : 'text-slate-400 hover:bg-slate-800'}`}
                            >
                                📅 {new Date(session.createdAt).toLocaleDateString('pt-BR')} - {new Date(session.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                            </button>
                        ))}
                        {chatSessions.length === 0 && <p className="text-center text-slate-600 text-xs">Sem histórico.</p>}
                    </div>
                </div>
            </div>
            <div className="flex-grow bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
        </div>
      )}

      {/* ÁREA DE MENSAGENS */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#0f172a]">
        {currentMessages.length === 0 && (
            <div className="flex justify-start">
                <div className="max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 shadow-md">
                    Olá, {capitalizedName}! Sou seu Consultor. Toque no botão (+) para começar um novo assunto ou digite abaixo. 
                    <br/><span className="text-[10px] text-emerald-500 mt-2 block">Suas conversas ficam salvas conforme seu plano.</span>
                </div>
            </div>
        )}

        {currentMessages.map((msg: any, i: number) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-tr-none shadow-lg' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 shadow-md'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800 pb-8">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua dúvida..."
            className="w-full bg-slate-800 border border-slate-700 text-white p-4 pr-16 rounded-2xl outline-none focus:border-sky-500 transition-all text-sm shadow-inner"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white p-2.5 rounded-xl disabled:opacity-50 active:scale-90 transition-all shadow-lg"
          >
            🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAdvisor;