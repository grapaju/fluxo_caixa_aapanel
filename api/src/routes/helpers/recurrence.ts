export type PeriodType = 'Unico' | 'Mensal' | 'Bimestral' | 'Trimestral';

export function getNextDate(currentDate: Date, period: PeriodType): Date | null {
  const date = new Date(currentDate);
  switch (period) {
    case 'Mensal':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'Bimestral':
      date.setMonth(date.getMonth() + 2);
      break;
    case 'Trimestral':
      date.setMonth(date.getMonth() + 3);
      break;
    default:
      return null;
  }
  return date;
}
