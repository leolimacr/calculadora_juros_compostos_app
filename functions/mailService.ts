
// Este serviço é uma abstração. 
// Em produção, você deve substituir os logs por chamadas reais ao SendGrid ou Firebase Email Extension.

export const sendEmail = async (to: string, templateId: string, data: any) => {
  console.log(`[MAIL SERVICE] Enviando e-mail para: ${to}`);
  console.log(`[MAIL SERVICE] Template: ${templateId}`);
  console.log(`[MAIL SERVICE] Dados:`, data);
  
  // Exemplo de integração SendGrid (Comentada)
  /*
  const msg = {
    to: to,
    from: 'nao-responda@financasproinvest.com.br',
    templateId: templateId,
    dynamic_template_data: data,
  };
  await sgMail.send(msg);
  */
  
  return true;
};

export const TEMPLATES = {
  WELCOME_FREE: 'd-welcome-free-id',
  WELCOME_PRO: 'd-welcome-pro-id',
  TRIAL_ENDING: 'd-trial-ending-id',
  PAYMENT_SUCCESS: 'd-payment-success-id',
  WEEKLY_NEWSLETTER: 'd-newsletter-id',
  RE_ENGAGEMENT: 'd-reengagement-id'
};
