import type { CourseModule } from '../../types';

export const module03: CourseModule = {
  id: 'modulo-03-investidor',
  title: 'Onde Investir: Renda Fixa vs. Renda Variável',
  slug: 'onde-investir-renda-fixa-vs-renda-variavel',
  objective:
    'Compreender as duas principais classes de ativos e suas características fundamentais.',
  order: 3,
  badgeLabel: 'Conheço os caminhos',
  lessons: [
    {
      id: 'm3-aula-01-inv',
      title: 'Renda Fixa: A Porta de Entrada',
      slug: 'renda-fixa-a-porta-de-entrada',
      durationMinutes: 7,
      objective:
        'Entender o que é Renda Fixa, seus principais produtos e por que é considerada mais segura.',
      blocks: [
        {
          type: 'text',
          title: 'O que é Renda Fixa?',
          content:
            'Na Renda Fixa, você empresta dinheiro para uma instituição (governo, banco ou empresa) e recebe juros por isso. A forma de cálculo da rentabilidade é definida no momento da aplicação.',
        },
        {
          type: 'bullets',
          title: 'Principais Tipos de Renda Fixa',
          items: [
            '**Tesouro Direto**: Títulos públicos do governo, considerados os mais seguros do país.',
            '**CDB (Certificado de Depósito Bancário)**: Títulos emitidos por bancos.',
            '**LCI/LCA (Letra de Crédito Imobiliário/Agronegócio)**: Semelhantes aos CDBs, mas isentos de Imposto de Renda.',
          ],
        },
        {
          type: 'analogy',
          title: 'Analogia Simples',
          content:
            'Pense na Renda Fixa como um empréstimo que você faz para um amigo de confiança, com um acordo claro de quanto ele vai te pagar de volta.',
        },
      ],
    },
    {
      id: 'm3-aula-02-inv',
      title: 'Renda Variável: O Potencial de Crescimento',
      slug: 'renda-variavel-o-potencial-de-crescimento',
      durationMinutes: 8,
      objective:
        'Entender o que é Renda Variável, com foco em ações, e seus riscos e potenciais.',
      blocks: [
        {
          type: 'text',
          content:
            'Na Renda Variável, a rentabilidade não é previsível. O exemplo mais comum são as ações, onde você se torna sócio de uma empresa.',
        },
        {
          type: 'bullets',
          title: 'Principais Características',
          items: [
            '**Ações**: Pequenas partes de uma empresa. Se a empresa cresce e dá lucro, o valor da sua ação pode aumentar.',
            '**Fundos Imobiliários (FIIs)**: Investem em imóveis (shoppings, prédios comerciais) e distribuem aluguéis aos cotistas.',
            '**Potencial de maior retorno**: Geralmente, oferece maior potencial de lucro a longo prazo.',
            '**Maior risco**: O valor dos ativos pode variar bastante, tanto para cima quanto para baixo.',
          ],
        },
        {
          type: 'quiz',
          question: 'Qual a principal diferença entre Renda Fixa e Renda Variável?',
          options: [
            'Renda Fixa não tem risco.',
            'Na Renda Fixa a rentabilidade é previsível, na Variável não.',
            'Renda Variável sempre dá mais lucro.',
          ],
          correctIndex: 1,
          feedbackCorrect:
            'Exato! A previsibilidade do retorno é o que define a Renda Fixa.',
          feedbackIncorrect:
            'Não exatamente. A principal diferença está na previsibilidade do retorno. Na Renda Fixa, você sabe como seu dinheiro vai render; na Variável, não.',
        },
      ],
    },
  ],
};
