
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserMenuProps {
  onOpenChangePassword: () => void;
  onNavigateSettings: () => void;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onOpenChangePassword, onNavigateSettings, onLogout }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu se clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  // Iniciais do e-mail
  const initials = user.email.substring(0, 2).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all p-1 pr-3 group"
        title="Menu do Usuário"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-xs shadow-md group-hover:shadow-emerald-500/20">
            {initials}
        </div>
        <span className="hidden sm:block text-xs font-medium text-slate-300 max-w-[100px] truncate">
            {user.email}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
           <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/30">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Conta</p>
              <p className="text-sm text-white font-medium truncate mt-1" title={user.email}>{user.email}</p>
           </div>
           
           <div className="p-1">
              <button 
                onClick={() => { setIsOpen(false); onNavigateSettings(); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-colors flex items-center gap-2"
              >
                 <span className="text-lg">⚙️</span> Configurações
              </button>
              
              <button 
                onClick={() => { setIsOpen(false); onLogout(); }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/10 hover:text-red-300 rounded-lg transition-colors flex items-center gap-2 mt-1"
              >
                 <span className="text-lg">🚪</span> Sair
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
