import type { CourseModule } from '~types';

export const module01: CourseModule = {
  id: 'modulo-01-investidor',
  title: 'Primeiros Passos no Mundo dos Investimentos',
  slug: 'primeiros-passos-no-mundo-dos-investimentos',
  objective:
    'Entender o que é investir, por que é importante e desmistificar alguns conceitos básicos.',
  order: 1,
  badgeLabel: 'Iniciei minha jornada',
  lessons: [
    {
      id: 'm1-aula-01-inv',
      title: 'Por que investir? Mais do que guardar dinheiro',
      slug: 'por-que-investir-mais-do-que-guardar-dinheiro',
      durationMinutes: 5,
      objective:
        'Compreender a diferença entre poupar e investir e a importância de fazer o dinheiro trabalhar para você.',
      blocks: [
        {
          type: 'text',
          title: 'A diferença entre poupar e investir',
          content:
            'Poupar é guardar dinheiro. Investir é fazer esse dinheiro render, trabalhando para você ao longo do tempo. É a chave para alcançar objetivos financeiros maiores.',
        },
        {
          type: 'bullets',
          title: 'Benefícios de investir',
          items: [
            'Proteção contra a inflação.',
            'Realização de sonhos (casa, carro, viagem).',
            'Construção de patrimônio a longo prazo.',
            'Liberdade financeira.',
          ],
        },
        {
          type: 'quote',
          content:
            'Não trabalhe pelo dinheiro, faça o dinheiro trabalhar para você.',
        },
        {
          type: 'action',
          title: 'Ação prática de hoje',
          content:
            'Pense em um objetivo financeiro que você gostaria de alcançar nos próximos 5 anos. Anote-o.',
        },
      ],
    },
    {
      id: 'm1-aula-02-inv',
      title: 'Mitos e Verdades sobre Investir',
      slug: 'mitos-e-verdades-sobre-investir',
      durationMinutes: 4,
      objective:
        'Desmistificar crenças comuns sobre investimentos e mostrar que é acessível a todos.',
      blocks: [
        {
          type: 'text',
          content:
            'Muitas pessoas acreditam que investir é apenas para ricos ou que é muito complicado. Vamos desvendar alguns desses mitos.',
        },
        {
          type: 'bullets',
          title: 'Mitos comuns',
          items: [
            'Precisa de muito dinheiro para começar.',
            'É muito arriscado.',
            'É só para quem entende de economia.',
            'É como jogo de azar.',
          ],
        },
        {
          type: 'bullets',
          title: 'Verdades',
          items: [
            'Você pode começar com pouco dinheiro.',
            'Existem investimentos de baixo risco.',
            'Com conhecimento básico, qualquer um pode investir.',
            'É uma ferramenta para construir futuro, não um jogo.',
          ],
        },
        {
          type: 'quiz',
          question: 'Qual é um mito comum sobre investimentos?',
          options: [
            'É possível começar com pouco dinheiro.',
            'É muito complicado e só para ricos.',
            'Existem investimentos de baixo risco.',
          ],
          correctIndex: 1,
          feedbackCorrect:
            'Correto! Muitas pessoas pensam assim, mas a realidade é diferente.',
          feedbackIncorrect:
            'Incorreto. Na verdade, é possível começar com pouco e existem opções de baixo risco.',
        },
      ],
    },
  ],
};
