import React from 'react';

const LabPage: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <div className="p-8">
    <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
    <p className="mt-4 text-slate-600">{desc}</p>
  </div>
);

export const HomeLabPage = () => <LabPage title="Home (Lab)" desc="Resumo Executivo e Orientação" />;
export const ControlaLabPage = () => <LabPage title="Controla (Lab)" desc="Gerenciamento Ativo" />;
export const EvoluiLabPage = () => <LabPage title="Evolui (Lab)" desc="Planejamento e Crescimento" />;
export const ExploraLabPage = () => <LabPage title="Explora (Lab)" desc="Hub de Descoberta" />;
export const MaisLabPage = () => <LabPage title="Mais (Lab)" desc="Administração e Conta" />;
