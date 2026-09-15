'use client';

import { useMemo, useState } from 'react';
import { MONTHS, SPECIAL_DATES } from '../lib/config';
import type { Block, Reservation } from '../lib/types';

type CalendarMode = 'stay' | 'event';

type Props = {
  reservations: Reservation[];
  blocks: Block[];
  mode: CalendarMode;
  onPick: (start: string, end: string) => void;
};

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(
    2,
    '0'
  )}`;
}

function monthDays(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function addDays(date: string, amount: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + amount);
  return d.toISOString().slice(0, 10);
}

function overlaps(day: string, reservation: Reservation) {
  return (
    day >= reservation.start &&
    day < reservation.end &&
    (reservation.status === 'PENDIENTE' ||
      reservation.status === 'CONFIRMADA')
  );
}

function blockedByManual(day: string, block: Block) {
  return day >= block.start && day < block.end;
}

export default function Calendar({
  reservations,
  blocks,
  mode,
  onPick,
}: Props) {
  const [monthIndex, setMonthIndex] = useState(0);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const m = MONTHS[monthIndex];

  const days = monthDays(m.year, m.month);

  const first = new Date(m.year, m.month, 1).getDay();

  const offset = (first + 6) % 7;

  const cells = useMemo(
    () =>
      Array.from(
        { length: offset + days },
        (_, i) => (i < offset ? null : i - offset + 1)
      ),
    [offset, days]
  );

  const isReserved = (day: number) => {
    const value = iso(m.year, m.month, day);

    return reservations.some((reservation) =>
      overlaps(value, reservation)
    );
  };

  const isBlocked = (day: number) => {
    const value = iso(m.year, m.month, day);

    return blocks.some((block) =>
      blockedByManual(value, block)
    );
  };

  const special = (day: number) => {
    const value = iso(m.year, m.month, day);

    return SPECIAL_DATES.find((item) => item.date === value);
  };

  function rangeHasBlockedDates(from: string, to: string) {
    const firstDate = new Date(`${from}T12:00:00`);
    const lastDate = new Date(`${to}T12:00:00`);

    const span = Math.round(
      (lastDate.getTime() - firstDate.getTime()) / 86400000
    );

    for (let i = 0; i < span; i++) {
      const date = addDays(from, i);

      const reserved = reservations.some((reservation) =>
        overlaps(date, reservation)
      );

      const blocked = blocks.some((block) =>
        blockedByManual(date, block)
      );

      if (reserved || blocked) {
        return true;
      }
    }

    return false;
  }

  function select(dayNumber: number) {
    const day = iso(m.year, m.month, dayNumber);

    if (isReserved(dayNumber) || isBlocked(dayNumber)) {
      return;
    }

    /*
     * EVENTO
     * Un evento ocupa solamente el día seleccionado.
     */
    if (mode === 'event') {
      const eventEnd = addDays(day, 1);

      setStart(day);
      setEnd(eventEnd);

      onPick(day, eventEnd);

      return;
    }

    /*
     * ESTADÍA
     * Primer click = ingreso.
     * Segundo click = egreso.
     */
    if (!start || end) {
      setStart(day);
      setEnd('');

      onPick(day, '');

      return;
    }

    /*
     * Si el segundo click es anterior o igual
     * al ingreso, lo tomamos como nuevo ingreso.
     */
    if (day <= start) {
      setStart(day);
      setEnd('');

      onPick(day, '');

      return;
    }

    /*
     * Verificamos que ninguna noche del rango
     * esté ocupada o bloqueada.
     */
    if (rangeHasBlockedDates(start, day)) {
      return;
    }

    setEnd(day);

    onPick(start, day);
  }

  function changeMonth(index: number) {
    setMonthIndex(index);

    /*
     * Al cambiar de mes manualmente no borramos
     * la selección. Esto permite elegir ingreso
     * en diciembre y egreso en enero/febrero.
     */
  }

  return (
    <div className="calendar-card">

      <div className="calendar-mode">
        <div className="calendar-mode-title">
          {mode === 'stay'
            ? 'Elegí tu ingreso y egreso'
            : 'Elegí el día del evento'}
        </div>

        <div className="calendar-mode-help">
          {mode === 'stay'
            ? 'Mínimo 2 noches · $100.000 por noche'
            : 'Un solo día · $200.000 · fechas especiales $250.000'}
        </div>
      </div>

      <div className="month-tabs">
        {MONTHS.map((item, index) => (
          <button
            key={item.label}
            type="button"
            className={index === monthIndex ? 'active' : ''}
            onClick={() => changeMonth(index)}
          >
            {item.label.replace(' 20', '\u00a0')}
          </button>
        ))}
      </div>

      <div className="cal-head">

        <button
          type="button"
          aria-label="Mes anterior"
          disabled={monthIndex === 0}
          onClick={() =>
            setMonthIndex(Math.max(0, monthIndex - 1))
          }
        >
          ‹
        </button>

        <div>
          <strong>{m.label}</strong>

          <small>
            {mode === 'stay'
              ? 'Seleccioná ingreso y salida'
              : 'Seleccioná un único día'}
          </small>
        </div>

        <button
          type="button"
          aria-label="Mes siguiente"
          disabled={monthIndex === MONTHS.length - 1}
          onClick={() =>
            setMonthIndex(
              Math.min(MONTHS.length - 1, monthIndex + 1)
            )
          }
        >
          ›
        </button>

      </div>

      <div className="weekdays">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="grid">

        {cells.map((dayNumber, index) => {
          if (dayNumber === null) {
            return <span key={`empty-${index}`} />;
          }

          const value = iso(
            m.year,
            m.month,
            dayNumber
          );

          const reserved = isReserved(dayNumber);
          const blocked = isBlocked(dayNumber);
          const specialDate = special(dayNumber);

          const selectedStart = value === start;
          const selectedEnd =
            mode === 'stay' && value === end;

          const selectedEvent =
            mode === 'event' && value === start;

          const selected =
            selectedStart ||
            selectedEnd ||
            selectedEvent;

          return (
            <button
              key={dayNumber}
              type="button"
              aria-label={`${dayNumber}/${m.month + 1}/${m.year}`}
              className={[
                reserved || blocked ? 'blocked' : '',
                specialDate ? 'special' : '',
                selected ? 'selected' : '',
                selectedEnd ? 'end' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => select(dayNumber)}
              disabled={reserved || blocked}
            >
              <span>{dayNumber}</span>

              {specialDate &&
                !reserved &&
                !blocked && (
                  <em title={specialDate.label}>●</em>
                )}
            </button>
          );
        })}

      </div>

      {start && (
        <div className="selection-hint">

          {mode === 'event' ? (
            <>
              Evento: <b>{start}</b>
            </>
          ) : (
            <>
              Ingreso: <b>{start}</b>

              {end ? (
                <>
                  {' · '}
                  Egreso: <b>{end}</b>
                </>
              ) : (
                <>
                  {' · '}
                  Elegí ahora la fecha de egreso
                </>
              )}
            </>
          )}

        </div>
      )}

      <div className="legend">

        <span>
          <i className="dot available" />
          Disponible
        </span>

        <span>
          <i className="dot pending" />
          Pendiente
        </span>

        <span>
          <i className="dot booked" />
          Reservado
        </span>

        <span>
          <i className="dot special-dot" />
          Fecha especial
        </span>

      </div>

    </div>
  );
}
