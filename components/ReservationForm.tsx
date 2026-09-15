'use client';

import { FormEvent, useMemo, useState } from 'react';
import { ALIAS, PRICING, RAIN_TEXT, WHATSAPP } from '../lib/config';

type ReservationMode = 'stay' | 'event';

type ReservationFormProps = {
  start: string;
  end: string;
  mode: ReservationMode;
  onDone: () => void;
};

function formatDate(dateString: string) {
  if (!dateString) return '';

  const [year, month, day] = dateString.split('-');

  if (!year || !month || !day) return dateString;

  return `${day}/${month}/${year}`;
}

function parseDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function addDays(dateString: string, days: number) {
  const date = parseDate(dateString);

  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getNights(start: string, end: string) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  const difference =
    endDate.getTime() - startDate.getTime();

  return Math.max(
    1,
    Math.round(difference / (1000 * 60 * 60 * 24))
  );
}

function isChristmas(dateString: string) {
  const date = parseDate(dateString);

  return (
    date.getMonth() === 11 &&
    date.getDate() === 25
  );
}

function isNewYear(dateString: string) {
  const date = parseDate(dateString);

  return (
    date.getMonth() === 0 &&
    date.getDate() === 1
  );
}

function money(value: number) {
  return `$${value.toLocaleString('es-AR')}`;
}

export default function ReservationForm({
  start,
  end,
  mode,
  onDone,
}: ReservationFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [people, setPeople] = useState('2');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /*
   * IMPORTANTE:
   *
   * El precio depende ÚNICAMENTE del modo elegido:
   *
   * stay  = estadía
   * event = evento
   *
   * Nunca se determina por el día de la semana.
   */

  const calculation = useMemo(() => {
    /*
     * ==========================
     * EVENTO
     * ==========================
     *
     * Un evento siempre cuesta $250.000.
     *
     * Aunque la fecha sea Navidad o Año Nuevo,
     * NO se suma el precio de estadía.
     */

    if (mode === 'event') {
      const total = PRICING.eventPerDay;

      return {
        nights: 1,
        total,
        deposit: Math.round(
          total * PRICING.depositPercent
        ),
        label: 'Evento',
      };
    }

    /*
     * ==========================
     * ESTADÍA
     * ==========================
     */

    const nights = getNights(start, end);

    let pricePerNight = PRICING.stayPerNight;

    /*
     * Fechas especiales SOLO para estadías.
     *
     * Navidad: $350.000
     * Año Nuevo: $400.000
     *
     * Si una estadía atraviesa una fecha especial,
     * se aplica esa tarifa para esa noche.
     */

    let total = 0;

    for (let i = 0; i < nights; i++) {
      const currentDate = addDays(start, i);

      if (isChristmas(currentDate)) {
        pricePerNight = 350000;
      } else if (isNewYear(currentDate)) {
        pricePerNight = 400000;
      } else {
        pricePerNight = PRICING.stayPerNight;
      }

      total += pricePerNight;
    }

    return {
      nights,
      total,
      deposit: Math.round(
        total * PRICING.depositPercent
      ),
      label: 'Estadía',
    };
  }, [mode, start, end]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');
    setSuccess(false);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError('Por favor ingresá tu nombre.');
      return;
    }

    if (!cleanPhone) {
      setError('Por favor ingresá tu teléfono.');
      return;
    }

    if (!cleanEmail) {
      setError('Por favor ingresá tu email.');
      return;
    }

    if (mode === 'stay') {
      const numberOfPeople = Number(people);

      if (
        !Number.isFinite(numberOfPeople) ||
        numberOfPeople < 1
      ) {
        setError(
          'Ingresá una cantidad válida de personas.'
        );
        return;
      }

      if (numberOfPeople > PRICING.maxPeople) {
        setError(
          `La estadía admite hasta ${PRICING.maxPeople} personas.`
        );
        return;
      }
    }

    try {
      setLoading(true);

      /*
       * El backend sigue recibiendo "week" para las estadías
       * y "event" para los eventos.
       *
       * El selector visual usa "stay" / "event".
       */

      const reservationType =
        mode === 'event'
          ? 'event'
          : 'week';

      /*
       * Para eventos el calendario selecciona un solo día.
       * El backend recibe ese día como inicio y el día siguiente
       * como fin para mantener la lógica de rango.
       */

      const reservationEnd =
        mode === 'event'
          ? addDays(start, 1)
          : end;

      const response = await fetch(
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
                : Number(people),

            name: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
            notes: notes.trim(),

            total: calculation.total,
            deposit: calculation.deposit,

            createdAt:
              new Date().toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            data.message ||
            'No se pudo enviar la reserva.'
        );
      }

      setSuccess(true);

      /*
       * Limpiamos el formulario después de crear
       * correctamente la reserva.
       */

      setName('');
      setPhone('');
      setEmail('');
      setPeople('2');
      setNotes('');

      onDone();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al enviar la reserva.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="reservation-success">

        <div className="success-icon">
          ✓
        </div>

        <p className="form-eyebrow">
          SOLICITUD ENVIADA
        </p>

        <h3>
          ¡Recibimos tu reserva!
        </h3>

        <p>
          Nos vamos a comunicar con vos para
          confirmar la disponibilidad y coordinar
          el pago de la seña.
        </p>

        <div className="success-summary">

          <div>
            <span>Tipo</span>
            <strong>
              {calculation.label}
            </strong>
          </div>

          <div>
            <span>Fecha</span>
            <strong>
              {formatDate(start)}
              {mode === 'stay' &&
                ` → ${formatDate(end)}`}
            </strong>
          </div>

          <div>
            <span>Total</span>
            <strong>
              {money(calculation.total)}
            </strong>
          </div>

          <div>
            <span>Seña</span>
            <strong>
              {money(calculation.deposit)}
            </strong>
          </div>

        </div>

        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
          className="form-whatsapp"
        >
          Consultar por WhatsApp →
        </a>

      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="reservation-form"
    >

      {/* =========================
          RESUMEN
      ========================= */}

      <div className="reservation-summary">

        <div className="summary-main">

          <span className="summary-type">
            {mode === 'event'
              ? 'EVENTO'
              : 'ESTADÍA'}
          </span>

          <strong>
            {formatDate(start)}

            {mode === 'stay' &&
              ` → ${formatDate(end)}`}
          </strong>

        </div>

        <div className="summary-price">

          <span>
            {mode === 'stay'
              ? `${calculation.nights} ${
                  calculation.nights === 1
                    ? 'noche'
                    : 'noches'
                }`
              : '1 día'}
          </span>

          <strong>
            {money(calculation.total)}
          </strong>

        </div>

      </div>


      {/* =========================
          DATOS
      ========================= */}

      <div className="form-grid">

        <div className="field">

          <label htmlFor="name">
            Nombre y apellido
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Tu nombre"
            autoComplete="name"
          />

        </div>


        <div className="field">

          <label htmlFor="phone">
            Teléfono / WhatsApp
          </label>

          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            placeholder="11 1234 5678"
            autoComplete="tel"
          />

        </div>


        <div className="field field-full">

          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="tuemail@email.com"
            autoComplete="email"
          />

        </div>


        {mode === 'stay' && (
          <div className="field">

            <label htmlFor="people">
              Cantidad de personas
            </label>

            <select
              id="people"
              value={people}
              onChange={(e) =>
                setPeople(e.target.value)
              }
            >
              {Array.from(
                {
                  length: PRICING.maxPeople,
                },
                (_, index) => {
                  const value = index + 1;

                  return (
                    <option
                      key={value}
                      value={value}
                    >
                      {value}{' '}
                      {value === 1
                        ? 'persona'
                        : 'personas'}
                    </option>
                  );
                }
              )}
            </select>

          </div>
        )}


        <div
          className={
            mode === 'stay'
              ? 'field'
              : 'field field-full'
          }
        >

          <label htmlFor="notes">
            Comentarios
          </label>

          <input
            id="notes"
            type="text"
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
            placeholder="¿Querés contarnos algo?"
          />

        </div>

      </div>


      {/* =========================
          PRECIO
      ========================= */}

      <div className="payment-summary">

        <div>
          <span>
            Total
          </span>

          <strong>
            {money(calculation.total)}
          </strong>
        </div>

        <div>
          <span>
            Seña ({PRICING.depositPercent * 100}%)
          </span>

          <strong>
            {money(calculation.deposit)}
          </strong>
        </div>

      </div>


      <div className="payment-note">

        <strong>
          Seña para confirmar
        </strong>

        <p>
          La reserva queda confirmada una vez
          recibido el pago de la seña.
        </p>

        <p>
          Mercado Pago: <strong>{ALIAS}</strong>
        </p>

      </div>


      {mode === 'stay' && (
        <div className="form-note">
          <strong>
            Importante
          </strong>

          <span>
            Ingreso 14:00 · Egreso 11:00.
            Capacidad máxima de{' '}
            {PRICING.maxPeople} personas.
          </span>
        </div>
      )}

      {mode === 'event' && (
        <div className="form-note">
          <strong>
            Evento
          </strong>

          <span>
            El valor del evento es de{' '}
            {money(PRICING.eventPerDay)} por día,
            independientemente de la cantidad de
            personas.
          </span>
        </div>
      )}


      {error && (
        <div className="form-error">
          {error}
        </div>
      )}


      <button
        type="submit"
        disabled={loading}
        className="submit-reservation"
      >
        {loading
          ? 'Enviando reserva...'
          : 'Enviar solicitud de reserva →'}
      </button>


      <p className="form-legal">
        Al enviar la solicitud estás consultando
        disponibilidad. La reserva se confirma
        después de validar los datos y recibir la seña.
      </p>


      <style jsx>{`

        .reservation-form {
          width: 100%;
        }

        .reservation-summary {
          display: flex;
          justify-content: space-between;
          gap: 25px;
          padding: 20px;
          margin-bottom: 25px;
          border-radius: 15px;
          background: #e8f5f8;
        }

        .summary-main,
        .summary-price {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .summary-type {
          color: #398da9;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .summary-main strong {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 22px;
          font-weight: 400;
        }

        .summary-price {
          align-items: flex-end;
        }

        .summary-price span {
          color: #718084;
          font-size: 11px;
        }

        .summary-price strong {
          color: #398da9;
          font-size: 21px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field-full {
          grid-column: 1 / -1;
        }

        .field label {
          color: #46585c;
          font-size: 11px;
          font-weight: 700;
        }

        .field input,
        .field select {
          width: 100%;
          min-height: 46px;
          padding: 12px 14px;
          border: 1px solid #dce2df;
          border-radius: 10px;
          background: white;
          color: #24383c;
          font-family: inherit;
          font-size: 13px;
          outline: none;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .field input:focus,
        .field select:focus {
          border-color: #63b5d1;
          box-shadow: 0 0 0 3px rgba(99,181,209,0.12);
        }

        .payment-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          margin-top: 25px;
          overflow: hidden;
          border-radius: 12px;
          background: #dce2df;
          border: 1px solid #dce2df;
        }

        .payment-summary > div {
          padding: 18px;
          background: #f8f5ed;
        }

        .payment-summary span {
          display: block;
          margin-bottom: 6px;
          color: #718084;
          font-size: 10px;
        }

        .payment-summary strong {
          font-size: 20px;
          font-weight: 600;
        }

        .payment-note {
          margin-top: 15px;
          padding: 18px;
          border-radius: 12px;
          background: #f1f4ec;
        }

        .payment-note strong {
          font-size: 12px;
        }

        .payment-note p {
          margin: 7px 0 0;
          color: #718084;
          font-size: 11px;
          line-height: 1.6;
        }

        .form-note {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-top: 15px;
          padding: 15px 17px;
          border-left: 3px solid #63b5d1;
          background: #f8f5ed;
        }

        .form-note strong {
          font-size: 11px;
        }

        .form-note span {
          color: #718084;
          font-size: 11px;
          line-height: 1.6;
        }

        .form-error {
          margin-top: 17px;
          padding: 13px 15px;
          border-radius: 10px;
          background: #fff0ef;
          color: #a34f4b;
          font-size: 12px;
        }

        .submit-reservation {
          width: 100%;
          min-height: 52px;
          margin-top: 20px;
          border: 0;
          border-radius: 999px;
          background: #63b5d1;
          color: white;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition:
            background 0.2s ease,
            transform 0.2s ease;
        }

        .submit-reservation:hover:not(:disabled) {
          background: #398da9;
          transform: translateY(-1px);
        }

        .submit-reservation:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .form-legal {
          margin: 13px 0 0;
          color: #8a9699;
          font-size: 9px;
          line-height: 1.5;
          text-align: center;
        }

        .reservation-success {
          padding: 20px;
          text-align: center;
        }

        .success-icon {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          margin: 0 auto 18px;
          border-radius: 50%;
          background: #e8f5f8;
          color: #398da9;
          font-size: 26px;
        }

        .form-eyebrow {
          margin: 0 0 10px;
          color: #398da9;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .reservation-success h3 {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 35px;
          font-weight: 400;
        }

        .reservation-success > p:not(.form-eyebrow) {
          max-width: 500px;
          margin: 14px auto 25px;
          color: #718084;
          font-size: 13px;
          line-height: 1.7;
        }

        .success-summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          margin: 25px 0;
          border: 1px solid #dce2df;
          border-radius: 12px;
          overflow: hidden;
          background: #dce2df;
        }

        .success-summary > div {
          padding: 16px;
          background: #f8f5ed;
        }

        .success-summary span {
          display: block;
          margin-bottom: 6px;
          color: #718084;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .success-summary strong {
          font-size: 13px;
        }

        .form-whatsapp {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          padding: 0 24px;
          border-radius: 999px;
          background: #63b5d1;
          color: white;
          font-size: 12px;
          font-weight: 700;
        }

        @media (max-width: 650px) {

          .reservation-summary {
            flex-direction: column;
            gap: 15px;
          }

          .summary-price {
            align-items: flex-start;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .field-full {
            grid-column: auto;
          }

          .payment-summary {
            grid-template-columns: 1fr;
          }

          .success-summary {
            grid-template-columns: 1fr;
          }

        }

      `}</style>

    </form>
  );
}
