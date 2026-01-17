import React, { useState } from 'react';
import { updateProfile, deleteUser } from 'firebase/auth';
import { ref, remove } from 'firebase/database';
import { auth, database } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';

const ProfilePage: React.FC<any> = ({ onNavigateHome }) => {
  const { user, logout } = useAuth();
  const { role } = useSubscriptionAccess();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);

  const handleSaveName = async () => {
    if (user && newName.trim()) {
        await updateProfile(user, { displayName: newName });
        setIsEditing(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm("TEM CERTEZA? Isso apagará todos os seus lançamentos permanentemente.");
    if (!confirm1) return;

    const confirm2 = window.confirm("Esta ação não pode ser desfeita. Deseja realmente excluir sua conta?");
    if (!confirm2) return;

    setLoading(true);
    try {
        if (user) {
            // 1. Apaga os dados do banco de dados
            await remove(ref(database, `users/${user.uid}`));
            
            // 2. Apaga o usuário da autenticação
            await deleteUser(user);
            
            alert("Sua conta foi excluída com sucesso.");
            // O App.tsx vai detectar o logout e jogar para a Home automaticamente
        }
    } catch (error: any) {
        console.error(error);
        if (error.code === 'auth/requires-recent-login') {
            alert("Por segurança, faça login novamente antes de excluir sua conta.");
            logout();
        } else {
            alert("Erro ao excluir conta. Tente novamente.");
        }
    } finally {
        setLoading(false);
    }
  };

  const planName = role === 'premium' ? 'Premium' : role === 'pro' ? 'Pro' : 'Gratuito';
  const planColor = role === 'premium' ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' : role === 'pro' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-400 border-slate-600 bg-slate-800';

  if (loading) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Processando exclusão...</div>;

  return (
    <div className="space-y-8 animate-in fade-in pb-20 pt-4">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 bg-slate-800 rounded-3xl mb-4 flex items-center justify-center text-4xl border-4 border-emerald-500 shadow-2xl relative">
          👤
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-lg border-4 border-[#020617] uppercase">Ativo</div>
        </div>
        
        {/* Edição de Nome */}
        {isEditing ? (
            <div className="flex gap-2 items-center">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-slate-800 border border-emerald-500 p-2 rounded-lg text-white outline-none w-40 text-center" />
                <button onClick={handleSaveName} className="text-emerald-400 font-bold bg-emerald-400/10 px-3 py-2 rounded-lg">OK</button>
            </div>
        ) : (
            <div className="flex gap-2 items-center">
                <h2 className="text-xl font-bold text-white">{user?.displayName || 'Definir Nome'}</h2>
                <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-white p-1">✏️</button>
            </div>
        )}
        
        <p className="text-slate-500 text-sm mt-1">{user?.email}</p>
        
        <div className={`mt-6 px-6 py-2 rounded-full border ${planColor} text-xs font-black uppercase tracking-widest`}>
          Plano {planName}
        </div>
      </div>

      <div className="space-y-3 px-4">
        {/* Botão Sair */}
        <button onClick={() => { logout(); onNavigateHome(); }} className="w-full p-4 bg-slate-800 border border-slate-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-slate-700">
          <span>🚪</span> Sair da Conta
        </button>

        {/* Botão Excluir (Requisito Google Play) */}
        <button onClick={handleDeleteAccount} className="w-full p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-red-500/20 mt-4">
          <span>🗑️</span> Excluir minha conta e dados
        </button>
        
        <button onClick={onNavigateHome} className="w-full text-center text-slate-500 py-4 font-bold text-sm mt-2">Voltar</button>
      </div>
      
      <div className="px-8 text-center">
        <p className="text-[10px] text-slate-600 leading-tight">
            Ao excluir sua conta, todos os seus dados financeiros serão removidos permanentemente de nossos servidores. Esta ação é irreversível.
        </p>
      </div>
    </div>
  );
};
export default ProfilePage;