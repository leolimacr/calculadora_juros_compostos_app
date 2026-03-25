import type { CourseModule } from '../../types';

export const module06: CourseModule = {
  id: 'modulo-06-investidor',
  title: 'Próximos Passos e Mentalidade de Longo Prazo',
  slug: 'proximos-passos-e-mentalidade-de-longo-prazo',
  objective:
    'Consolidar o aprendizado e preparar o investidor para uma jornada de sucesso e consistência.',
  order: 6,
  badgeLabel: 'Jornada iniciada',
  lessons: [
    {
      id: 'm6-aula-01-inv',
      title: 'Revisão e Próximos Passos',
      slug: 'revisao-e-proximos-passos',
      durationMinutes: 5,
      objective:
        'Revisar os conceitos aprendidos e traçar um plano de ação claro.',
      blocks: [
        {
          type: 'checklist',
          title: 'Seu Checklist do Investidor Iniciante',
          items: [
            'Entendi a diferença entre poupar e investir.',
            'Conheço meu perfil de investidor.',
            'Defini meus objetivos financeiros de curto, médio e longo prazo.',
            'Sei a diferença entre Renda Fixa e Renda Variável.',
            'Entendi a importância de diversificar.',
            'Compreendi o poder dos juros compostos e do tempo.',
          ],
        },
        {
          type: 'action',
          title: 'Seu Plano de Ação',
          content:
            'Com base no que aprendeu, defina qual será seu primeiro investimento e quando você o fará. Comece pequeno, mas comece!',
        },
      ],
    },
    {
      id: 'm6-aula-02-inv',
      title: 'A Mentalidade do Investidor de Sucesso',
      slug: 'a-mentalidade-do-investidor-de-sucesso',
      durationMinutes: 6,
      objective:
        'Desenvolver a paciência, a disciplina e o foco no longo prazo.',
      blocks: [
        {
          type: 'text',
          content:
            'Investir é uma maratona, não uma corrida de 100 metros. O sucesso vem com a consistência e a paciência para ver seus investimentos crescerem ao longo do tempo.',
        },
        {
          type: 'bullets',
          title: 'Pilares da Mentalidade de Longo Prazo',
          items: [
            '**Paciência**: Não se desespere com as quedas do mercado. Elas são normais.',
            '**Disciplina**: Mantenha a consistência dos seus aportes, mesmo que sejam pequenos.',
            '**Foco no objetivo**: Lembre-se sempre dos seus objetivos financeiros para se manter motivado.',
            '**Aprendizado contínuo**: O mercado financeiro está sempre mudando. Continue aprendendo.',
          ],
        },
        {
          type: 'quote',
          content:
            'O mercado de ações é um dispositivo para transferir dinheiro do impaciente para o paciente. - Warren Buffett',
        },
        {
          type: 'tool-cta',
          tool: 'nexus-ai',
          title: 'Use o Nexus para continuar aprendendo',
          content:
            'Tem dúvidas sobre investimentos ou quer saber mais sobre um tópico específico? O Nexus pode te ajudar a aprofundar seus conhecimentos.',
          buttonLabel: 'Abrir Nexus AI',
          prompt:
            'Quero aprender mais sobre [tópico de investimento]. Me explique de forma simples e com exemplos.',
        },
      ],
    },
  ],
};
