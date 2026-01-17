import React, { useEffect } from 'react';
import { useFirebase } from '../hooks/useFirebase';

const Dashboard: React.FC = () => {
  const { user, logout, transactions, saldoTotal } = useFirebase();

  // Log para debug no console do Android (via Chrome Inspect)
  useEffect(() => {
    console.log("=== DASHBOARD DEBUG ===");
    console.log("Usuário:", user);
    console.log("Transações (raw):", transactions);
    console.log("Saldo:", saldoTotal);
  }, [user, transactions, saldoTotal]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
        
        <h1 className="text-2xl font-bold text-yellow-500 mb-4 text-center">
          Modo de Diagnóstico
        </h1>

        <div className="space-y-4">
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-400">Status do App:</p>
            <p className="text-green-400 font-bold">RENDERIZAÇÃO OK ✅</p>
          </div>

          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-400">Usuário Logado:</p>
            <p className="text-white break-all">{user?.email || 'Carregando...'}</p>
          </div>

          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-400">Dados Carregados:</p>
            <p className="text-white">
              Transações: {transactions ? transactions.length : '0 (ou null)'}
            </p>
            <p className="text-white">
              Saldo: R$ {saldoTotal ? saldoTotal.toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition-colors"
        >
          SAIR DO APP
        </button>
      </div>
    </div>
  );
};

export default Dashboard;