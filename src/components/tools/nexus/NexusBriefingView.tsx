import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useAiAgent } from '../../../hooks/useAiAgent';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Brain,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { NEXUS_COPY } from '../../../theme/fpiVoiceGuide';
import type { Transaction, ActiveAsset, PassiveAsset } from '../../../types';
import type { DebtItem } from '../../../services/debt/debt.types';
import type { Goal } from '../../../services/goalService';

const SECTION_COLORS: Record<string, string> = {
  'diagnóstico':     'bg-slate-50 border-slate-200 text-slate-700',
  'interpretação':   'bg-sky-50 border-sky-200 text-sky-800',
  'plano de ação':   'bg-emerald-50 border-emerald-200 text-emerald-800',
  'próximos passos': 'bg-amber-50 border-amber-200 text-amber-800',
  'alertas':         'bg-rose-50 border-rose-200 text-rose-800',
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'diagnóstico':     <Brain size={16} />,
  'interpretação':   <Sparkles size={16} />,
  'plano de ação':   <Zap size={16} />,
  'próximos passos': <CheckCircle2 size={16} />,
  'alertas':         <AlertCircle size={16} />,
};

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

const NexusBriefingView: React.FC<{
  transactions: Transaction[];
  goals: Goal[];
  assets?: ActiveAsset[];
  passives?: PassiveAsset[];
  debts?: DebtItem[];
}> = ({ transactions, goals, assets, passives, debts }) => {
  const { user } = useAuth();
  const { sendToNexus, isLoading } = useAiAgent();
  const location = useLocation();
  const navigate = useNavigate();

  const [briefing, setBriefing] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);

  const userName = useMemo(() => {
    if (user?.displayName) return user.displayName.split(' ')[0];
    return user?.email?.split('@')[0] || 'Investidor';
  }, [user]);

  const initialPrompt = (location.state as { initialPrompt?: string } | null)?.initialPrompt;

  useEffect(() => {
    if (!initialPrompt) {
        navigate('/app/central');
        return;
    }

    const fetchBriefing = async () => {
      const response = await sendToNexus(
        `[PROTOCOL: STRATEGIC_BRIEFING] ${initialPrompt}. 
        IMPORTANTE: Sua resposta deve ser estruturada em blocos: Diagnóstico, Interpretação, Plano de Ação, Próximos Passos. 
        ${NEXUS_COPY.briefingVoiceHint}
        Ao final da resposta, sugira EXATAMENTE 3 opções de próximos passos curtas entre colchetes, ex: ${NEXUS_COPY.briefingCtaExamples}.`,
        { transactions, goals, assets, passives, debts },
        userName,
        [],
        true
      );

      if (response) {
        // Parse briefing and options
        let text = response.answer;
        const optionsMatch = text.match(/\[(.*?)\]/g);
        const cleanOptions = optionsMatch ? optionsMatch.map(o => o.slice(1, -1)) : [];
        const cleanText = text.replace(/\[(.*?)\]/g, '').trim();

        setBriefing(cleanText);
        setOptions(cleanOptions);
      }
    };

    fetchBriefing();
    // Intencional: briefing único por montagem com o prompt inicial.
    // Incluir as dependências de dados re-dispararia o LLM a cada atualização.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  const handleOptionClick = async (option: string) => {
      // In a briefing, even a click on an option triggers a new briefing or navigation
      // For now, let's just send the text as a new prompt
      setBriefing(null);
      const response = await sendToNexus(
        `O usuário escolheu a opção: ${option}. Continue o briefing estratégico.`,
        { transactions, goals, assets, passives, debts },
        userName,
        [{ role: 'ai', text: briefing ?? '' }],
        false
      );

      if (response) {
        let text = response.answer;
        const optionsMatch = text.match(/\[(.*?)\]/g);
        const cleanOptions = optionsMatch ? optionsMatch.map(o => o.slice(1, -1)) : [];
        const cleanText = text.replace(/\[(.*?)\]/g, '').trim();

        setBriefing(cleanText);
        setOptions(cleanOptions);
      }
  };

  const renderBlocks = (text: string) => {
    const sectionKeys = Object.keys(SECTION_COLORS);
    const regex = new RegExp(`\\*{0,2}(${sectionKeys.join('|')})\\*{0,2}[:\\s]*`, 'gi');
    const parts = text.split(regex).filter(Boolean);
    const blocks: { title: string; content: string }[] = [];

    for (let i = 0; i < parts.length; i++) {
      const lower = parts[i].toLowerCase().trim();
      if (sectionKeys.includes(lower)) {
        blocks.push({ title: lower, content: parts[i + 1]?.trim() || '' });
        i++;
      }
    }

    if (blocks.length === 0) return <div className="p-6 bg-white rounded-[2rem] border border-slate-200">{formatMarkdown(text)}</div>;

    return (
      <div className="space-y-6">
        {blocks.map((block) => (
          <div key={block.title} className={`border rounded-[2rem] p-8 shadow-sm ${SECTION_COLORS[block.title]}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                {SECTION_ICONS[block.title]}
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em]">
                {block.title}
              </span>
            </div>
            <div className="text-base leading-relaxed">{formatMarkdown(block.content)}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-violet-500" />
          <h1 className="text-sm font-black uppercase tracking-widest text-slate-900">Nexus Briefing</h1>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="max-w-3xl mx-auto w-full px-6 py-10">
        <div className="mb-10 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2 italic">
                Olá, {userName}.
            </h2>
            <p className="text-slate-500 font-medium">{NEXUS_COPY.briefingSubtitle}</p>
        </div>

        {isLoading && !briefing ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="relative">
                <div className="w-16 h-16 border-4 border-violet-100 border-t-violet-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-violet-500">
                    <Sparkles size={24} className="animate-pulse" />
                </div>
             </div>
             <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Processando Inteligência...</p>
          </div>
        ) : briefing && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {renderBlocks(briefing)}

            <div className="mt-12 space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center mb-6">Qual seu próximo passo?</p>
               <div className="flex flex-col gap-3">
                 {options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(option)}
                      disabled={isLoading}
                      className="w-full group flex items-center justify-between p-5 bg-white hover:bg-slate-900 border border-slate-200 rounded-2xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
                    >
                      <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors">{option}</span>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                 ))}
                 <button
onClick={() => navigate('/app/central')}

className="w-full p-5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-600 transition-colors"
                  >
                    Encerrar Briefing e Voltar
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NexusBriefingView;
