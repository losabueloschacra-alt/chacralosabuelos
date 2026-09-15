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

  const [selection, setSelection] =
    useState({
      start: '',
      end: '',
    });

  const [mode, setMode] =
    useState<ReservationMode>('stay');

  const [error, setError] =
    useState('');

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
        throw new Error(
          data.error ||
            'No se pudo cargar la disponibilidad.'
        );
      }

      setReservations(
        data.reservations || []
      );

      setBlocks(
        data.blocks || []
      );

      setError('');
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

  function changeMode(
    nextMode: ReservationMode
  ) {
    setMode(nextMode);

    // Al cambiar entre ESTADÍA y EVENTO
    // empezamos una selección nueva.
    setSelection({
      start: '',
      end: '',
    });
  }

  return (
    <main>

      {/* =========================
          HEADER
      ========================== */}

      <header className="site-header">
        <div className="header-inner">

          <a
            href="#inicio"
            className="site-logo"
          >
            <Image
              src="/logo.png"
              alt="Chacra Los Abuelos"
              width={155}
              height={155}
              priority
            />
          </a>

          <nav className="main-nav">
            <a
              href="#inicio"
              className="active"
            >
              Inicio
            </a>

            <a href="#la-chacra">
              La chacra
            </a>

            <a href="#precios">
              Precios
            </a>

            <a href="#ubicacion">
              Ubicación
            </a>

            <a href="#contacto">
              Contacto
            </a>
          </nav>

          <a
            className="whatsapp-button"
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
          >
            <span>◉</span>
            Escribinos por WhatsApp
          </a>

        </div>
      </header>


      {/* =========================
          HERO
      ========================== */}

      <section
        className="hero-image-section"
        id="inicio"
      >

        <Image
          src="/hero-chacra.png"
          alt="Atardecer en Chacra Los Abuelos"
          fill
          priority
          className="hero-image"
          sizes="100vw"
        />

        <div className="hero-overlay" />

        <div className="hero-content">

          <div className="hero-eyebrow">
            BIENVENIDOS A
          </div>

          <h1>
            Chacra
            <br />
            Los Abuelos
          </h1>

          <p>
            Un lugar tranquilo en el campo,
            <br />
            para disfrutar, descansar y compartir.
          </p>

          <a
            className="hero-availability"
            href="#reservar"
          >
            <span>▣</span>
            Consultar disponibilidad
            <span>→</span>
          </a>

        </div>

      </section>


      {/* =========================
          RESERVA
      ========================== */}

      <section
        className="reservation-section"
        id="reservar"
      >

        <div className="reservation-intro">

          <div className="reservation-eyebrow">
            RESERVÁ TU ESTADÍA
          </div>

          <h2>
            Elegí la opción que
            <br />
            mejor se adapte a vos
          </h2>

          <p>
            Seleccioná las fechas y completá el
            formulario. Te vamos a confirmar la
            disponibilidad y los detalles de tu reserva.
          </p>

          <div className="decorative-line">
            <span>♧</span>
            <i />
          </div>

        </div>


        {/* =========================
            TIPO DE RESERVA
        ========================== */}

        <div className="reservation-type-card">

          <div
            className="reservation-toggle"
            role="group"
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
              <span>▱</span>
              ESTADÍA
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
              <span>▣</span>
              EVENTO
            </button>

          </div>


          <div className="price-options">

            <div className="price-option">

              <div className="price-icon">
                ▱
              </div>

              <h3>
                Estadía
              </h3>

              <span>
                (por noche)
              </span>

              <strong>
                {money(PRICING.stayPerNight)}
              </strong>

              <small>
                Capacidad: {PRICING.maxPeople} personas
              </small>

            </div>


            <div className="price-option">

              <div className="price-icon">
                ▣
              </div>

              <h3>
                Evento
              </h3>

              <span>
                (día completo)
              </span>

              <strong>
                {money(PRICING.eventPerDay)}
              </strong>

              <small>
                Modalidad masiva
              </small>

            </div>

          </div>

        </div>


        {/* =========================
            CALENDARIO
        ========================== */}

        <div className="reservation-calendar">

          <div className="calendar-section-title">
            <span>03</span>
            <div>
              <h3>
                Elegí tus fechas
              </h3>

              <p>
                {mode === 'stay'
                  ? 'Seleccioná ingreso y egreso'
                  : 'Seleccioná el día del evento'}
              </p>
            </div>
          </div>

          {error && (
            <div className="message">
              {error}
            </div>
          )}

          <Calendar
            reservations={reservations}
            blocks={blocks}
            mode={mode}
            onPick={(start, end) =>
              setSelection({
                start,
                end,
              })
            }
          />

        </div>


        {/* =========================
            FORMULARIO
        ========================== */}

        <div className="reservation-form-column">

          {selection.start ? (
            <ReservationForm
              start={selection.start}
              end={selection.end}
              mode={mode}
              onDone={refresh}
            />
          ) : (
            <div className="form-placeholder">

              <div className="reservation-eyebrow">
                COMPLETÁ TUS DATOS
              </div>

              <h3>
                Tu reserva
              </h3>

              <p>
                Elegí primero la fecha en el
                calendario para continuar con
                tus datos.
              </p>

            </div>
          )}

        </div>

      </section>


      {/* =========================
          PRECIOS
      ========================== */}

      <section
        className="prices-section"
        id="precios"
      >

        <div className="prices-title">
          <span>04</span>

          <div>
            <div className="reservation-eyebrow">
              TARIFAS
            </div>

            <h2>
              Precios claros,
              <br />
              sin sorpresas
            </h2>
          </div>
        </div>


        <div className="rates">

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
              EVENTO NORMAL
            </small>

            <strong>
              {money(PRICING.eventPerDay)}
            </strong>

            <span>
              Por día · cualquier día
            </span>
          </div>


          <div>
            <small>
              EVENTO FECHA ESPECIAL
            </small>

            <strong>
              {money(PRICING.eventSpecialPerDay)}
            </strong>

            <span>
              Por día · fechas especiales
            </span>
          </div>

        </div>

      </section>


      {/* =========================
          INFORMACIÓN
      ========================== */}

      <section className="info-section">

        <div
          className="info-item"
          id="la-chacra"
        >
          <div className="info-icon">
            ☁
          </div>

          <h3>
            ¿Lluvia?
          </h3>

          <p>
            {RAIN_TEXT}
          </p>
        </div>


        <div className="info-item">

          <div className="info-icon">
            ◉
          </div>

          <h3>
            Seña y pago
          </h3>

          <p>
            Para confirmar la reserva se solicita
            una seña del{' '}
            {PRICING.depositPercent * 100}%.
            El resto se abona al llegar.
          </p>

        </div>


        <div
          className="info-item"
          id="ubicacion"
        >

          <div className="info-icon">
            ♧
          </div>

          <h3>
            Ubicación
          </h3>

          <p>
            La dirección se comparte una vez
            confirmada la reserva.
          </p>

        </div>


        <div
          className="info-item"
          id="contacto"
        >

          <div className="info-icon">
            ◌
          </div>

          <h3>
            ¿Dudas o consultas?
          </h3>

          <p>
            Escribinos por WhatsApp
            y te ayudamos.
          </p>

        </div>

      </section>


      {/* =========================
          FOOTER
      ========================== */}

      <footer className="site-footer">

        <div className="footer-logo">

          <Image
            src="/logo.png"
            alt="Chacra Los Abuelos"
            width={120}
            height={120}
          />

        </div>


        <nav className="footer-nav">

          <a href="#inicio">
            Inicio
          </a>

          <a href="#la-chacra">
            La chacra
          </a>

          <a href="#precios">
            Precios
          </a>

          <a href="#ubicacion">
            Ubicación
          </a>

          <a href="#contacto">
            Contacto
          </a>

        </nav>


        <div className="footer-social">
          ◎
        </div>


        <small>
          © 2026 Chacra Los Abuelos
        </small>

        <div className="footer-alias">
          ALIAS: {ALIAS}
        </div>

      </footer>

    </main>
  );
}
