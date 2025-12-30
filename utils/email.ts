
/**
 * Utilitário de E-mail (Mock)
 * 
 * Gera links reais para testar o fluxo de verificação e reset de senha.
 * Em produção, isso chamaria uma API (SendGrid, AWS SES).
 */

export const sendConfirmationEmail = async (email: string, type: 'register' | 'reset', token?: string): Promise<boolean> => {
  // Simula delay de rede
  await new Promise(resolve => setTimeout(resolve, 1500));

  const baseUrl = window.location.origin;
  
  console.group('📧 [MOCK EMAIL SERVICE]');
  console.log(`To: ${email}`);
  
  if (type === 'register') {
    const link = `${baseUrl}/?action=verify&token=${token}`;
    console.log('--- E-MAIL DE VERIFICAÇÃO ---');
    console.log('Assunto: Bem-vindo! Confirme seu e-mail no Finanças Pro Invest');
    console.log('Olá! Obrigado por criar sua conta.');
    console.log('Clique no link abaixo para confirmar seu e-mail:');
    console.log(link); // Link clicável no console
    console.log('-----------------------------');
  } else if (type === 'reset') {
    const link = `${baseUrl}/?action=reset&token=${token}`;
    console.log('--- REDEFINIÇÃO DE SENHA ---');
    console.log('Assunto: Instruções para redefinir sua senha');
    console.log('Recebemos uma solicitação para redefinir seu PIN.');
    console.log('Clique no link abaixo para criar um novo PIN:');
    console.log(link); // Link clicável no console
    console.log('----------------------------');
  }
  
  console.groupEnd();
  
  return true;
};
