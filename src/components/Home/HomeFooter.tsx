import React from 'react';
import { Instagram, Linkedin, Mail } from 'lucide-react';

interface Props {
  heroPersona: 'dividas' | 'patrimonio';
  isAuthenticated: boolean;
  onNavigate: (route: string) => void;
  onStartNow: () => void;
  setActiveInfoModal: (m: string) => void;
}

export const HomeFooter: React.FC<Props> = ({
  heroPersona, isAuthenticated, onNavigate, onStartNow, setActiveInfoModal,
}) => (
  <footer className="bg-surface-secondary text-slate-700 border-t border-slate-200 py-16 px-6 font-sans">
    <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
      <div className="md:col-span-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-base font-black tracking-widest text-slate-900 uppercase font-mono">FPI</span>
        </div>
        <p className="text-slate-500 text-xs leading-relaxed max-w-xs font-normal">
          {heroPersona === 'dividas'
            ? 'Ferramentas de precisão para mapear passivos, definir seu Saldo Livre Real e conquistar o comando do seu fluxo financeiro.'
            : 'O cockpit patrimonial definitivo. Controle seu Saldo Livre Real e decida com a clareza analítica do Nexus.'}
        </p>
        <div className="flex gap-4 text-slate-500 pt-2">
          <Instagram size={18} className="hover:text-blue-600 cursor-pointer transition-colors" />
          <Linkedin size={18} className="hover:text-blue-600 cursor-pointer transition-colors" />
          <Mail size={18} className="hover:text-blue-600 cursor-pointer transition-colors" />
        </div>
      </div>

      <div className="md:col-span-2 md:col-start-7">
        <h4 className="text-slate-900 font-bold text-[10px] uppercase tracking-widest mb-4">Navegação</h4>
        <ul className="space-y-2 text-slate-500 text-xs font-semibold">
          <li><button onClick={() => onNavigate('tool-dividas')} className="hover:text-blue-600 transition-colors">Diagnóstico Inicial</button></li>
          <li>
            <button
              onClick={() => document.getElementById('secao-cursos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="hover:text-blue-600 transition-colors"
            >
              Cursos & Estratégia
            </button>
          </li>
          <li><button onClick={() => isAuthenticated ? onNavigate('manager') : onStartNow()} className="hover:text-blue-600 transition-colors">Área de Comando</button></li>
          <li><button onClick={() => onNavigate('tool-juros')} className="hover:text-blue-600 transition-colors">Simular Multiplicação</button></li>
        </ul>
      </div>

      <div className="md:col-span-2">
        <h4 className="text-slate-900 font-bold text-[10px] uppercase tracking-widest mb-4">Regulação</h4>
        <ul className="space-y-2 text-slate-500 text-xs font-semibold">
          <li><button onClick={() => setActiveInfoModal('termos')} className="hover:text-blue-600 transition-colors">Termos de Uso</button></li>
          <li><button onClick={() => setActiveInfoModal('seguranca')} className="hover:text-blue-600 transition-colors">Políticas de Segurança</button></li>
          <li><button onClick={() => setActiveInfoModal('quem-somos')} className="hover:text-blue-600 transition-colors">A Filosofia FPI</button></li>
        </ul>
      </div>

      <div className="md:col-span-2">
        <h4 className="text-slate-900 font-bold text-[10px] uppercase tracking-widest mb-4">Apoio</h4>
        <ul className="space-y-2 text-slate-500 text-xs font-semibold">
          <li><button onClick={() => setActiveInfoModal('ajuda')} className="hover:text-blue-600 transition-colors">FAQ de Bússola</button></li>
          <li><button onClick={() => setActiveInfoModal('especialista')} className="hover:text-blue-600 transition-colors">Fale com Engenharia</button></li>
        </ul>
      </div>
    </div>

    <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-slate-200 text-center">
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
        © 2026 Finanças Pro Invest. Todos os direitos reservados.
      </p>
    </div>
  </footer>
);