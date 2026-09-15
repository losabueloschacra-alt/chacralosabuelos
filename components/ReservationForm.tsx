'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  calculateBreakdown,
  calculateDays,
  isFridayToSunday,
  TYPE_LABELS,
  type ReservationType,
} from '../lib/types';

import {
  ALIAS,
  MAX_PEOPLE,
  RAIN_TEXT,
  WHATSAPP,
} from '../lib/config';

function money(value: number) {
  return `$${value.toLocaleString('es-AR')}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}

function addOneDay(value: string) {
  const d = new Date(`${value}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function ReservationForm({
  start,
  end,
  mode,
  onDone,
}: {
  start: string;
  end: string;
  mode?: string;
  onDone: () => void;
}) {
  const isEvent = mode === 'event';

  const effectiveEnd = isEvent
    ? addOneDay(start)
    : end;

  const days = calculateDays(
    start,
    effectiveEnd
  );

  const autoType: ReservationType = useMemo(
    () =>
      isFridayToSunday(start, end)
        ? 'weekend'
        : 'week',
    [start, end]
  );

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    people: '2',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [payment, setPayment] = useState(false);

  const type: ReservationType =
    isEvent ? 'event' : autoType;

  const breakdown = calculateBreakdown(
    type,
    start,
    effectiveEnd
  );

  const total = breakdown.total;
  const deposit = total * 0.5;

  const update = (
    k: keyof typeof form,
    v: string
  ) => {
    setForm((f) => ({
      ...f,
      [k]: v,
    }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!start) {
      return setMessage('Elegí una fecha.');
    }

    if (!isEvent && !end) {
      return setMessage(
        'Elegí la fecha de egreso.'
      );
    }

    if (days < 1) {
      return setMessage(
        'Elegí un rango de fechas válido.'
      );
    }

    if (!isEvent && days < 2) {
      return setMessage(
        'La estadía tiene un mínimo de 2 días.'
      );
    }

    const people = Number(form.people);

    if (
      !isEvent &&
      (
        !Number.isInteger(people) ||
        people < 1 ||
        people > MAX_PEOPLE
      )
    ) {
      return setMessage(
        `La capacidad máxima de la estadía es de ${MAX_PEOPLE} personas.`
      );
    }

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.email.trim()
    ) {
      return setMessage(
        'Completá nombre, teléfono y email.'
      );
    }

    setLoading(true);

    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          type,
          start,
          end: effectiveEnd,
          people: isEvent ? 0 : people,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          notes: form.notes.trim(),
          total,
          deposit,
          createdAt: new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMessage(
          data.error ||
          'No pudimos registrar la solicitud.'
        );
        return;
      }

      setPayment(true);
    } catch {
      setMessage(
        'No pudimos conectar con el sistema. Intentá nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (payment) {
    const waText = encodeURIComponent(
      `Hola, hice una reserva en Los Abuelos Chacra y te envío el comprobante.

Nombre: ${form.name}
Fecha de ingreso: ${formatDate(start)}
Fecha de egreso: ${formatDate(effectiveEnd)}
Tipo de reserva: ${TYPE_LABELS[type]}
Total: ${money(total)}
Seña: ${money(deposit)}

Adjunto el comprobante.`
    );

    return (
      <section
        className="payment-card"
        aria-live="polite"
      >
        <span className="eyebrow">
          RESERVA PENDIENTE
        </span>

        <h3>
          ¡Solicitud registrada!
        </h3>

        <p className="payment-lead">
          Tu reserva quedó{' '}
          <b>pendiente de confirmación</b>.
          Para confirmarla, aboná el 50% mediante
          transferencia.
        </p>

        <div className="summary">
          <h4>Resumen de reserva</h4>

          <div>
            <span>Tipo</span>
            <b>{TYPE_LABELS[type]}</b>
          </div>

          <div>
            <span>Ingreso</span>
            <b>{formatDate(start)}</b>
          </div>

          <div>
            <span>Egreso</span>
            <b>{formatDate(effectiveEnd)}</b>
          </div>

          <div>
            <span>Cantidad de días</span>
            <b>{days}</b>
          </div>

          <div>
            <span>Personas</span>
            <b>
              {isEvent
                ? 'Modalidad masiva'
                : form.people}
            </b>
          </div>

          <div>
            <span>Total</span>
            <b>{money(total)}</b>
          </div>

          <div>
            <span>Seña 50%</span>
            <b>{money(deposit)}</b>
          </div>

          <div>
            <span>Saldo</span>
            <b>{money(total - deposit)}</b>
          </div>
        </div>

        <div className="alias-box">
          <small>ABONAR RESERVA</small>

          <p>
            Transferí el 50% del valor total a:
          </p>

          <strong>
            Alias: evelynmaroli
          </strong>

          <b className="alias-owner">
            A nombre de: Evelyn Talia Maroli.
          </b>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(
                'evelynmaroli'
              );
              setMessage('Alias copiado');
            }}
          >
            COPIAR ALIAS
          </button>

          {message && (
            <div className="message">
              {message}
            </div>
          )}
        </div>

        <p className="payment-lead">
          Una vez realizada la transferencia, enviá
          el comprobante por WhatsApp al{' '}
          <b>11 60 11 55 83</b> para confirmar la
          reserva.
        </p>

        <a
          className="primary payment-whatsapp"
          href={`https://wa.me/${WHATSAPP}?text=${waText}`}
          target="_blank"
          rel="noreferrer"
        >
          ENVIAR COMPROBANTE POR WHATSAPP
        </a>
      </section>
    );
  }

  return (
    <form
      className="form"
      onSubmit={submit}
    >
      <div className="selected-box">
        <b>{formatDate(start)}</b> →{' '}
        <b>{formatDate(effectiveEnd)}</b>

        <span>
          {days} días ·{' '}
          {isEvent
            ? 'Modalidad masiva · 1 día'
            : end
            ? `Hasta ${MAX_PEOPLE} personas · mínimo 2 días`
            : 'Elegí la fecha de egreso'}
        </span>
      </div>

      <div className="type-note">
        <b>
          {isEvent
            ? 'EVENTO'
            : 'TIPO DE ESTADÍA'}
        </b>

        <span>
          {isEvent
            ? breakdown.specialTotal > 0
              ? 'Modalidad masiva · $250.000 por día en fecha especial'
              : 'Modalidad masiva · $200.000 por día'
            : end
            ? 'Detectado automáticamente: ' +
              TYPE_LABELS[autoType] +
              (autoType === 'weekend'
                ? ' · $280.000'
                : ' · $100.000 por día')
            : 'Primero elegí la fecha de egreso'}
        </span>
      </div>

      <div className="two">
        <label>
          Nombre y apellido
          <input
            required
            value={form.name}
            onChange={(e) =>
              update('name', e.target.value)
            }
            autoComplete="name"
          />
        </label>

        <label>
          Teléfono / WhatsApp
          <input
            required
            value={form.phone}
            onChange={(e) =>
              update('phone', e.target.value)
            }
            autoComplete="tel"
          />
        </label>
      </div>

      <div className="two">
        <label>
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) =>
              update('email', e.target.value)
            }
            autoComplete="email"
          />
        </label>

        {isEvent ? (
          <label>
            Personas
            <input
              value="Modalidad masiva"
              disabled
            />
          </label>
        ) : (
          <label>
            ¿Cuántas personas?
            <input
              required
              type="number"
              min="1"
              max={MAX_PEOPLE}
              value={form.people}
              onChange={(e) =>
                update(
                  'people',
                  e.target.value
                )
              }
            />
          </label>
        )}
      </div>

      <label>
        Observaciones (opcional)
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) =>
            update('notes', e.target.value)
          }
          placeholder="Contanos si necesitás algo especial…"
        />
      </label>

      <div className="price">
        <div>
          <small>
            {isEvent
              ? breakdown.specialTotal > 0
                ? 'Fecha especial'
                : 'Precio del evento'
              : breakdown.specialGroups.length
              ? 'Tarifa normal + especial'
              : 'Precio'}
          </small>

          <b>{money(total)}</b>
        </div>

        <small>
          {isEvent
            ? breakdown.specialTotal > 0
              ? 'Tarifa especial · '
              : ''
            : breakdown.specialGroups.length
            ? `${breakdown.specialGroups
                .map(
                  (x) =>
                    `${x.label}: ${money(x.price)}`
                )
                .join(' · ')} · `
            : ''}
          Seña 50%: {money(deposit)}
        </small>
      </div>

      {isEvent &&
        breakdown.specialTotal > 0 && (
          <div className="special-notice">
            🔴 Fecha especial: los eventos en
            24/12, 25/12, 31/12 y 01/01 tienen tarifa
            de $250.000 por día.
          </div>
        )}

      {!isEvent &&
        breakdown.specialGroups.length > 0 && (
          <div className="special-notice">
            🔴 Fecha especial de estadía incluida
            en el cálculo.
          </div>
        )}

      <p className="rain">
        ☁ {RAIN_TEXT}
      </p>

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      <button
        className="primary"
        disabled={loading}
      >
        {loading
          ? 'Registrando reserva…'
          : 'CONTINUAR CON LA RESERVA'}
      </button>
    </form>
  );
}
