import { PRICING } from './config';

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
 * Cantidad de noches/días entre las fechas.
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
 * Devuelve las fechas ocupadas dentro del rango.
 */
export function datesInRange(start: string, end: string) {
  const days = calculateDays(start, end);

  return Array.from(
    { length: days },
    (_, i) => addDays(start, i)
  );
}

export function isFridayToSunday(start: string, end: string) {
  if (!start || !end) return false;

  const startDay = new Date(`${start}T12:00:00`).getDay();

  return startDay === 5 && calculateDays(start, end) === 2;
}

/**
 * Fechas especiales SOLO para estadías.
 *
 * IMPORTANTE:
 * Estas tarifas ($350.000 / $400.000) NO se aplican
 * a eventos.
 */
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
  const days = calculateDays(start, end);
  const selectedDates = datesInRange(start, end);

  /*
   * ============================
   * EVENTO
   * ============================
   *
   * Evento:
   * - Día normal: $200.000
   * - Fecha especial de evento: $250.000
   *
   * IMPORTANTE:
   * NO se utilizan las tarifas especiales
   * de estadía ($350.000 / $400.000).
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

      // IMPORTANTE:
      // Para eventos no devolvemos las tarifas especiales
      // de estadía.
      specialGroups: [],

      nights: days,
    };
  }

  /*
   * ============================
   * ESTADÍA
   * ============================
   *
   * Día/noche normal: $100.000
   *
   * Navidad:
   * $350.000
   *
   * Año Nuevo:
   * $400.000
   */

  const specialGroups = getSpecialGroups(
    start,
    end
  );

  const specialDates = new Set<string>(
    specialGroups.flatMap(
      (group) => group.dates
    )
  );

  const normalNights = selectedDates.filter(
    (date) => !specialDates.has(date)
  ).length;

  const normalTotal =
    normalNights * PRICING.stayPerNight;

  const specialTotal = specialGroups.reduce(
    (sum, group) => sum + group.price,
    0
  );

  return {
    normalTotal,
    specialTotal,
    total: normalTotal + specialTotal,
    specialGroups,
    nights: days,
  };
}

export function calculateTotal(
  type: ReservationType,
  start: string,
  end: string
) {
  return calculateBreakdown(
    type,
    start,
    end
  ).total;
}
