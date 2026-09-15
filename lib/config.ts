export const MONTHS = [
  { year: 2026, month: 11, label: 'Diciembre 2026' },
  { year: 2027, month: 0, label: 'Enero 2027' },
  { year: 2027, month: 1, label: 'Febrero 2027' }
];

export const PRICING = {
  weekend: 280000,
  weekday: 100000,
  eventPerDay: 200000,
  depositPercent: 0.5,
  maxPeople: 8,
  special: {
    christmas: { label: 'Navidad', dates: ['2026-12-24', '2026-12-25'], price: 350000 },
    newYear: { label: 'Año Nuevo', dates: ['2026-12-31', '2027-01-01'], price: 400000 }
  }
} as const;

export const MAX_PEOPLE = PRICING.maxPeople;
export const RAIN_TEXT = 'En caso de lluvia, la reserva/evento se reprograma para una nueva fecha a coordinar, sujeta a disponibilidad.';
export const ALIAS = 'evelynmaroli';
export const WHATSAPP = '5491160115583';

export const SPECIAL_DATES = Object.values(PRICING.special).flatMap(group =>
  group.dates.map(date => ({ date, label: group.label, price: group.price }))
);
