import { Timestamp } from 'firebase/firestore';

export type Frequencia = 'semanal' | 'quinzenal' | 'mensal' | 'personalizado';

interface CalcularProximoAporteParams {
  dataInicio: Date | Timestamp;
  frequencia: Frequencia;
  diasPersonalizado?: number;
}

/**
 * Calcula a data do próximo aporte com base na frequência e data de início.
 * Retorna um objeto Date ou null se não houver data de início válida.
 */
export function calcularProximoAporte({
  dataInicio,
  frequencia,
  diasPersonalizado = 0,
}: CalcularProximoAporteParams): Date | null {
  const inicio = dataInicio instanceof Timestamp ? dataInicio.toDate() : dataInicio;
  if (!inicio) return null;

  const hoje = new Date();
  
  // Se a data de início for futura, o próximo aporte é na data de início
  if (inicio > hoje) {
    return inicio;
  }

  let proximo = new Date(inicio);

  // Loop para encontrar a próxima data futura (ou igual a hoje)
  while (proximo <= hoje) {
    switch (frequencia) {
      case 'semanal':
        proximo.setDate(proximo.getDate() + 7);
        break;
      case 'quinzenal':
        proximo.setDate(proximo.getDate() + 15);
        break;
      case 'mensal':
        proximo.setMonth(proximo.getMonth() + 1);
        break;
      case 'personalizado':
        if (diasPersonalizado > 0) {
          proximo.setDate(proximo.getDate() + diasPersonalizado);
        } else {
          // Se não definido, trata como mensal
          proximo.setMonth(proximo.getMonth() + 1);
        }
        break;
      default:
        return null;
    }
  }
  return proximo;
}

/**
 * Calcula quantos dias faltam para o próximo aporte.
 * Retorna um número (pode ser negativo se já passou).
 */
export function diasAteProximoAporte(proximoAporte: Date | null): number | null {
  if (!proximoAporte) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const proximo = new Date(proximoAporte);
  proximo.setHours(0, 0, 0, 0);
  const diffTime = proximo.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}