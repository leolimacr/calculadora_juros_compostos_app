import { TrendingUp, Flame, Scale, Home, Brain } from 'lucide-react';
import React from 'react';

export const ARTICLES = [
  {
    id: 'juros-compostos',
    category: 'INVESTIMENTOS',
    title: 'Juros Compostos: A 8ª Maravilha do Mundo',
    excerpt: 'Entenda como o tempo é o maior multiplicador de riqueza e como pequenos aportes podem se tornar uma fortuna.',
    readTime: '8 min',
    icon: TrendingUp,
    content: (
      <div className="space-y-6 text-lg leading-relaxed text-slate-300">
        <h3 className="text-2xl font-bold text-white">O Poder da Exponencialidade</h3>
        <p>Albert Einstein supostamente chamou os juros compostos de "a oitava maravilha do mundo". Quem entende, ganha; quem não entende, paga. Diferente dos juros simples, onde o rendimento é calculado apenas sobre o valor inicial, nos juros compostos o lucro de cada período é somado ao capital para o cálculo do próximo rendimento.</p>
        <div className="bg-slate-800/50 p-6 rounded-2xl border-l-4 border-emerald-500 my-6">
          <p className="italic text-emerald-100">"O tempo é o ingrediente mais valioso. Começar 5 anos mais cedo pode significar o dobro de patrimônio no futuro com menos esforço mensal."</p>
        </div>
        <h3 className="text-xl font-bold text-white mt-8 mb-4">A Curva de Inflexão</h3>
        <p>No início, os juros compostos parecem lentos. É o chamado "vale da decepção". No entanto, após 10 ou 15 anos, a curva de crescimento torna-se quase vertical. É o momento em que os seus rendimentos mensais passam a ser maiores do que o seu aporte, criando um efeito de bola de neve imparável.</p>
      </div>
    )
  },
  {
    id: 'guia-fire',
    category: 'PLANEJAMENTO',
    title: 'Guia Completo FIRE: Liberdade em 10 Anos',
    excerpt: 'Financial Independence, Retire Early. O movimento que ensina pessoas comuns a se aposentarem décadas antes do previsto.',
    readTime: '12 min',
    icon: Flame,
    content: (
      <div className="space-y-6 text-lg leading-relaxed text-slate-300">
        <h3 className="text-2xl font-bold text-white">O Que é o Movimento FIRE?</h3>
        <p>FIRE é o acrônimo para Independência Financeira e Aposentadoria Antecipada. O objetivo não é necessariamente parar de trabalhar, mas sim alcançar o estado onde o trabalho é opcional.</p>
        <h3 className="text-xl font-bold text-white mt-8 mb-4">A Regra dos 4%</h3>
        <p>A base matemática do FIRE é a Regra dos 4% (ou Regra de Trinity). Ela determina que, se você acumular 25 vezes o seu gasto anual e investir de forma diversificada, poderá retirar 4% desse valor anualmente sem que o dinheiro acabe.</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Exemplo:</strong> Se você gasta R$ 5.000/mês (R$ 60k/ano), seu número FIRE é R$ 1.5 Milhão.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'sair-das-dividas',
    category: 'PLANEJAMENTO',
    title: 'Como Sair das Dívidas: Estratégias Comprovadas',
    excerpt: 'Avalanche ou Bola de Neve? Descubra qual método matemático vai limpar seu nome mais rápido.',
    readTime: '10 min',
    icon: Scale,
    content: (
      <div className="space-y-6 text-lg leading-relaxed text-slate-300">
        <h3 className="text-2xl font-bold text-white">O Plano de Batalha</h3>
        <p>As dívidas de consumo são o maior inimigo da construção de riqueza. Enquanto os juros compostos nos investimentos trabalham a seu favor, nas dívidas eles trabalham contra você.</p>
        <h3 className="text-xl font-bold text-white mt-8 mb-4">Bola de Neve vs. Avalanche</h3>
        <p><strong>Avalanche:</strong> Pague a dívida com maior juros primeiro (matematicamente superior).</p>
        <p><strong>Bola de Neve:</strong> Pague a menor dívida primeiro (psicologicamente superior).</p>
      </div>
    )
  },
  {
    id: 'aluguel-vs-financiamento',
    category: 'IMÓVEIS',
    title: 'Aluguel vs Financiamento: A Verdade Matemática',
    excerpt: 'O imóvel próprio é um ativo ou um passivo? Analisamos os números por trás do sonho da casa própria.',
    readTime: '9 min',
    icon: Home,
    content: (
      <div className="space-y-6 text-lg leading-relaxed text-slate-300">
        <h3 className="text-2xl font-bold text-white">O Custo de Oportunidade</h3>
        <p>Ao financiar um imóvel em 30 anos, você paga juros compostos ao banco. Muitas vezes, o valor pago em juros compraria dois imóveis. A alternativa matemática é morar de aluguel e investir a diferença, mas a decisão envolve segurança emocional.</p>
      </div>
    )
  },
  {
    id: 'psicologia-do-dinheiro',
    category: 'PSICOLOGIA',
    title: 'Psicologia do Dinheiro: Por Que Gastamos?',
    excerpt: 'Entenda os gatilhos mentais que sabotam seu orçamento e como blindar sua mente contra o consumismo.',
    readTime: '7 min',
    icon: Brain,
    content: (
      <div className="space-y-6 text-lg leading-relaxed text-slate-300">
        <h3 className="text-2xl font-bold text-white">O Cérebro Primitivo</h3>
        <p>Nosso cérebro evoluiu para buscar recompensas imediatas (sobrevivência). Gastar dinheiro libera dopamina, o hormônio do prazer. O segredo é criar fricção entre o desejo e a compra, usando a regra das 72 horas.</p>
      </div>
    )
  }
];