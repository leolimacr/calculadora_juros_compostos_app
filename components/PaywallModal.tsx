
import React from 'react';
import ContentModal from './ContentModal';
import Paywall from './Paywall';
import { UserMeta } from '../types';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  userMeta: UserMeta | null;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, onNavigate, userMeta }) => {
  const handleUpgrade = () => {
    onClose();
    onNavigate('upgrade'); // Rota correta para a nova página
  };

  return (
    <ContentModal isOpen={isOpen} onClose={onClose} title="">
      <Paywall 
        title="Limite Gratuito Atingido 🔒"
        description={`Você usou ${userMeta?.launchLimit || 30} de ${userMeta?.launchLimit || 30} lançamentos disponíveis. Para controle ilimitado, faça o upgrade.`}
        highlights={[
          "Lançamentos Ilimitados",
          "Backup na Nuvem",
          "IA Financeira Completa"
        ]}
        source="app_limit_reached"
        onUpgrade={handleUpgrade}
      />
      <div className="text-center mt-4">
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-white underline">
          Voltar e gerenciar lançamentos existentes
        </button>
      </div>
    </ContentModal>
  );
};

export default PaywallModal;
