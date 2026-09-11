import type { CourseModule } from '~types';

export const module04: CourseModule = {
  id: 'modulo-04-investidor',
  title: 'Diversificação: O Segredo para a Segurança',
  slug: 'diversificacao-o-segredo-para-a-seguranca',
  description: 'Descubra como proteger seu patrimônio através da diversificação.',
  objective:
    'Entender o que é diversificação e por que ela é crucial para proteger seus investimentos.',
  order: 4,
  badgeLabel: 'Estrategista',
  lessons: [
    {
      id: 'm4-aula-01-inv',
      title: 'Não coloque todos os ovos na mesma cesta',
      slug: 'nao-coloque-todos-os-ovos-na-mesma-cesta',
      durationMinutes: 5,
      objective:
        'Compreender o conceito de diversificação e como ele reduz os riscos.',
      blocks: [
        {
          type: 'text',
          title: 'O que é Diversificar?',
          content:
            'Diversificar é distribuir seus investimentos em diferentes tipos de ativos (Renda Fixa, Ações, Fundos Imobiliários, etc.) para não depender de uma única fonte de rendimento. Se um investimento vai mal, o outro pode compensar.',
        },
        {
          type: 'analogy',
          title: 'Analogia Simples',
          content:
            'Imagine que você tem uma barraca de frutas. Se você só vende mangas e uma praga atinge todas as mangueiras, você não vende nada. Mas se você também vende bananas e laranjas, ainda terá o que vender. Diversificar é ter frutas diferentes na sua barraca.',
        },
        {
          type: 'bullets',
          title: 'Benefícios da Diversificação',
          items: [
            'Redução do risco geral da sua carteira.',
            'Proteção contra a volatilidade de um único ativo.',
            'Aumento das chances de obter bons retornos no longo prazo.',
          ],
        },
      ],
    },
    {
      id: 'm4-aula-02-inv',
      title: 'Como começar a diversificar na prática',
      slug: 'como-comecar-a-diversificar-na-pratica',
      durationMinutes: 6,
      objective:
        'Aprender estratégias simples para diversificar uma carteira de iniciante.',
      blocks: [
        {
          type: 'text',
          content:
            'Diversificar não precisa ser complicado. Para um iniciante, o foco é criar uma base sólida em Renda Fixa e, aos poucos, adicionar uma pequena parcela em Renda Variável.',
        },
        {
          type: 'bullets',
          title: 'Estratégia para Iniciantes',
          items: [
            '**Comece com a base**: Construa sua reserva de emergência em um investimento seguro de Renda Fixa (ex: Tesouro Selic).',
            '**Adicione um pouco de risco**: Com a base pronta, comece a investir uma pequena parte (ex: 10-20%) em Renda Variável (ex: um Fundo de Ações ou FIIs).',
            '**Reavalie periodicamente**: A cada 6 meses ou 1 ano, revise sua carteira para ver se ela ainda está alinhada com seus objetivos e perfil.',
          ],
        },
        {
          type: 'action',
          title: 'Ação prática de hoje',
          content:
            'Pense na sua carteira de investimentos ideal para iniciantes. Que porcentagem você colocaria em Renda Fixa e em Renda Variável? Anote sua resposta.',
        },
      ],
    },
  ],
};
