"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AuthContext_1 = require("../contexts/AuthContext");
const useFirebase_1 = require("../hooks/useFirebase");
const AiChatPage = ({ onNavigate }) => {
    const { user } = (0, AuthContext_1.useAuth)();
    const { lancamentos, userMeta } = (0, useFirebase_1.useFirebase)(user?.uid);
    return className = "mt-16 h-[calc(100vh-64px)] bg-[#020617] flex flex-col items-center justify-center p-0 md:p-4 overflow-hidden font-sans" >
        className;
    "w-full max-w-7xl h-full flex flex-col md:flex-row gap-4" >
        { /* Lado Esquerdo: Sidebar */}
        < div;
    className = "hidden md:flex flex-col w-64 lg:w-80 p-6 space-y-6 animate-in slide-in-from-left duration-500" >
        className;
    "text-3xl font-black text-white leading-tight mb-2" >
        Nexus < span;
    className = "text-sky-500" > AI < /span>
        < /h1>
        < p;
    className = "text-slate-400 text-xs font-medium" >
        Consultor;
    de;
    Inteligência;
    Financeira
        < /p>
        < /div>
        < div;
    className = "space-y-4" >
        className;
    "p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl" >
        className;
    "flex items-center gap-2 text-sky-400 font-bold text-[10px] uppercase tracking-widest mb-2" >
        size;
    {
        14;
    }
    /> Histórico de Conversas
        < /div>
        < p;
    className = "text-slate-400 text-[11px] leading-relaxed" >
        Para;
    ver;
    suas;
    conversas;
    anteriores, clique;
    no;
    ícone;
    da ** pasta;
     ** no;
    topo;
    do
        chat.
            < /p>
            < /div>;
    while ({ /* ✅ CAIXA DE AVISO LEGAL (REQUERIDO) */}
        < div);
    className = "p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl" >
        className;
    "flex items-center gap-2 text-amber-500 font-bold text-[10px] uppercase tracking-widest mb-2" >
        size;
    {
        14;
    }
    /> Aviso Importante
        < /div>
        < p;
    className = "text-slate-400 text-[10px] leading-relaxed italic" >
        O;
    Nexus;
    utiliza;
    Inteligência;
    Artificial.Embora;
    busquemos;
    precisão;
    com;
    dados;
    em;
    tempo;
    real, o;
    sistema;
    pode;
    cometer;
    erros.Verifique;
    informações;
    críticas.Nenhuma;
    resposta;
    constitui;
    recomendação;
    direta;
    de;
    investimento.
        < /p>
        < /div>
        < div;
    className = "bg-slate-900/50 p-4 rounded-xl border border-slate-800" >
        className;
    "flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest mb-1" >
        className;
    "w-2 h-2 rounded-full bg-emerald-500 animate-pulse" > /span> Sistema Ativo
        < /div>
        < p;
    className = "text-slate-300 text-[11px]" >
        Analisando;
    {
        lancamentos.length;
    }
    lançamentos;
    de < span;
    className = "text-white" > { userMeta, nickname } || 'sua conta';
};
/span>.
    < /p>
    < /div>
    < /div>
    < div;
className = "mt-auto space-y-2" >
    onClick;
{
    () => onNavigate('manager');
}
className = "w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
    >
;
Voltar;
ao;
Gerenciador
    < /button>
    < p;
className = "text-[9px] text-slate-600 text-center uppercase tracking-tighter" >
    Finanças;
Pro;
Invest;
2026
    < /p>
    < /div>
    < /div>;
{ /* Lado Direito: Chat Principal */ }
className;
"flex-grow h-full w-full relative" >
    className;
"absolute inset-0 md:relative md:h-full bg-slate-900/50 border-0 md:border md:border-slate-800 md:rounded-3xl overflow-hidden shadow-2xl" >
    transactions;
{
    lancamentos;
}
currentCalcResult = { null:  };
goals = { []:  };
currentTool = "chat_web"
    /  >
    /div>
    < /div>
    < /div>
    < /div>;
;
;
exports.default = AiChatPage;
//# sourceMappingURL=index.js.map