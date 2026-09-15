import { PRICING, SPECIAL_DATES } from './config';

export type ReservationType = 'weekend' | 'week' | 'event';

export type ReservationStatus =
  | 'PENDIENTE'
  | 'CONFIRMADA'
  | 'LIBERADA'
  | 'CANCELADA';

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

export type Block = {
  id: string;
  start: string;
  end: string;
  reason?: string;
};

export const TYPE_LABELS: Record<ReservationType, string> = {
  weekend: 'Estadía',
  week: 'Estadía',
  event: 'Evento',
};

function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Cantidad de NOCHES.
 *
 * Ejemplo:
 * 15 → 16 = 1 noche
 * 15 → 17 = 2 noches
 * 15 → 18 = 3 noches
 */
export function calculateDays(start: string, end: string) {
  if (!start || !end) return 0;

  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);

  return Math.max(
    0,
    Math.round((b.getTime() - a.getTime()) / 86400000)
  );
}

/**
 * Devuelve las noches ocupadas.
 *
 * Ejemplo:
 * ingreso 15
 * egreso 18
 *
 * noches ocupadas:
 * 15
 * 16
 * 17
 *
 * El día 18 es el día de salida.
 */
export function datesInRange(start: string, end: string) {
  const nights = calculateDays(start, end);

  return Array.from(
    { length: nights },
    (_, i) => addDays(start, i)
  );
}

export function isFridayToSunday(start: string, end: string) {
  if (!start || !end) return false;

  const startDay = new Date(`${start}T12:00:00`).getDay();

  return startDay === 5 && calculateDays(start, end) === 2;
}

export function getSpecialGroups(start: string, end: string) {
  const selected = new Set<string>(
    datesInRange(start, end)
  );

  return Object.values(PRICING.special).filter(
    (group) =>
      group.dates.some((date) => selected.has(date))
  );
}

export function calculateBreakdown(
  type: ReservationType,
  start: string,
  end: string
) {
  const nights = calculateDays(start, end);
  const selectedDates = datesInRange(start, end);
  const specialGroups = getSpecialGroups(start, end);

  /*
   * EVENTO
   *
   * Un evento ocupa un solo día.
   * Las fechas especiales de evento cuestan $250.000.
   * Los demás días cuestan $200.000.
   */
  if (type === 'event') {
    const specialEventDates = new Set<string>(
      PRICING.eventSpecialDates
    );

    const normalDays = selectedDates.filter(
      (date) => !specialEventDates.has(date)
    ).length;

    const specialDays = selectedDates.filter(
      (date) => specialEventDates.has(date)
    ).length;

    const normalTotal =
      normalDays * PRICING.eventPerDay;

    const specialTotal =
      specialDays * PRICING.eventSpecialPerDay;

    return {
      normalTotal,
      specialTotal,
      total: normalTotal + specialTotal,
      specialGroups,
      nights,
    };
  }

  /*
   * ESTADÍA
   *
   * Siempre $100.000 por noche.
   *
   * Las fechas especiales NO se cobran además de la tarifa
   * normal. Se reemplaza la tarifa de esa noche por la
   * tarifa especial correspondiente.
   */
  let normalTotal = 0;

  const specialDates = new Set<string>(
    specialGroups.flatMap(
      (group) => group.dates
    )
  );

  const normalNights = selectedDates.filter(
    (date) => !specialDates.has(date)
  ).length;

  normalTotal =
    normalNights * PRICING.stayPerNight;

  /*
   * Cada grupo especial se cobra una sola vez.
   *
   * Navidad:
   * 24/12 o 25/12 → $350.000
   *
   * Año Nuevo:
   * 31/12 o 01/01 → $400.000
   */
  const specialTotal = specialGroups.reduce(
    (sum, group) => sum + group.price,
    0
  );

  return {
    normalTotal,
    specialTotal,
    total: normalTotal + specialTotal,
    specialGroups,
    nights,
  };
}

export function calculateTotal(
  type: ReservationType,
  start: string,
  end: string
) {
  return calculateBreakdown(type, start, end).total;
}
