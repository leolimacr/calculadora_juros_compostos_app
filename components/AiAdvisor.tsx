import React, { useState, useEffect, useRef } from 'react';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const AiAdvisor: React.FC<any> = ({ transactions = [] }) => {
  const { user } = useAuth();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Lógica inteligente para pegar o nome
  const getUserName = () => {
    if (user?.displayName) return user.displayName.split(' ')[0]; // Pega primeiro nome
    if (user?.email) return user.email.split('@')[0]; // Pega antes do @
    return "Investidor";
  };

  const userName = getUserName();
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

  // Estado inicial das mensagens
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'ai', 
      text: `Olá! Sou seu Consultor Finanças Pro Invest. Estou carregando seus dados...` 
    }
  ]);
  
  // EFEITO DE CORREÇÃO: Atualiza a saudação assim que o nome carrega
  useEffect(() => {
    if (user) {
        setMessages(prev => {
            // Só substitui a primeira mensagem se ela for a saudação inicial
            if (prev.length === 1 && prev[0].role === 'ai') {
                return [{
                    role: 'ai',
                    text: `Olá, ${capitalizedName}! Sou seu Consultor Finanças Pro Invest. Já analisei seus dados. Como posso te ajudar hoje?`
                }];
            }
            return prev;
        });
    }
  }, [user, capitalizedName]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const getAiAdvice = httpsCallable(functions, 'getAiAdvice');
      
      const response: any = await getAiAdvice({
        prompt: userMsg,
        context: JSON.stringify(transactions.slice(0, 50)),
        userName: capitalizedName // Envia o nome correto para o cérebro
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.data.answer }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Tive um pequeno lapso. Pode perguntar de novo?' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] bg-slate-900/50 rounded-t-[2.5rem] border-t border-slate-800 overflow-hidden shadow-2xl">
      <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-sky-600 text-white rounded-tr-none shadow-lg' 
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
            placeholder={`Pergunte algo, ${capitalizedName}...`}
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
        <p className="text-[10px] text-center text-slate-600 mt-3 uppercase font-black tracking-widest flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          IA Conectada
        </p>
      </div>
    </div>
  );
};

export default AiAdvisor;