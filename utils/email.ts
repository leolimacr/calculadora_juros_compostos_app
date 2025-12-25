
/**
 * Utilitário de E-mail (Mock)
 * 
 * Este arquivo centraliza o envio de e-mails transacionais.
 * Atualmente apenas simula o envio via console.
 * 
 * TODO: Para produção, integrar com:
 * - AWS SES
 * - SendGrid
 * - Resend
 * - Ou seu backend próprio em Node.js/Python
 */

export const sendConfirmationEmail = async (email: string, type: 'register' | 'reset'): Promise<boolean> => {
  // Simula delay de rede
  await new Promise(resolve => setTimeout(resolve, 800));

  console.group('📧 [MOCK EMAIL SERVICE]');
  console.log(`To: ${email}`);
  
  if (type === 'register') {
    console.log('Subject: Bem-vindo ao FinançasPro! Confirme seu cadastro.');
    console.log('Body: Olá! Sua conta local foi criada com sucesso. Este e-mail é apenas uma confirmação de segurança.');
  } else {
    console.log('Subject: Aviso de Segurança - Senha Redefinida');
    console.log('Body: Olá! Seu PIN de acesso foi redefinido recentemente. Se não foi você, contate o suporte.');
  }
  
  console.groupEnd();
  
  return true;
};
