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
  <footer className="bg-white border-t border-slate-200 py-16 px-6">
    <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
      <div className="md:col-span-4 space-y-4">
        <div className="flex items-center gap-3">
          <img src="/icon.png" alt="Logo" className="w-8 h-8 rounded-lg grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all" />
          <span className="text-sm font-black tracking-tighter text-slate-900 uppercase">Finanças Pro Invest</span>
        </div>
        <p className="text-slate-600 text-xs leading-relaxed max-w-xs font-medium">
          {heroPersona === 'dividas'
            ? 'Ferramentas para entender dívidas, organizar prioridades e retomar o controle com mais clareza.'
            : 'A plataforma definitiva para organizar seu patrimônio e alcançar a liberdade financeira com método.'}
        </p>
        <div className="flex gap-4 text-slate-500 pt-2">
          <Instagram size={18} className="hover:text-emerald-500 cursor-pointer transition-colors" />
          <Linkedin size={18} className="hover:text-emerald-500 cursor-pointer transition-colors" />
          <Mail size={18} className="hover:text-emerald-500 cursor-pointer transition-colors" />
        </div>
      </div>

      <div className="md:col-span-2 md:col-start-7">
        <h4 className="text-slate-700 font-black text-[10px] uppercase tracking-widest mb-4">Navegação</h4>
        <ul className="space-y-2 text-slate-600 text-xs font-bold">
          <li><button onClick={() => onNavigate('tool-dividas')} className="hover:text-emerald-600 transition-colors">Começar diagnóstico</button></li>
          <li>
            <button
              onClick={() => document.getElementById('secao-cursos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="hover:text-emerald-600 transition-colors"
            >
              Ver cursos
            </button>
          </li>
          <li><button onClick={() => isAuthenticated ? onNavigate('manager') : onStartNow()} className="hover:text-emerald-600 transition-colors">Entrar na minha área</button></li>
          <li><button onClick={() => onNavigate('tool-juros')} className="hover:text-emerald-600 transition-colors">Entender os juros</button></li>
        </ul>
      </div>

      <div className="md:col-span-2">
        <h4 className="text-slate-700 font-black text-[10px] uppercase tracking-widest mb-4">Legal</h4>
        <ul className="space-y-2 text-slate-600 text-xs font-bold">
          <li><button onClick={() => setActiveInfoModal('termos')} className="hover:text-slate-900 transition-colors">Termos de Uso</button></li>
          <li><button onClick={() => setActiveInfoModal('seguranca')} className="hover:text-slate-900 transition-colors">Privacidade</button></li>
          <li><button onClick={() => setActiveInfoModal('quem-somos')} className="hover:text-slate-900 transition-colors">Sobre Nós</button></li>
        </ul>
      </div>

      <div className="md:col-span-2">
        <h4 className="text-slate-700 font-black text-[10px] uppercase tracking-widest mb-4">Suporte</h4>
        <ul className="space-y-2 text-slate-600 text-xs font-bold">
          <li><button onClick={() => setActiveInfoModal('ajuda')} className="hover:text-slate-900 transition-colors">Central de Ajuda</button></li>
          <li><button onClick={() => setActiveInfoModal('especialista')} className="hover:text-emerald-600 transition-colors">Fale Conosco</button></li>
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