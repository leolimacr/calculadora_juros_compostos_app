
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthLogin from './AuthLogin';
import AuthRegister from './AuthRegister';

const LockedManager: React.FC = () => {
  const { hasLocalUser } = useAuth();
  // Se já tem usuário, padrão é Login. Se não, padrão é Registro.
  const [view, setView] = useState<'login' | 'register'>(hasLocalUser ? 'login' : 'register');

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
       <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
          {/* Background Decor */}
          <div className="absolute top-0 right-0 p-24 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
          
          <div className="relative z-10">
            {view === 'login' ? (
                <AuthLogin 
                    onSuccess={() => {/* AuthContext atualiza estado e App.tsx renderiza o Dashboard automaticamente */}} 
                    onSwitchToRegister={() => setView('register')}
                />
            ) : (
                <AuthRegister 
                    onSuccess={() => {/* Mesmo fluxo */}}
                    onSwitchToLogin={() => setView('login')}
                />
            )}
          </div>
       </div>
       
       <p className="mt-8 text-center text-slate-500 text-xs max-w-sm">
          <strong>Por que preciso logar?</strong> Para garantir que apenas você veja seus dados financeiros neste dispositivo.
       </p>
    </div>
  );
};

export default LockedManager;
