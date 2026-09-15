'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  calculateBreakdown,
  calculateDays,
  TYPE_LABELS,
  type ReservationType,
} from '../lib/types';

import {
  ALIAS,
  PRICING,
  MAX_PEOPLE,
  RAIN_TEXT,
  WHATSAPP,
} from '../lib/config';

type ReservationMode = 'stay' | 'event';

type ReservationFormProps = {
  start: string;
  end: string;
  mode: ReservationMode;
  onDone: () => void;
};

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
}: ReservationFormProps) {
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

  /*
   * EVENTO
   *
   * Siempre ocupa un solo día.
   */
  const effectiveEnd = mode === 'event'
    ? addOneDay(start)
    : end;

  const days = calculateDays(start, effectiveEnd);

  /*
   * Tipo que se guarda en Google Sheets / API.
   *
   * Estadía:
   * - weekend si existiera esa lógica
   * - week para una estadía normal
   *
   * Como ahora el usuario elige explícitamente el modo,
   * nunca se detecta automáticamente por día de la semana.
   */
  const type: ReservationType =
    mode === 'event' ? 'event' : 'week';

  /*
   * Cálculo de precio.
   *
   * Para EVENTO:
   * $250.000 por día, independientemente de que sea
   * una fecha especial.
   *
   * Para ESTADÍA:
   * se usa la lógica de calculateBreakdown:
   * $100.000 por noche normalmente,
   * $350.000 Navidad,
   * $400.000 Año Nuevo.
   */
  const breakdown = useMemo(() => {
    if (mode === 'event') {
      return {
        normalTotal: 0,
        specialTotal: PRICING.eventPerDay,
        total: PRICING.eventPerDay,
        specialGroups: [],
        nights: 1,
      };
    }

    return calculateBreakdown(
      'week',
      start,
      effectiveEnd
    );
  }, [mode, start, effectiveEnd]);

  const total = breakdown.total;

  const deposit =
    total * PRICING.depositPercent;

  const update = (
    key: keyof typeof form,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();

    setMessage('');

    if (!start) {
      setMessage('Elegí una fecha.');
      return;
    }

    if (mode === 'stay' && !end) {
      setMessage('Elegí la fecha de egreso.');
      return;
    }

    if (days < 1) {
      setMessage('Elegí un rango de fechas válido.');
      return;
    }

    if (mode === 'stay' && days < 2) {
      setMessage(
        'La estadía tiene un mínimo de 2 noches.'
      );
      return;
    }

    const people = Number(form.people);

    if (
      mode === 'stay' &&
      (
        !Number.isInteger(people) ||
        people < 1 ||
        people > MAX_PEOPLE
      )
    ) {
      setMessage(
        `La capacidad máxima de la estadía es de ${MAX_PEOPLE} personas.`
      );
      return;
    }

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.email.trim()
    ) {
      setMessage(
        'Completá nombre, teléfono y email.'
      );
      return;
    }

    setLoading(true);

    try {
      const reservationEnd =
        mode === 'event'
          ? effectiveEnd
          : end;

      const reservationType: ReservationType =
        mode === 'event'
          ? 'event'
          : 'week';

      const res = await fetch(
        '/api/reservas',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create',

            type: reservationType,

            start,

            end: reservationEnd,

            people:
              mode === 'event'
                ? 0
                : people,

            name: form.name.trim(),

            phone: form.phone.trim(),

            email: form.email.trim(),

            notes: form.notes.trim(),

            total,

            deposit,

            createdAt:
              new Date().toISOString(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMessage(
          data.error ||
            'No pudimos registrar la solicitud.'
        );
        return;
      }

      setPayment(true);

      onDone();
    } catch {
      setMessage(
        'No pudimos conectar con el sistema. Intentá nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * PANTALLA DE PAGO
   */
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
          Para confirmarla, aboná el 50%
          mediante transferencia.
        </p>

        <div className="summary">
          <h4>
            Resumen de reserva
          </h4>

          <div>
            <span>Tipo</span>
            <b>
              {TYPE_LABELS[type]}
            </b>
          </div>

          <div>
            <span>Ingreso</span>
            <b>
              {formatDate(start)}
            </b>
          </div>

          <div>
            <span>Egreso</span>
            <b>
              {formatDate(effectiveEnd)}
            </b>
          </div>

          <div>
            <span>Cantidad de días</span>
            <b>{days}</b>
          </div>

          <div>
            <span>Personas</span>
            <b>
              {mode === 'event'
                ? 'Modalidad masiva'
                : form.people}
            </b>
          </div>

          <div>
            <span>Total</span>
            <b>
              {money(total)}
            </b>
          </div>

          <div>
            <span>Seña 50%</span>
            <b>
              {money(deposit)}
            </b>
          </div>

          <div>
            <span>Saldo</span>
            <b>
              {money(total - deposit)}
            </b>
          </div>
        </div>

        <div className="alias-box">
          <small>
            ABONAR RESERVA
          </small>

          <p>
            Transferí el 50% del valor total a:
          </p>

          <strong>
            {ALIAS}
          </strong>

          <b className="alias-owner">
            Cuenta Mercado Pago
          </b>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(
                ALIAS
              );

              setMessage(
                'Alias copiado'
              );
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
          Una vez realizada la transferencia,
          enviá el comprobante por WhatsApp
          para confirmar la reserva.
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

  /*
   * FORMULARIO
   */
  return (
    <form
      className="form"
      onSubmit={submit}
    >
      <div className="selected-box">
        <b>
          {formatDate(start)}
        </b>

        {' → '}

        <b>
          {formatDate(effectiveEnd)}
        </b>

        <span>
          {mode === 'event'
            ? '1 día · Modalidad masiva'
            : `${days} noches · Hasta ${MAX_PEOPLE} personas`}
        </span>
      </div>

      <div className="type-note">
        <b>
          {mode === 'event'
            ? 'EVENTO'
            : 'ESTADÍA'}
        </b>

        <span>
          {mode === 'event'
            ? `Modalidad masiva · ${money(PRICING.eventPerDay)} por día`
            : `Estadía · ${money(PRICING.stayPerNight)} por noche`}
        </span>
      </div>

      <div className="two">
        <label>
          Nombre y apellido

          <input
            required
            value={form.name}
            onChange={(e) =>
              update(
                'name',
                e.target.value
              )
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
              update(
                'phone',
                e.target.value
              )
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
              update(
                'email',
                e.target.value
              )
            }
            autoComplete="email"
          />
        </label>

        {mode === 'event' ? (
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
            update(
              'notes',
              e.target.value
            )
          }
          placeholder="Contanos si necesitás algo especial…"
        />
      </label>

      <div className="price">
        <div>
          <small>
            {mode === 'event'
              ? 'Precio del evento'
              : breakdown.specialGroups.length
                ? 'Tarifa especial'
                : 'Precio'}
          </small>

          <b>
            {money(total)}
          </b>
        </div>

        <small>
          {mode === 'stay' &&
          breakdown.specialGroups.length
            ? `${breakdown.specialGroups
                .map(
                  (x) =>
                    `${x.label}: ${money(
                      x.price
                    )}`
                )
                .join(' · ')} · `
            : ''}

          Seña 50%:{' '}
          {money(deposit)}
        </small>
      </div>

      {mode === 'stay' &&
        breakdown.specialGroups.length > 0 && (
          <div className="special-notice">
            🔴 Fecha especial: se aplica
            automáticamente la tarifa de
            Navidad o Año Nuevo.
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
