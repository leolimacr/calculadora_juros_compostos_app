import React, { useState } from 'react';

interface FooterProps {
  onNavigate?: (tool: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      alert(`Obrigado por se inscrever! Enviaremos novidades para: ${email}`);
      setEmail('');
    } else {
      alert('Por favor, digite um email válido.');
    }
  };

  const handleNav = (tool: string) => {
    if (onNavigate) {
      onNavigate(tool);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-slate-800 bg-[#0f172a] pt-20 pb-8 no-print">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Coluna 1: Marca & Newsletter */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">FP</div>
               <h4 className="font-bold text-white text-lg">Finanças<span className="text-emerald-500">Pro</span></h4>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Sua bússola para a liberdade financeira. Ferramentas precisas e educação sem enrolação.
            </p>
            
            <div className="pt-4">
              <h5 className="text-white font-bold text-sm mb-3">Fique Atualizado</h5>
              <p className="text-xs text-slate-500 mb-3">Receba tips de finanças direto na sua caixa de entrada.</p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com" 
                  className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                  Inscrever
                </button>
              </form>
            </div>
          </div>

          {/* Coluna 2: Ferramentas */}
          <div>
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">Ferramentas</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><button onClick={() => handleNav('compound')} className="hover:text-emerald-400 transition-colors text-left">Simulador de Juros Compostos</button></li>
              <li><button onClick={() => handleNav('manager')} className="hover:text-emerald-400 transition-colors text-left">Gerenciador Financeiro</button></li>
              <li><button onClick={() => handleNav('fire')} className="hover:text-emerald-400 transition-colors text-left">Calculadora FIRE</button></li>
              <li><button onClick={() => handleNav('rent')} className="hover:text-emerald-400 transition-colors text-left">Aluguel vs Financiamento</button></li>
              <li><button onClick={() => handleNav('debt')} className="hover:text-emerald-400 transition-colors text-left">Otimizador de Dívidas</button></li>
              <li><button onClick={() => handleNav('roi')} className="hover:text-emerald-400 transition-colors text-left">Calculadora de ROI</button></li>
            </ul>
          </div>

          {/* Coluna 3: Conteúdo */}
          <div>
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">Academia & Conteúdo</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><button onClick={() => handleNav('education')} className="hover:text-emerald-400 transition-colors text-left">Blog Oficial</button></li>
              <li><button onClick={() => handleNav('education')} className="hover:text-emerald-400 transition-colors text-left">Guias para Iniciantes</button></li>
              <li><button onClick={() => handleNav('education')} className="hover:text-emerald-400 transition-colors text-left">Psicologia do Dinheiro</button></li>
              <li><button onClick={() => handleNav('game')} className="hover:text-emerald-400 transition-colors text-left">Simulador O Sobrevivente</button></li>
              <li><button onClick={() => handleNav('inflation')} className="hover:text-emerald-400 transition-colors text-left">Poder de Compra</button></li>
            </ul>
          </div>

          {/* Coluna 4: Empresa */}
          <div>
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">Institucional</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><button className="hover:text-emerald-400 transition-colors text-left">Sobre Nós</button></li>
              <li><button className="hover:text-emerald-400 transition-colors text-left">Contato</button></li>
              <li><button className="hover:text-emerald-400 transition-colors text-left">Política de Privacidade</button></li>
              <li><button className="hover:text-emerald-400 transition-colors text-left">Termos de Uso</button></li>
              <li><button className="hover:text-emerald-400 transition-colors text-left">Feedback & Sugestões</button></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Finanças Pro Invest. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
             <button className="text-slate-600 hover:text-white transition-colors"><span className="sr-only">Instagram</span>📷</button>
             <button className="text-slate-600 hover:text-white transition-colors"><span className="sr-only">Twitter</span>🐦</button>
             <button className="text-slate-600 hover:text-white transition-colors"><span className="sr-only">LinkedIn</span>💼</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;