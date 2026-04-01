import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useAiAgent } from '../../../hooks/useAiAgent';
import { useSubscriptionAccess } from '../../../hooks/useSubscriptionAccess';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Send,
  PlusCircle,
  Folder,
  Cpu,
  Activity,
  X,
  Trash2,
  Lock,
  AlertTriangle,
  LayoutDashboard,
  TrendingUp,
  Target,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  saveChatHistory,
  loadUserChatHistory,
  updateChatHistory,
  deleteChatHistory,
  type ChatHistoryItem
} from '../../../services/chatHistoryService';
import { Preferences } from '@capacitor/preferences';

interface AiAdvisorProps {
  transactions: any[];
  currentCalcResult: any[];
  goals: any[];
  assets?: any[];
  passives?: any[];
  currentTool: string;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isIntro?: boolean;
  isSpecialIntro?: boolean;
  isGuided?: boolean;
}

const formatMarkdown = (text: string) => {
  return text.split('\n').map((line, i) => {
    const formattedLine = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={j} className="font-black text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    return (
      <p key={i} className={line.trim().startsWith('•') ? 'ml-2 mb-1' : 'mb-3'}>
        {formattedLine}
      </p>
    );
  });
};

const HUB_ACTIONS = [
  {
    group: 'Dívidas',
    color: 'border-rose-200 bg-rose-50',
    headerColor: 'text-rose-700 bg-rose-100 border-rose-200',
    icon: <AlertTriangle size={14} className="text-rose-600" />,
    actions: [
      'Qual dívida devo atacar primeiro?',
      'Gere meu plano detalhado para sair das dívidas',
      'O que devo fazer nos próximos 7 dias para sair do sufoco?',
      'Quanto estou pagando de juros sem perceber?'
    ]
  },
  {
    group: 'Organização do mês',
    color: 'border-sky-200 bg-sky-50',
    headerColor: 'text-sky-700 bg-sky-100 border-sky-200',
    icon: <LayoutDashboard size={14} className="text-sky-600" />,
    actions: [
      'Onde estou gastando mais do que deveria?',
      'Monte um orçamento realista para mim',
      'Como aumentar minha sobra mensal?',
      'Quais gastos devo cortar primeiro?'
    ]
  },
  {
    group: 'Patrimônio e investimentos',
    color: 'border-emerald-200 bg-emerald-50',
    headerColor: 'text-emerald-700 bg-emerald-100 border-emerald-200',
    icon: <TrendingUp size={14} className="text-emerald-600" />,
    actions: [
      'Analise meus investimentos e diga o que ajustar',
      'Meu patrimônio está produtivo ou parado?',
      'Como reequilibrar minha carteira?',
      'Estou exagerando no risco?'
    ]
  },
  {
    group: 'Liberdade financeira',
    color: 'border-amber-200 bg-amber-50',
    headerColor: 'text-amber-700 bg-amber-100 border-amber-200',
    icon: <Target size={14} className="text-amber-600" />,
    actions: [
      'O que mais atrasa minha liberdade financeira hoje?',
      'O que devo priorizar agora: quitar dívidas, reserva ou investir?',
      'Quanto precisaria investir por mês para acelerar meu patrimônio?'
    ]
  }
];

const SECTION_COLORS: Record<string, string> = {
  'diagnóstico':     'bg-slate-100 border-slate-300 text-slate-700',
  'interpretação':   'bg-sky-50 border-sky-200 text-sky-800',
  'plano de ação':   'bg-emerald-50 border-emerald-200 text-emerald-800',
  'próximos passos': 'bg-amber-50 border-amber-200 text-amber-800',
  'alertas':         'bg-rose-50 border-rose-200 text-rose-800',
};

const SECTION_ICONS: Record<string, string> = {
  'diagnóstico':     '🔍',
  'interpretação':   '💡',
  'plano de ação':   '📋',
  'próximos passos': '✅',
  'alertas':         '⚠️',
};

const formatGuidedResponse = (text: string) => {
  const sectionKeys = Object.keys(SECTION_COLORS);
  const regex = new RegExp(
    `\\*{0,2}(${sectionKeys.join('|')})\\*{0,2}[:\\s]*`,
    'gi'
  );

  const parts = text.split(regex).filter(Boolean);
  const blocks: { title: string; content: string }[] = [];

  for (let i = 0; i < parts.length; i++) {
    const lower = parts[i].toLowerCase().trim();
    if (sectionKeys.includes(lower)) {
      blocks.push({ title: lower, content: parts[i + 1]?.trim() || '' });
      i++;
    }
  }

  if (blocks.length === 0) {
    return (
      <div className="text-sm text-slate-800 leading-relaxed">
        {formatMarkdown(text)}
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {blocks.map((block) => (
        <div
          key={block.title}
          className={`border rounded-xl p-4 ${SECTION_COLORS[block.title]}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span>{SECTION_ICONS[block.title]}</span>
            <span className="text-xs font-black uppercase tracking-widest">
              {block.title}
            </span>
          </div>
          <div className="text-sm leading-relaxed">{formatMarkdown(block.content)}</div>
        </div>
      ))}
    </div>
  );
};

const AiAdvisor: React.FC<AiAdvisorProps> = ({
  transactions = [],
  currentCalcResult = [],
  goals = [],
  assets = [],
  passives = [],
  currentTool
}) => {
  const { user } = useAuth();
  const { sendToNexus, isLoading: isAiLoading } = useAiAgent();
  const { isPro, isPremium } = useSubscriptionAccess();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [conversationHistory, setConversationHistory] = useState<ChatHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [dailyCount, setDailyCount] = useState(0);
  const [input, setInput] = useState('');
  const [hubVisible, setHubVisible] = useState(true);
  const hasProcessedRef = useRef(false);
  const isFromHubRef = useRef(false);

  const FREE_DAILY_LIMIT = 5;

  const getUserName = () => {
    if (user?.displayName) return user.displayName.split(' ')[0];
    const emailName = user?.email ? user.email.split('@')[0] : 'Investidor';
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  };

  const capitalizedName = getUserName();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      isIntro: true,
      text: `=== NEXUS CONSULTOR ===\nUsuário: ${capitalizedName}\nStatus: Conexão Segura Ativa`,
      timestamp: new Date()
    }
  ]);

  const handleSend = useCallback(async (customText?: unknown) => {
    const rawValue =
      typeof customText === 'string'
        ? customText
        : typeof input === 'string'
        ? input
        : '';

    const textToSend = rawValue.trim();
    if (!textToSend || isAiLoading || !user) return;

    if (!isPro && !isPremium && dailyCount >= FREE_DAILY_LIMIT) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: '**LIMITE DIÁRIO ATINGIDO**\n\nAtualize para o plano Pro para continuar.',
          timestamp: new Date()
        }
      ]);
      return;
    }

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', text: textToSend, timestamp: new Date() }
    ];

    setMessages(newMessages);
    setInput('');
    await incrementDailyCount();

    const response = await sendToNexus(
      textToSend,
      {
        transactions,
        simulations: currentCalcResult,
        goals,
        assets,
        passives,
        currentTool
      },
      capitalizedName,
      newMessages
        .filter((m) => !m.isIntro)
        .map((m) => ({ role: m.role, text: m.text })),
      newMessages.length === 2
    );

    if (response) {
      const updatedWithAi: Message[] = [
        ...newMessages,
        { role: 'ai', text: response.answer, timestamp: new Date(), isGuided: isFromHubRef.current }
      ];
      isFromHubRef.current = false;

      setMessages(updatedWithAi);

      if (!currentChatId) {
        await saveToHistory(`Análise: ${textToSend.substring(0, 20)}...`, updatedWithAi);
      } else {
        await updateCurrentChat(updatedWithAi);
      }
    }
  }, [
    input,
    isAiLoading,
    user,
    messages,
    dailyCount,
    isPro,
    isPremium,
    transactions,
    currentCalcResult,
    goals,
    assets,
    passives,
    currentTool,
    capitalizedName,
    currentChatId,
    sendToNexus
  ]);

  useEffect(() => {
    const state = location.state as { initialPrompt?: string } | null;
    if (state?.initialPrompt && !hasProcessedRef.current && user) {
      hasProcessedRef.current = true;
      setHubVisible(false);
      setInput(state.initialPrompt);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'Sua pergunta do curso de dívidas já está aqui. Clique em "Enviar" para ver a resposta do Nexus, ou sinta-se à vontade para editar antes de enviar.',
          timestamp: new Date(),
          isSpecialIntro: true
        }
      ]);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [
    location.state,
    user,
    location.pathname,
    navigate
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading]);

  useEffect(() => {
    const checkLimit = async () => {
      if (!user?.uid) return;
      const today = new Date().toISOString().split('T')[0];
      const { value } = await Preferences.get({
        key: `nexus_count_${user.uid}_${today}`
      });
      setDailyCount(value ? parseInt(value) : 0);
    };

    checkLimit();
  }, [user]);

  const incrementDailyCount = async () => {
    if (isPro || isPremium) return;
    const today = new Date().toISOString().split('T')[0];
    const newCount = dailyCount + 1;
    setDailyCount(newCount);
    await Preferences.set({
      key: `nexus_count_${user?.uid}_${today}`,
      value: newCount.toString()
    });
  };

  const refreshHistory = async () => {
    if (!user?.uid) return;

    try {
      const history = await loadUserChatHistory(user.uid);
      let daysLimit = 3;

      if (isPremium) daysLimit = 90;
      else if (isPro) daysLimit = 30;

      const cutoff = Date.now() - daysLimit * 24 * 60 * 60 * 1000;
      setConversationHistory(history.filter((item) => item.createdAt > cutoff));
    } catch (e) {}
  };

  useEffect(() => {
    refreshHistory();
  }, [user, isPro, isPremium]);

  const loadFromHistory = async (historyItem: ChatHistoryItem) => {
    if (!user?.uid) return;

    const loadedMessages: Message[] = historyItem.messages.map((msg) => ({
      role: msg.role as 'user' | 'ai',
      text: msg.text,
      timestamp: new Date(msg.timestamp)
    }));

    setMessages(loadedMessages);
    setCurrentChatId(historyItem.id || null);
    setIsHistoryOpen(false);
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();

    if (window.confirm('Excluir esta conversa?')) {
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
      messages: messagesToSave.map((msg) => ({
        role: msg.role,
        text: msg.text,
        timestamp: msg.timestamp.getTime()
      })),
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      toolContext: currentTool
    };

    const newChatId = await saveChatHistory(user.uid, historyItem);
    setCurrentChatId(newChatId);
    await refreshHistory();
  };

  const updateCurrentChat = async (updatedMessages: Message[]) => {
    if (!currentChatId || !user?.uid) return;

    await updateChatHistory(user.uid, currentChatId, {
      messages: updatedMessages.map((msg) => ({
        role: msg.role,
        text: msg.text,
        timestamp: msg.timestamp.getTime()
      })),
      lastUpdated: Date.now()
    });
  };

  const startNewConversation = () => {
    setCurrentChatId(null);
    setHubVisible(true);
    setMessages([
      {
        role: 'ai',
        isIntro: true,
        text: `=== NEXUS CONSULTOR ===\nUsuário: ${capitalizedName}\nStatus: Conexão Segura Ativa`,
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-white relative font-sans">
      <div className="flex items-center justify-between p-4 border-b border-slate-300 bg-white/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-100 rounded-lg border border-sky-300 shadow-sm">
            <Cpu size={18} className="text-sky-700" />
          </div>

          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tighter">
              Nexus Core v2.5
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-widest">
                Active
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {!isPro && !isPremium && (
            <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full border border-slate-300 shadow-sm">
              <span className="text-[10px] text-slate-700 font-bold">
                Free: {FREE_DAILY_LIMIT - dailyCount} r.
              </span>
            </div>
          )}

          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="p-2 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-all"
          >
            <Folder size={20} />
          </button>

          <button
            onClick={startNewConversation}
            className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
          >
            <PlusCircle size={20} />
          </button>
        </div>
      </div>
      {hubVisible ? (
        <div className="flex-grow overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50">
          <div className="max-w-2xl mx-auto py-4">

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-sky-600" />
                <span className="text-xs font-bold text-sky-700 uppercase tracking-widest">
                  Nexus Guiado
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Olá, {capitalizedName}. O que você quer resolver agora?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Escolha uma ação ou escreva sua pergunta no campo abaixo.
              </p>
            </div>

            <div className="space-y-4">
              {HUB_ACTIONS.map((group) => (
                <div
                  key={group.group}
                  className={`border rounded-2xl overflow-hidden ${group.color}`}
                >
                  <div
                    className={`flex items-center gap-2 px-4 py-2.5 border-b ${group.headerColor}`}
                  >
                    {group.icon}
                    <span className="text-xs font-black uppercase tracking-widest">
                      {group.group}
                    </span>
                  </div>
                  <div className="divide-y divide-white/60">
                    {group.actions.map((action) => (
                      <button
                        key={action}
                        type="button"
                        disabled={isAiLoading}
                        onClick={() => {
                          isFromHubRef.current = true;
                          setHubVisible(false);
                          handleSend(action);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-slate-800 hover:bg-white/70 active:bg-white transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>{action}</span>
                        <ChevronRight
                          size={14}
                          className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0 ml-2"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-slate-400 mt-6 pb-2">
              Ou use o campo de texto abaixo para uma pergunta livre
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar bg-slate-50">
          {messages.filter((msg) => !msg.isIntro).map((msg: Message, i: number) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.isIntro ? (
                <div className="w-full max-w-lg bg-white border border-slate-300 rounded-3xl p-6 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent"></div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-300">
                      <span className="text-[10px] text-slate-600 font-bold uppercase">Usuário</span>
                      <span className="text-xs text-slate-900 font-mono font-semibold">
                        {capitalizedName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-300">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase">Status</span>
                      <div className="flex items-center gap-2">
                        <Activity size={12} className="text-emerald-600" />
                        <span className="text-xs text-emerald-700 font-mono font-bold">
                          CONNECTED
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : msg.isSpecialIntro ? (
                <div className="w-full max-w-lg bg-sky-50 border border-sky-300 rounded-2xl p-4 shadow-md text-center">
                  <p className="text-sm text-sky-800 leading-relaxed font-medium">{msg.text}</p>
                </div>
              ) : (
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'max-w-[85%] bg-sky-600 text-white rounded-tr-none'
                      : msg.isGuided
                      ? 'w-full bg-white rounded-tl-none border border-slate-200'
                      : 'max-w-[85%] bg-white text-slate-800 rounded-tl-none border border-slate-300'
                  }`}
                >
                  <div className="markdown-container">
                    {msg.isGuided ? formatGuidedResponse(msg.text) : formatMarkdown(msg.text)}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isAiLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-sm flex items-center gap-3">
                <span className="text-[10px] text-slate-700 font-black uppercase tracking-widest animate-pulse">
                  Analisando dados...
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      )}




























      <div className="p-4 md:p-6 bg-white border-t border-slate-300">
        <div className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              !isPro && !isPremium && dailyCount >= FREE_DAILY_LIMIT
                ? 'Limite diário atingido.'
                : 'Pergunte ao Nexus...'
            }
            disabled={!isPro && !isPremium && dailyCount >= FREE_DAILY_LIMIT}
            className="w-full bg-white border border-slate-300 text-slate-900 p-4 pr-14 rounded-2xl outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all text-sm placeholder:text-slate-500 disabled:opacity-50 shadow-sm"
          />

          <button
            onClick={handleSend}
            disabled={
              isAiLoading ||
              !input.trim() ||
              (!isPro && !isPremium && dailyCount >= FREE_DAILY_LIMIT)
            }
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-sky-600 text-white rounded-xl active:scale-90 transition-all disabled:opacity-50 shadow-sm hover:bg-sky-700"
          >
            {!isPro && !isPremium && dailyCount >= FREE_DAILY_LIMIT ? (
              <Lock size={18} />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>

      {isHistoryOpen && (
        <div className="absolute inset-0 z-50 bg-slate-900/20 backdrop-blur-sm">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-50 border-l border-slate-300 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
            <div className="p-6 border-b border-slate-300 flex justify-between items-center bg-white">
              <h4 className="text-slate-900 font-black text-xs uppercase tracking-widest">
                Suas Conversas
              </h4>

              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {conversationHistory.length === 0 ? (
                <p className="text-slate-500 text-xs text-center mt-10 italic">
                  Nenhuma conversa encontrada.
                </p>
              ) : (
                conversationHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className={`p-4 border rounded-2xl cursor-pointer group transition-all relative flex justify-between items-center shadow-sm ${
                      currentChatId === item.id
                        ? 'border-sky-500 bg-sky-100'
                        : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex-grow overflow-hidden mr-2">
                      <p className="text-slate-900 font-bold text-sm truncate group-hover:text-slate-950">
                        {item.title}
                      </p>
                      <p className="text-[9px] text-slate-600 mt-1 uppercase font-bold tracking-tighter">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDeleteChat(e, item.id!)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
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
