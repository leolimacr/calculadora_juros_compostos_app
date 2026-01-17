import React, { useState } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useFirebase();
  const navigate = useNavigate();
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!name.trim()) {
      setLocalError('Por favor, informe como gostaria de ser chamado.');
      return;
    }
    if (password.length < 6) {
      setLocalError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err: any) {
      setLocalError('Erro ao criar conta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mb-20"></div>

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-8">
          <div className="bg-gray-900 inline-flex p-3 rounded-full border border-gray-800 mb-4">
             <UserPlus className="text-green-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">Criar Nova Conta</h2>
          <p className="text-gray-400 text-sm mt-2">Comece sua jornada financeira hoje.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* CAMPO NOME (NOVO) */}
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Como gostaria de ser chamado?"
              className="w-full bg-gray-900 text-white pl-10 p-3.5 rounded-xl border border-gray-800 focus:border-green-500 outline-none transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-500" size={20} />
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              className="w-full bg-gray-900 text-white pl-10 p-3.5 rounded-xl border border-gray-800 focus:border-green-500 outline-none transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-500" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Crie uma senha forte"
              className="w-full bg-gray-900 text-white pl-10 p-3.5 rounded-xl border border-gray-800 focus:border-green-500 outline-none transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-500 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {localError && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{localError}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 transition-all active:scale-95 mt-4"
          >
            {loading ? 'Criando Conta...' : 'CADASTRAR GRÁTIS'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/" className="text-gray-500 hover:text-green-400 text-sm transition-colors">
            Já possui conta? <span className="font-bold underline">Faça Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;