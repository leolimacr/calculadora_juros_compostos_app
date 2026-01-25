import React, { useState, useEffect, useRef } from 'react';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';
// ✅ Importa o serviço de histórico e suas interfaces
import { 
  saveChatHistory, 
  loadUserChatHistory, 
  updateChatHistory,
  deleteChatHistory,
  type ChatHistoryMessage, 
  type ChatHistoryItem 
} from '../services/chatHistoryService';

interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const AiAdvisor: React.FC<any> = ({ transactions = [], currentCalcResult, goals, currentTool }) => {
  const { user } = useAuth();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // ✅ Estados atualizados para usar o serviço Firebase
  const [conversationHistory, setConversationHistory] = useState<ChatHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Lógica inteligente para pegar o nome
  const getUserName = () => {
    if (user?.displayName) return user.displayName.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return "Investidor";
  };

  const userName = getUserName();
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

  // ✅ CORREÇÃO: Estado das mensagens ATUAIS com mensagem inicial FINALIZADA
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'ai', 
      text: `Olá, ${capitalizedName}! Me chamo Nexus, seu Consultor Finanças Pro Invest. Já carreguei os seus dados. Em que posso ajudá-lo hoje?`,
      timestamp: new Date()
    }
  ]);
  
  // 🔄 Carrega o histórico do Firebase quando o usuário loga
  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.uid) return;
      
      try {
        const history = await loadUserChatHistory(user.uid);
        setConversationHistory(history);
        console.log('✅ Histórico carregado do Firebase:', history.length, 'conversas');
      } catch (error) {
        console.error('❌ Falha ao carregar histórico:', error);
      }
    };
    
    loadHistory();
  }, [user]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Scroll automático
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ Salva conversa atual no Firebase (substitui localStorage)
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
      
      // Atualiza a lista local
      const updatedHistory = await loadUserChatHistory(user.uid);
      setConversationHistory(updatedHistory);
      
    } catch (error) {
      console.error('❌ Erro ao salvar no Firebase:', error);
      alert('Não foi possível salvar a conversa. Verifique sua conexão.');
    }
  };

  // ✅ Carrega conversa do histórico do Firebase
  const loadFromHistory = async (historyItem: ChatHistoryItem) => {
    if (!user?.uid) return;
    
    try {
      // Converte as mensagens do formato do serviço para o formato do componente
      const loadedMessages: Message[] = historyItem.messages.map(msg => ({
        role: msg.role,
        text: msg.text,
        timestamp: new Date(msg.timestamp)
      }));
      
      setMessages(loadedMessages);
      setCurrentChatId(historyItem.id || null);
      setIsHistoryOpen(false);
      
      console.log('✅ Conversa carregada:', historyItem.title);
    } catch (error) {
      console.error('❌ Erro ao carregar conversa:', error);
    }
  };

  // ✅ Atualiza uma conversa existente no Firebase
  const updateCurrentChat = async () => {
    if (!currentChatId || !user?.uid || messages.length <= 1) return;
    
    const updates = {
      messages: messages.map(msg => ({
        role: msg.role,
        text: msg.text,
        timestamp: msg.timestamp.getTime()
      })),
      lastUpdated: Date.now()
    };
    
    try {
      await updateChatHistory(user.uid, currentChatId, updates);
      console.log('✅ Conversa atualizada no Firebase');
    } catch (error) {
      console.error('❌ Erro ao atualizar conversa:', error);
    }
  };

  // Função principal de envio
  const handleSend = async () => {
    if (!input.trim() || loading || !user) return;

    const userMsg = input.trim();
    const userMessage: Message = { role: 'user', text: userMsg, timestamp: new Date() };
    
    setInput('');
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const getAiAdvice = httpsCallable(functions, 'askAiAdvisor');
      console.log("🔥 Chamando função:", 'askAiAdvisor');
      
      const contextData = {
        transactions: transactions.slice(0, 50),
        currentTool,
        goals,
        currentCalcResult,
        messageCount: messages.length
      };
      
      // ✅ CORREÇÃO CRÍTICA: Envia array VAZIO para evitar que a IA repita padrões
      const response: any = await getAiAdvice({
        prompt: userMsg,
        context: JSON.stringify(contextData),
        userName: capitalizedName,
        history: [] // Array VAZIO - ignora todo o histórico anterior
      });

      const aiMessage: Message = { 
        role: 'ai', 
        text: response.data.answer,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // ✅ Se for uma nova conversa, salva. Se for uma existente, atualiza.
      if (!currentChatId) {
        await saveToHistory(`Conversa sobre ${userMsg.substring(0, 20)}...`);
      } else {
        await updateCurrentChat();
      }

    } catch (error: any) {
      console.error('🔥 ERRO NA CHAMADA DA FUNÇÃO:', error);
      
      const errorMessage: Message = {
        role: 'ai',
        text: `Desculpe ${capitalizedName}, estou com dificuldades técnicas. Erro: ${error.message}. Tente novamente.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Nova conversa (com limpeza do ID atual)
  const startNewConversation = async () => {
    if (messages.length > 1) {
      await saveToHistory(`Conversa ${conversationHistory.length + 1}`);
    }
    
    setCurrentChatId(null);
    setMessages([{
      role: 'ai',
      text: `Olá, ${capitalizedName}! Vamos começar uma nova conversa. Em que posso ajudá-lo hoje?`,
      timestamp: new Date()
    }]);
  };

  // ✅ Exclui uma conversa do histórico
  const deleteFromHistory = async (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Evita carregar a conversa ao clicar no botão de excluir
    
    if (!user?.uid || !window.confirm('Tem certeza que deseja excluir esta conversa?')) return;
    
    try {
      await deleteChatHistory(user.uid, chatId);
      const updatedHistory = await loadUserChatHistory(user.uid);
      setConversationHistory(updatedHistory);
      
      // Se a conversa excluída é a que está aberta, limpa a tela
      if (currentChatId === chatId) {
        startNewConversation();
      }
      
      console.log('✅ Conversa excluída');
    } catch (error) {
      console.error('❌ Erro ao excluir conversa:', error);
      alert('Não foi possível excluir a conversa.');
    }
  };

  // Renderização da UI
  return (
    <div className="flex flex-col h-[75vh] bg-slate-900/50 rounded-t-[2.5rem] border-t border-slate-800 overflow-hidden shadow-2xl relative">
      
      {/* HEADER COM CONTROLES */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-bold text-white">Consultor IA</h3>
          <span className="text-xs bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full">Premium</span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            title="Histórico"
          >
            📁
          </button>
          <button 
            onClick={startNewConversation}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            title="Nova conversa"
          >
            🆕
          </button>
        </div>
      </div>

      {/* PAINEL DO HISTÓRICO (LATERAL) */}
      {isHistoryOpen && (
        <div className="absolute top-16 right-0 w-72 h-[calc(100%-4rem)] bg-slate-900 border-l border-slate-800 z-10 shadow-2xl">
          <div className="p-4 border-b border-slate-800">
            <h4 className="text-white font-bold">Histórico de Conversas</h4>
            <p className="text-slate-400 text-xs">{conversationHistory.length} salvas no servidor</p>
          </div>
          
          <div className="overflow-y-auto h-[calc(100%-5rem)] custom-scrollbar">
            {conversationHistory.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                Nenhuma conversa salva. Suas conversas aparecerão aqui.
              </div>
            ) : (
              conversationHistory.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="p-4 border-b border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors flex justify-between items-center"
                >
                  <div className="flex-grow min-w-0">
                    <h5 className="text-white font-bold truncate">{item.title}</h5>
                    <p className="text-slate-400 text-xs truncate">
                      {item.messages.length} mensagens • {new Date(item.lastUpdated).toLocaleDateString()}
                    </p>
                    {item.toolContext && (
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded mt-1 inline-block">
                        {item.toolContext}
                      </span>
                    )}
                  </div>
                  {/* ✅ Botão de lixeira sempre visível */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Impede que clicar na lixeira abra a conversa
                      deleteFromHistory(item.id!, e);
                    }}
                    className="text-slate-400 hover:text-red-400 transition-colors ml-3 p-2 flex-shrink-0"
                    title="Excluir conversa"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900">
            <button 
              onClick={() => setIsHistoryOpen(false)}
              className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm"
            >
              Fechar Histórico
            </button>
          </div>
        </div>
      )}

      {/* ÁREA DE MENSAGENS */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-sky-600 text-white rounded-tr-none shadow-lg' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 shadow-md'
            }`}>
              <div className="mb-1">
                <span className="text-xs opacity-70">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
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

      {/* ÁREA DE INPUT */}
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
        
        {/* CONTEXT INFO BAR */}
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          <div className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full">
            {transactions.length} transações
          </div>
          <div className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full">
            {currentTool || 'Geral'}
          </div>
          <div className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full">
            {currentChatId ? 'Conversa Salva' : 'Nova Conversa'}
          </div>
        </div>
        
        <p className="text-[10px] text-center text-slate-600 mt-3 uppercase font-black tracking-widest flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          IA Conectada • Histórico em Nuvem • Finanças Pro Invest
        </p>
      </div>
    </div>
  );
};

export default AiAdvisor;