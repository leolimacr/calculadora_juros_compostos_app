
import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 text-slate-300">
      <div className="border-b border-slate-700 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Termos de Uso</h1>
        <p className="text-sm text-slate-500">Última atualização: 15 de Dezembro de 2025</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">1. Identificação</h2>
        <p>Bem-vindo ao <strong>Finanças Pro Invest</strong>. Este aplicativo é uma ferramenta de educação e organização financeira desenvolvida para auxiliar usuários no controle de suas finanças pessoais.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">2. Descrição do Serviço</h2>
        <p>O Finanças Pro Invest oferece simuladores, calculadoras e um gerenciador financeiro. <strong>Importante:</strong> O aplicativo funciona no modelo "Offline-First". Todos os dados inseridos são processados e armazenados exclusivamente no dispositivo do usuário.</p>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
           <p className="text-sm font-bold text-orange-400">⚠️ Isenção de Responsabilidade</p>
           <p className="text-sm mt-1">Este app é uma ferramenta educacional. NÃO fornecemos consultoria financeira, recomendações de investimento ou garantia de lucros. Todas as decisões financeiras são de inteira responsabilidade do usuário.</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">3. Aceitação dos Termos</h2>
        <p>Ao criar uma conta (local) e utilizar nossos serviços, você concorda irrestritamente com estes termos. Se não concordar, por favor, descontinue o uso imediatamente.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">4. Dados e Privacidade</h2>
        <p>Devido à natureza offline do aplicativo, a segurança e o backup dos dados são de responsabilidade do usuário. Nós não temos acesso aos seus dados financeiros, senhas ou histórico de navegação no app.</p>
        <p>Se você limpar o cache do navegador ou desinstalar o aplicativo, <strong>seus dados serão perdidos permanentemente</strong> e não poderão ser recuperados por nós.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">5. Limitações de Responsabilidade</h2>
        <p>O serviço é fornecido "como está" (AS IS). Não garantimos que os cálculos estejam livres de erros matemáticos ou que reflitam exatamente a realidade de mercado futura (cotações, inflação, impostos).</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">6. Propriedade Intelectual</h2>
        <p>Todo o código, design, logotipos e conteúdo educativo são propriedade exclusiva do Finanças Pro Invest. É proibida a cópia, reprodução ou engenharia reversa sem autorização prévia.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">7. Lei Aplicável</h2>
        <p>Estes termos são regidos pelas leis da República Federativa do Brasil, em especial o Código de Defesa do Consumidor (Lei nº 8.078/1990) e o Marco Civil da Internet.</p>
      </section>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 text-slate-300">
      <div className="border-b border-slate-700 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Política de Privacidade</h1>
        <p className="text-sm text-slate-500">Em conformidade com a LGPD (Brasil)</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-2xl">🔒</span> Introdução</h2>
        <p>Sua privacidade é nossa prioridade absoluta. O Finanças Pro Invest foi construído com o princípio de <strong>Privacidade por Design</strong>. Diferente da maioria dos apps, nós não queremos seus dados.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Dados Coletados</h2>
        <ul className="list-disc pl-5 space-y-2">
            <li><strong>Dados Fornecidos por Você:</strong> Nome (opcional), E-mail (para chave de acesso local) e PIN.</li>
            <li><strong>Dados Financeiros:</strong> Transações, metas e simulações. Estes dados <strong>NUNCA</strong> saem do seu dispositivo.</li>
            <li><strong>O que NÃO coletamos:</strong> Localização GPS, contatos, fotos ou dados bancários reais.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Armazenamento Local</h2>
        <p>Utilizamos tecnologias como <code>localStorage</code> e <code>IndexedDB</code> do seu navegador para salvar suas informações. Isso significa que seus dados residem fisicamente no seu celular ou computador.</p>
        <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30">
           <p className="text-emerald-400 font-bold text-sm">Transparência Total</p>
           <p className="text-sm mt-1">Nós não possuímos servidores de banco de dados com suas transações. Se nossa empresa deixar de existir amanhã, você continua com acesso aos seus dados enquanto tiver o app instalado.</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Compartilhamento</h2>
        <p>Nós <strong>não compartilhamos, vendemos ou alugamos</strong> seus dados pessoais para terceiros, anunciantes ou parceiros. Como não temos acesso aos seus dados, seria tecnicamente impossível vendê-los.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Seus Direitos (LGPD)</h2>
        <p>Você tem total controle. A qualquer momento, você pode:</p>
        <ul className="list-disc pl-5 space-y-2">
            <li>Acessar seus dados (estão na sua tela).</li>
            <li>Corrigir seus dados (basta editar).</li>
            <li>Excluir seus dados (usando a função "Resetar Dados" nas configurações).</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Serviços de Terceiros</h2>
        <p>Para fornecer cotações atualizadas (Dólar, Bitcoin, Selic), o aplicativo pode fazer requisições anônimas a APIs públicas (como CoinGecko ou AwesomeAPI). Essas requisições não contêm dados pessoais identificáveis.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Contato</h2>
        <p>Para questões sobre privacidade, entre em contato pelo e-mail: privacidade@financasproinvest.com.br</p>
      </section>
    </div>
  );
};
