// utils/dateUtils.ts
export function getPrimeiroDiaDoMes(date: Date = new Date()): Date {
  const primeiroDia = new Date(date);
  primeiroDia.setDate(1);
  primeiroDia.setHours(0, 0, 0, 0); // Zera as horas
  return primeiroDia;
}

export function getUltimoDiaDoMes(date: Date = new Date()): Date {
  const ultimoDia = new Date(date);
  ultimoDia.setMonth(ultimoDia.getMonth() + 1); //ultimoDia.setMonth(ultimoDia.getMonth() + 1);
  ultimoDia.setDate(0); // Dia 0 do próximo mês = último dia do mês atual
  ultimoDia.setHours(23, 59, 59, 999); // Fim do dia
  return ultimoDia;
}

// Formatar data para ISO string (se necessário)
export function formatDateForAPI(date: Date): string {
  return date.toISOString();
}

export function formatDiaSemana(date: Date): string {
  const data = new Date(date)
  let dia = ""
  switch (data.getDay()) {
    case 0:
      dia = 'Domingo'
      break;
    case 1:
      dia = 'Segunda'
      break;
    case 2:
      dia = 'Terça'
      break;
    case 3:
      dia = 'Quarta'
      break;
    case 4:
      dia = 'Quinta'
      break;
    case 5:
      dia = 'Sexta'
      break;
    case 6:
      dia = 'Sabado'
      break;
    default:
      break;
  }
  return `${data.getDate()} : ${dia}`;
}

export function utilsIsWeekend(date: Date): boolean {
  const data = new Date(date);
  if (data.getDay() == 0 || data.getDay() == 6) {
    return true;
  }
  return false;
}