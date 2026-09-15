'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import Calendar from '../components/Calendar';
import ReservationForm from '../components/ReservationForm';

import type { Block, Reservation } from '../lib/types';

import {
  ALIAS,
  PRICING,
  RAIN_TEXT,
  WHATSAPP,
} from '../lib/config';

type ReservationMode = 'stay' | 'event';

const money = (value: number) =>
  `$${value.toLocaleString('es-AR')}`;

export default function Home() {
  const [reservations, setReservations] =
    useState<Reservation[]>([]);

  const [blocks, setBlocks] =
    useState<Block[]>([]);

  /*
   * MODALIDAD ELEGIDA POR EL USUARIO
   *
   * stay  = Estadía
   * event = Evento
   *
   * IMPORTANTE:
   * La modalidad NO se determina por el día de la semana.
   */
  const [mode, setMode] =
    useState<ReservationMode>('stay');

  const [selection, setSelection] = useState({
    start: '',
    end: '',
  });

  const [error, setError] = useState('');

  async function refresh() {
    try {
      const response = await fetch(
        '/api/reservas',
        {
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error);
      }

      setReservations(
        data.reservations || []
      );

      setBlocks(
        data.blocks || []
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo cargar la disponibilidad.'
      );
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  /*
   * Cuando el usuario cambia entre ESTADÍA y EVENTO,
   * borramos la selección anterior.
   *
   * Esto evita mezclar:
   * - un ingreso/egreso de estadía
   * con
   * - un día de evento.
   */
  function changeMode(
    newMode: ReservationMode
  ) {
    setMode(newMode);

    setSelection({
      start: '',
      end: '',
    });
  }

  /*
   * Cuando Calendar selecciona fechas,
   * simplemente guardamos lo que eligió.
   *
   * Calendar ya sabe si debe comportarse como
   * ESTADÍA o como EVENTO gracias a "mode".
   */
  function handlePick(
    start: string,
    end: string
  ) {
    setSelection({
      start,
      end,
    });
  }

  return (
    <main>
      <header className="hero">
        <div className="brand">
          <Image
            src="/logo.png"
            alt="Los Abuelos Chacra"
            width={180}
            height={180}
            priority
          />
        </div>

        <div className="eyebrow">
          ESCAPADA DE FIN DE SEMANA
        </div>

        <h1>
          LOS ABUELOS CHACRA
        </h1>

        <p>
          Reservá tu estadía y disfrutá
          de la tranquilidad del campo.
        </p>

        <a
          className="hero-cta"
          href="#reservar"
        >
          CONSULTAR DISPONIBILIDAD
        </a>

        <div className="hero-line" />
      </header>

      <section
        className="booking"
        id="reservar"
      >
        <div className="section-title">
          <span>01</span>

          <div>
            <h2>
              Elegí qué querés reservar
            </h2>

            <p>
              Primero elegí la modalidad y
              después seleccioná la fecha.
            </p>
          </div>
        </div>

        {error && (
          <div className="message">
            {error}
          </div>
        )}

        {/*
         * ============================
         * SELECTOR DE MODALIDAD
         * ============================
         */}
        <div
          className="reservation-mode"
          aria-label="Tipo de reserva"
        >
          <button
            type="button"
            className={
              mode === 'stay'
                ? 'active'
                : ''
            }
            onClick={() =>
              changeMode('stay')
            }
          >
            <strong>
              ESTADÍA
            </strong>

            <span>
              Quedarse a dormir
            </span>

            <small>
              {money(PRICING.stayPerNight)}
              {' '}por noche
            </small>
          </button>

          <button
            type="button"
            className={
              mode === 'event'
                ? 'active'
                : ''
            }
            onClick={() =>
              changeMode('event')
            }
          >
            <strong>
              EVENTO
            </strong>

            <span>
              Evento de un día
            </span>

            <small>
              {money(PRICING.eventPerDay)}
              {' '}por día
            </small>
          </button>
        </div>

        {/*
         * Texto explicativo según la modalidad.
         */}
        <div className="capacity-note">
          {mode === 'stay' ? (
            <>
              <b>
                ESTADÍA
              </b>

              <span>
                Elegí una fecha de ingreso y
                una fecha de egreso.
                La estadía tiene un mínimo de
                2 noches y una capacidad máxima
                de {PRICING.maxPeople} personas.
              </span>
            </>
          ) : (
            <>
              <b>
                EVENTO
              </b>

              <span>
                Elegí un único día.
                Los eventos tienen una tarifa
                de {money(PRICING.eventPerDay)}
                {' '}por día y
                {` ${money(PRICING.eventSpecialPerDay)}`}
                {' '}en fechas especiales.
              </span>
            </>
          )}
        </div>

        {/*
         * ============================
         * CALENDARIO
         * ============================
         *
         * AHORA LE PASAMOS "mode".
         *
         * Esto es justamente lo que faltaba
         * y provocaba el error de TypeScript.
         */}
        <Calendar
          reservations={reservations}
          blocks={blocks}
          mode={mode}
          onPick={handlePick}
        />

        {/*
         * ============================
         * TARIFAS
         * ============================
         *
         * La estadía es $100.000 por noche
         * cualquier día.
         *
         * Ya NO mostramos una diferencia
         * artificial entre semana y fin de semana.
         */}
        <section
          className="rates rates-inline"
          aria-label="Tarifas"
        >
          <div>
            <small>
              ESTADÍA
            </small>

            <strong>
              {money(PRICING.stayPerNight)}
            </strong>

            <span>
              Por noche · cualquier día
            </span>
          </div>

          <div>
            <small>
              EVENTO
            </small>

            <strong>
              {money(PRICING.eventPerDay)}
            </strong>

            <span>
              Por día · tarifa normal
            </span>
          </div>

          <div>
            <small>
              EVENTO · ESPECIAL
            </small>

            <strong>
              {money(
                PRICING.eventSpecialPerDay
              )}
            </strong>

            <span>
              Por día · fechas especiales
            </span>
          </div>
        </section>

        {/*
         * Formulario:
         * también recibe "mode".
         *
         * Si es EVENTO:
         * - un solo día
         * - precio de evento
         *
         * Si es ESTADÍA:
         * - ingreso + egreso
         * - precio de estadía
         */}
        {selection.start && (
          <ReservationForm
            start={selection.start}
            end={selection.end}
            mode={mode}
            onDone={refresh}
          />
        )}
      </section>

      <section className="info">
        <div>
          <b>
            Reserva
          </b>

          <span>
            La solicitud queda pendiente y
            se confirma con una seña del{' '}
            {PRICING.depositPercent * 100}%.
          </span>
        </div>

        <div>
          <b>
            Clima
          </b>

          <span>
            {RAIN_TEXT}
          </span>
        </div>

        <div>
          <b>
            Pago
          </b>

          <span>
            Después de solicitar la reserva
            recibirás el alias para realizar
            la seña y el enlace para enviar
            el comprobante.
          </span>
        </div>
      </section>

      <footer>
        <span>
          LOS ABUELOS · CHACRA
        </span>

        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </a>

        <a href="#reservar">
          Consultar disponibilidad
        </a>

        <small>
          ALIAS: {ALIAS} · Cuenta Mercado Pago
        </small>
      </footer>
    </main>
  );
}
