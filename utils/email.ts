
/**
 * Utilitário de E-mail (Simulação Robusta)
 * 
 * Como este é um aplicativo Frontend-only (sem servidor Node.js próprio para envio de e-mail),
 * utilizamos um alerta visual para simular a chegada do código na caixa de entrada.
 * 
 * EM PRODUÇÃO REAL: Substituir este console.log/alert por uma chamada ao EmailJS ou Firebase Functions.
 */

export const sendConfirmationEmail = async (email: string, type: 'register' | 'reset', code: string): Promise<boolean> => {
  // Simula delay de rede
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.group('📧 [SERVIÇO DE E-MAIL]');
  console.log(`Para: ${email}`);
  console.log(`Código: ${code}`);
  
  let subject = '';
  let body = '';

  if (type === 'register') {
    subject = 'Seu código de verificação - Finanças Pro Invest';
    body = `Bem-vindo! Seu código de verificação é: ${code}`;
  } else if (type === 'reset') {
    subject = 'Recuperação de Senha';
    body = `Recebemos um pedido para redefinir sua senha. Seu código é: ${code}`;
  }
  
  console.log(`Assunto: ${subject}`);
  console.log(`Mensagem: ${body}`);
  console.groupEnd();

  // FALLBACK VISUAL IMPORTANTE:
  // Como não temos um servidor SMTP real configurado neste ambiente de demonstração,
  // exibimos um alerta para o usuário saber o código e prosseguir.
  alert(`[SIMULAÇÃO DE E-MAIL]\n\nPara: ${email}\n${subject}\n\n${body}`);
  
  return true;
};
