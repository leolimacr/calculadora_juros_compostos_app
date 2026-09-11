import type { CourseModule } from '~types';

export const module05: CourseModule = {
  id: 'modulo-05-investidor',
  title: 'O Poder do Tempo: Juros Compostos e Longo Prazo',
  slug: 'o-poder-do-tempo-juros-compostos-e-longo-prazo',
  description: 'Entenda como o tempo e os juros compostos trabalham para você.',
  objective:
    'Entender como os juros compostos funcionam e por que o tempo é o maior aliado do investidor.',
  order: 5,
  badgeLabel: 'Viajante do tempo',
  lessons: [
    {
      id: 'm5-aula-01-inv',
      title: 'A Mágica dos Juros Compostos',
      slug: 'a-magica-dos-juros-compostos',
      durationMinutes: 8,
      objective:
        'Compreender o conceito de juros sobre juros e seu efeito exponencial no patrimônio.',
      blocks: [
        {
          type: 'text',
          title: 'O que são Juros Compostos?',
          content:
            'Juros compostos são os juros que você recebe não apenas sobre o valor inicial, mas também sobre os juros acumulados. É o famoso “juros sobre juros”, que faz seu dinheiro crescer de forma exponencial.',
        },
        {
          type: 'analogy',
          title: 'Analogia da Bola de Neve',
          content:
            'Pense em uma pequena bola de neve rolando montanha abaixo. No início, ela cresce devagar. Mas, à medida que rola, ela acumula mais neve e cresce cada vez mais rápido. Os juros compostos funcionam da mesma forma com o seu dinheiro.',
        },
        {
          type: 'tool-cta',
          tool: 'compound-interest',
          title: 'Simule o Poder dos Juros Compostos',
          content:
            'Use nossa calculadora de juros compostos para ver na prática como seu dinheiro pode crescer ao longo do tempo. Faça simulações e se surpreenda!',
          buttonLabel: 'Abrir Calculadora',
          prompt:
            'Quero simular o crescimento de um investimento com aportes mensais ao longo de vários anos.',
        },
      ],
    },
    {
      id: 'm5-aula-02-inv',
      title: 'O Tempo é Seu Melhor Amigo',
      slug: 'o-tempo-e-seu-melhor-amigo',
      durationMinutes: 5,
      objective:
        'Entender a importância de começar a investir o mais cedo possível.',
      blocks: [
        {
          type: 'text',
          content:
            'Quanto mais tempo seu dinheiro fica investido, mais tempo os juros compostos têm para trabalhar e fazer seu patrimônio crescer. Por isso, começar cedo é mais importante do que começar com muito dinheiro.',
        },
        {
          type: 'quote',
          content:
            'O melhor momento para plantar uma árvore foi há 20 anos. O segundo melhor momento é agora.',
        },
        {
          type: 'action',
          title: 'Ação prática de hoje',
          content:
            'Não espere o “momento perfeito”. Comece com o que você pode hoje, mesmo que seja pouco. A consistência é mais importante que a quantidade no início.',
        },
      ],
    },
  ],
};
