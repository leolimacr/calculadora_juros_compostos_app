import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, ShieldCheck, ArrowRight, Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DownloadPage: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const apkUrl = '/download/FinancasProInvest.apk';
  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://financasproinvest.com.br/download';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Finanças Pro Invest',
          text: 'Estou usando o Finanças Pro Invest para organizar meu dinheiro e contas do mês com clareza. Baixe o app gratuito aqui:',
          url: shareUrl,
        });
      } catch {
        // usuário cancelou
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // fallback
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary text-slate-800 font-sans pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header do Convite */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <Smartphone size={14} className="text-emerald-600" />
            <span>Acesso Antecipado • Versão Android</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight">
            Baixe o <span className="text-emerald-600">Finanças Pro Invest</span> no seu celular
          </h1>

          <p className="text-sm md:text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
            Instale o aplicativo Android gratuito, crie sua conta e organize seu fluxo de caixa diário e compromissos com total clareza.
          </p>
        </div>

        {/* Card Principal de Download */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-soft space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0 p-1.5 overflow-hidden">
              <img src="/assets/images/brand/logo.png" alt="Finanças Pro Invest" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Finanças Pro Invest Android
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Arquivo de Instalação Direta (APK) • ~54 MB • Versão 1.0.0
              </p>
            </div>
          </div>

          {/* Botão de Download */}
          <a
            href={apkUrl}
            download="FinancasProInvest.apk"
            className="w-full py-4 px-6 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-widest shadow-floating active:scale-[0.99] transition-all flex items-center justify-center gap-3"
          >
            <Download size={20} className="text-emerald-400 animate-bounce" />
            <span>Baixar Aplicativo Android (.apk)</span>
          </a>

          {/* Instruções de Instalação */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">
              Como instalar em 2 passos simples:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-800">Baixe e Abra o Arquivo</p>
                  <p className="text-slate-500 leading-relaxed">
                    Clique no botão acima. Quando o download terminar, toque em <strong>Abrir</strong> na barra de notificações do seu celular.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-800">Autorize a Instalação</p>
                  <p className="text-slate-500 leading-relaxed">
                    Se o Android perguntar sobre "Fontes desconhecidas" ou "Permitir desta fonte", selecione <strong>Sim / Permitir</strong> e toque em <strong>Instalar</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-800">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>Aplicativo 100% seguro, verificado e compilado diretamente pelo ambiente oficial do Finanças Pro Invest.</span>
          </div>
        </div>

        {/* Card de Compartilhamento / Convidar Amigos */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Indique para um amigo
            </h4>
            <p className="text-xs text-slate-500">
              Envie o link de download direto pelo WhatsApp ou copie o link da página.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 sm:flex-initial py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
            >
              <Share2 size={15} />
              <span>Compartilhar</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 border border-slate-200"
              title="Copiar link"
            >
              {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Opção Alternativa: Usar pelo Navegador Web */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Prefere usar no navegador do computador ou celular? Acessar versão web</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
