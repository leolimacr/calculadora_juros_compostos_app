import type { CourseModule } from '../../types';

export const module02: CourseModule = {
  id: 'modulo-02-investidor',
  title: 'Seu Perfil de Investidor e Objetivos',
  slug: 'seu-perfil-de-investidor-e-objetivos',
  objective:
    'Descobrir seu perfil de investidor e alinhar seus objetivos financeiros com as opções de investimento.',
  order: 2,
  badgeLabel: 'Conheço meu perfil',
  lessons: [
    {
      id: 'm2-aula-01-inv',
      title: 'Descobrindo seu Perfil de Investidor',
      slug: 'descobrindo-seu-perfil-de-investidor',
      durationMinutes: 6,
      objective:
        'Entender o que é perfil de investidor (conservador, moderado, arrojado) e sua importância.',
      blocks: [
        {
          type: 'text',
          title: 'O que é Perfil de Investidor?',
          content:
            'Seu perfil de investidor é como um mapa que indica sua tolerância a riscos e suas expectativas de retorno. Ele é fundamental para escolher os investimentos certos para você.',
        },
        {
          type: 'bullets',
          title: 'Tipos de Perfil',
          items: [
            '**Conservador**: Prioriza a segurança e a preservação do capital, mesmo com retornos menores.',
            '**Moderado**: Busca um equilíbrio entre segurança e rentabilidade, aceitando riscos calculados.',
            '**Arrojado**: Aceita riscos maiores em busca de retornos mais elevados a longo prazo.',
          ],
        },
        {
          type: 'action',
          title: 'Ação prática de hoje',
          content:
            'Pense em como você lida com dinheiro no dia a dia. Você prefere segurança ou está disposto a arriscar um pouco mais por um ganho maior? Isso já dá uma pista do seu perfil.',
        },
      ],
    },
    {
      id: 'm2-aula-02-inv',
      title: 'Definindo Seus Objetivos Financeiros',
      slug: 'definindo-seus-objetivos-financeiros',
      durationMinutes: 5,
      objective:
        'Aprender a transformar sonhos em objetivos financeiros claros e mensuráveis.',
      blocks: [
        {
          type: 'text',
          content:
            'Investir sem um objetivo é como viajar sem destino. Seus objetivos financeiros guiam suas escolhas de investimento e te mantêm motivado.',
        },
        {
          type: 'bullets',
          title: 'Exemplos de Objetivos',
          items: [
            '**Curto prazo (até 1 ano)**: Reserva de emergência, viagem.',
            '**Médio prazo (1 a 5 anos)**: Carro, entrada de imóvel, pós-graduação.',
            '**Longo prazo (acima de 5 anos)**: Aposentadoria, faculdade dos filhos.',
          ],
        },
        {
          type: 'action',
          title: 'Ação prática de hoje',
          content:
            'Liste 3 objetivos financeiros (curto, médio e longo prazo) e estime um valor e um prazo para cada um.',
        },
        {
          type: 'tool-cta',
          tool: 'goals',
          title: 'Use a ferramenta de Metas',
          content:
            'Nossa ferramenta de Metas pode te ajudar a organizar e acompanhar seus objetivos financeiros de forma eficiente.',
          buttonLabel: 'Abrir Metas',
          prompt:
            'Quero definir e acompanhar meus objetivos financeiros de curto, médio e longo prazo.',
        },
      ],
    },
  ],
};
