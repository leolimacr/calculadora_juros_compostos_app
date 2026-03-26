import React from 'react';
import { Calculator, Bot, Copy } from 'lucide-react';
import { useNavigation } from '../../../../hooks/useNavigation';

interface Props {
  tool: 'debt-calculator' | 'nexus-ai' | 'budget-tool';
  title: string;
  content: string;
  buttonLabel: string;
  buttonHref?: string;
  prompt?: string;
}

const toolConfig = {
  'debt-calculator': {
    icon: <Calculator size={18} className="text-violet-500 shrink-0" />,
    bg: 'bg-violet-50 border-violet-200',
    titleColor: 'text-violet-700',
    btnClass:
      'bg-violet-600 hover:bg-violet-700 text-white',
    // App renderiza esta ferramenta como `currentTool === 'tool-dividas'`
    defaultTargetTool: 'tool-dividas',
  },
  'nexus-ai': {
    icon: <Bot size={18} className="text-sky-500 shrink-0" />,
    bg: 'bg-sky-50 border-sky-200',
    titleColor: 'text-sky-700',
    btnClass: 'bg-sky-600 hover:bg-sky-700 text-white',
    // App renderiza esta ferramenta como `currentTool === 'chat'`
    defaultTargetTool: 'chat',
  },
  'budget-tool': {
    icon: <Calculator size={18} className="text-teal-500 shrink-0" />,
    bg: 'bg-teal-50 border-teal-200',
    titleColor: 'text-teal-700',
    btnClass: 'bg-teal-600 hover:bg-teal-700 text-white',
    // Mapeamento para o Gerenciador Financeiro (Dashboard/Budget).
    defaultTargetTool: 'manager',
  },
};

const ToolCTA: React.FC<Props> = ({
  tool,
  title,
  content,
  buttonLabel,
  buttonHref,
  prompt,
}) => {
  
  const { navigateTo } = useNavigation();
  const config = toolConfig[tool];

  // se o tool vindo do bloco for inválido, usa 'debt-calculator' como padrão
  const safeConfig = config ?? toolConfig['debt-calculator'];

  const normalizeTargetTool = (value?: string, fallback?: string) => {
    const raw = value ?? fallback ?? '';
    if (!raw) return raw;
    return raw.startsWith('/') ? raw.slice(1) : raw;
  };

  const targetTool = normalizeTargetTool(buttonHref, safeConfig.defaultTargetTool);
  const copyPrompt = () => {
    if (prompt) navigator.clipboard.writeText(prompt);
  };

  return (
    <div
      className={`mb-5 border rounded-xl p-4 ${safeConfig.bg}`}
    >
      <div className="flex items-start gap-2 mb-2">
        {safeConfig.icon}
        <p className={`text-sm font-semibold ${safeConfig.titleColor}`}>{title}</p>
      </div>
      <p className="text-sm text-slate-600 mb-3 leading-relaxed">{content}</p>
      {prompt && (
        <div className="bg-white border border-slate-200 rounded-lg p-3 mb-3 relative">
          <p className="text-xs text-slate-500 italic leading-relaxed pr-6">
            {prompt}
          </p>
          <button
            onClick={copyPrompt}
            title="Copiar prompt"
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
          >
            <Copy size={14} />
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() =>
          navigateTo(targetTool, prompt ? { initialPrompt: prompt } : undefined)
        }
        className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${safeConfig.btnClass}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default ToolCTA;
