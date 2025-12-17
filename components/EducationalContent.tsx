
import React from 'react';

const EducationalContent: React.FC = () => {
  const steps = [
    { title: "Valor Inicial", description: "Insira o montante que você já possui guardado para começar seu investimento agora." },
    { title: "Aporte Mensal", description: "Defina quanto você pretende economizar e investir regularmente todos os meses." },
    { title: "Rentabilidade", description: "Informe a taxa de juros (mensal ou anual) que espera obter sobre o capital aplicado." },
    { title: "Tempo", description: "Diga por quanto tempo (meses ou anos) você manterá esse dinheiro trabalhando para você." },
    { title: "Resultado", description: "Clique em calcular para visualizar a mágica do crescimento exponencial em detalhes." }
  ];

  return (
    <div className="mt-12 space-y-12 pb-20">
      {/* Guia Passo a Passo */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
          <span className="bg-red-800 text-white w-8 h-8 rounded-full inline-flex items-center justify-center mr-3 text-sm">1</span>
          Guia para sua simulação
        </h2>
        <p className="text-slate-600 mb-8 max-w-2xl">
          Nossa calculadora financeira é gratuita e projetada para ser intuitiva. 
          Siga estas etapas simples para planejar seu futuro financeiro:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-xs font-bold text-red-700 uppercase tracking-widest block mb-2">Passo {idx + 1}</span>
              <h3 className="font-bold text-slate-800 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fórmula e Teoria */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="bg-slate-900 text-slate-300 p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6">A Ciência por Trás</h2>
          <p className="mb-6">
            Diferente dos juros simples, onde o rendimento é fixo sobre o capital original, 
            os juros compostos calculam o lucro sobre o valor atualizado (Capital + Juros anteriores).
          </p>
          <div className="bg-white/10 p-6 rounded-xl border border-white/20 text-center mb-6">
            <span className="text-3xl font-mono text-red-400">M = C (1 + i)<sup>t</sup></span>
          </div>
          <ul className="space-y-3 text-sm">
            <li><strong className="text-white">M:</strong> Montante acumulado (resultado final)</li>
            <li><strong className="text-white">C:</strong> Capital investido inicialmente</li>
            <li><strong className="text-white">i:</strong> Taxa de juros (formato decimal)</li>
            <li><strong className="text-white">t:</strong> Tempo da aplicação</li>
          </ul>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Por que juros compostos?</h2>
          <div className="prose prose-slate text-slate-600">
            <p>
              Frequentemente chamados de "juros sobre juros", eles representam o crescimento exponencial. 
              No início, o efeito pode parecer tímido, mas conforme o tempo passa, os juros gerados pelo 
              capital acumulado superam significativamente o valor dos seus aportes mensais.
            </p>
            <p>
              Albert Einstein supostamente chamou os juros compostos de "a oitava maravilha do mundo". 
              Quem os compreende, ganha; quem não, os paga. Eles estão presentes em:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Investimentos de Renda Fixa:</strong> Tesouro Direto, CDBs e LCIs.</li>
              <li><strong>Dividendos:</strong> Reinvestir lucros de ações acelera drasticamente o acúmulo.</li>
              <li><strong>Financiamentos:</strong> Aqui, eles trabalham contra você, aumentando dívidas de cartões e empréstimos.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Diferenças Simples vs Compostos */}
      <section className="bg-white p-8 rounded-2xl border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Juros Simples vs. Compostos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-6 rounded-xl border-l-4 border-slate-300">
            <h3 className="font-bold text-lg mb-3">Juros Simples</h3>
            <p className="text-sm text-slate-600 mb-4">Incidem apenas sobre o capital inicial. O rendimento é linear.</p>
            <ul className="text-sm text-slate-500 space-y-2">
              <li>• Crescimento em linha reta</li>
              <li>• Rendimentos constantes</li>
              <li>• Comum em descontos e empréstimos curtos</li>
            </ul>
          </div>
          <div className="bg-red-50 p-6 rounded-xl border-l-4 border-red-800">
            <h3 className="font-bold text-lg text-red-900 mb-3">Juros Compostos</h3>
            <p className="text-sm text-red-800/70 mb-4">Incidem sobre o saldo total atualizado. O rendimento é exponencial.</p>
            <ul className="text-sm text-red-800/60 space-y-2">
              <li>• Crescimento em curva acelerada</li>
              <li>• "Bola de neve" de rendimentos</li>
              <li>• Base da construção de patrimônio</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EducationalContent;
