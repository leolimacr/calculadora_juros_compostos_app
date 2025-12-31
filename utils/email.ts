
/**
 * Utilitário de E-mail (DEPRECIADO)
 * 
 * A autenticação foi migrada para o Firebase Auth real.
 * As funções sendEmailVerification e sendPasswordResetEmail do SDK do Firebase
 * agora cuidam do envio de e-mails reais.
 * 
 * Este arquivo é mantido vazio ou com logs apenas para evitar erros de importação legados
 * durante a transição, mas não deve ser mais utilizado em novos fluxos.
 */

export const sendConfirmationEmail = async (email: string, type: 'register' | 'reset', code: string): Promise<boolean> => {
  console.warn('⚠️ sendConfirmationEmail (Mock) foi chamado, mas o sistema agora usa Firebase Auth nativo.');
  return true;
};
