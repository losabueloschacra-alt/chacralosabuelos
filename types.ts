import { PRICING, SPECIAL_DATES } from './config';

export type ReservationType = 'weekend' | 'week' | 'event';
export type ReservationStatus = 'PENDIENTE' | 'CONFIRMADA' | 'LIBERADA' | 'CANCELADA';

export type Reservation = {
  id: string;
  type: ReservationType;
  start: string;
  end: string;
  people: number;
  name: string;
  phone: string;
  email: string;
  notes?: string;
  total: number;
  deposit: number;
  status: ReservationStatus;
  createdAt: string;
};

export type Block = { id: string; start: string; end: string; reason?: string };

export const TYPE_LABELS: Record<ReservationType, string> = {
  weekend: 'Fin de semana',
  week: 'Semana',
  event: 'Evento'
};

function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function calculateDays(start: string, end: string) {
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export function datesInRange(start: string, end: string) {
  const days = calculateDays(start, end);
  return Array.from({ length: days }, (_, i) => addDays(start, i));
}

export function isFridayToSunday(start: string, end: string) {
  const startDay = new Date(`${start}T12:00:00`).getDay();
  return startDay === 5 && calculateDays(start, end) === 3;
}

export function getSpecialGroups(start: string, end: string) {
  const selected = new Set<string>(datesInRange(start, end));
  return Object.values(PRICING.special).filter(group => group.dates.some(date => selected.has(date)));
}

export function calculateBreakdown(type: ReservationType, start: string, end: string) {
  const days = calculateDays(start, end);
  const specialGroups = getSpecialGroups(start, end);

  if (type === 'event') {
    const specialDates = new Set<string>(SPECIAL_DATES.map(item => item.date));
    const selectedDates = datesInRange(start, end);
    const normalDays = selectedDates.filter(date => !specialDates.has(date)).length;
    const specialDays = selectedDates.filter(date => specialDates.has(date)).length;
    const normalTotal = normalDays * PRICING.eventPerDay;
    const specialTotal = specialDays * 250000;
    return { normalTotal, specialTotal, total: normalTotal + specialTotal, specialGroups };
  }

  // A special holiday package is charged once per special group touched by the stay.
  // The holiday dates themselves are excluded from the normal daily calculation.
  const specialDates = new Set<string>(specialGroups.flatMap(group => group.dates));
  const normalDays = datesInRange(start, end).filter(date => !specialDates.has(date)).length;
  const normalTotal = isFridayToSunday(start, end) && specialGroups.length === 0
    ? PRICING.weekend
    : normalDays * PRICING.weekday;
  const specialTotal = specialGroups.reduce((sum, group) => sum + group.price, 0);
  return { normalTotal, specialTotal, total: normalTotal + specialTotal, specialGroups };
}

export function calculateTotal(type: ReservationType, start: string, end: string) {
  return calculateBreakdown(type, start, end).total;
}
