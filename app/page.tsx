'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import Calendar from '../components/Calendar';
import ReservationForm from '../components/ReservationForm';
import type { Block, Reservation } from '../lib/types';
import { ALIAS, PRICING, RAIN_TEXT, WHATSAPP } from '../lib/config';

type ReservationMode = 'stay' | 'event';

const money = (value: number) =>
  `$${value.toLocaleString('es-AR')}`;

export default function Home() {
  const [mode, setMode] =
    useState<ReservationMode>('stay');

  const [reservations, setReservations] =
    useState<Reservation[]>([]);

  const [blocks, setBlocks] =
    useState<Block[]>([]);

  const [selection, setSelection] = useState({
    start: '',
    end: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/reservas', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            data.message ||
            'No se pudo cargar la disponibilidad.'
        );
      }

      setReservations(data.reservations || []);
      setBlocks(data.blocks || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar la disponibilidad.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function changeMode(newMode: ReservationMode) {
    setMode(newMode);

    setSelection({
      start: '',
      end: '',
    });
  }

  function handlePick(start: string, end: string) {
    setSelection({
      start,
      end,
    });
  }

  function handleDone() {
    setSelection({
      start: '',
      end: '',
    });

    refresh();
  }

  return (
    <>
      <main className="chacra-site">

        {/* =========================
            HEADER
        ========================= */}

        <header className="topbar">
          <div className="topbar-inner">

            <a href="#" className="brand">
              <Image
                src="/logo.png"
                alt="Chacra Los Abuelos"
                width={165}
                height={110}
                priority
                className="brand-logo"
              />
            </a>

            <nav className="desktop-nav">
              <a href="#inicio">Inicio</a>
              <a href="#reservar">Reservas</a>
              <a href="#precios">Precios</a>
              <a href="#informacion">Información</a>
            </nav>

            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="whatsapp-button"
            >
              <span className="whatsapp-icon">◔</span>
              Escribinos por WhatsApp
            </a>

          </div>
        </header>


        {/* =========================
            HERO
        ========================= */}

        <section className="hero-new" id="inicio">

          <div className="hero-image">
            <Image
              src="/hero-chacra.png"
              alt="Paisaje de Chacra Los Abuelos"
              fill
              priority
              sizes="100vw"
              className="hero-photo"
            />
          </div>

          <div className="hero-overlay" />

          <div className="hero-content">

            <p className="hero-small">
              BIENVENIDOS A
            </p>

            <h1>
              Chacra
              <span>Los Abuelos</span>
            </h1>

            <p className="hero-text">
              Un lugar tranquilo en el campo,
              <br className="desktop-break" />
              para disfrutar, descansar y compartir.
            </p>

            <a
              href="#reservar"
              className="primary-button"
            >
              <span>Consultar disponibilidad</span>
              <strong>→</strong>
            </a>

          </div>

          <div className="hero-bottom-label">
            ESCAPADA · DESCANSO · NATURALEZA
          </div>

        </section>


        {/* =========================
            INTRO
        ========================= */}

        <section className="intro-new">

          <div className="intro-decoration">
            <span />
            <span />
          </div>

          <p className="eyebrow">
            CHACRA LOS ABUELOS
          </p>

          <h2>
            Un lugar para
            <br />
            bajar el ritmo.
          </h2>

          <p className="intro-description">
            Disfrutá de la tranquilidad del campo,
            compartí momentos especiales y encontrá
            tu próximo descanso en Chacra Los Abuelos.
          </p>

        </section>


        {/* =========================
            RESERVAS
        ========================= */}

        <section
          className="booking-new"
          id="reservar"
        >

          <div className="booking-header">

            <div>
              <p className="eyebrow">
                RESERVÁ TU ESTADÍA
              </p>

              <h2>
                Elegí la opción que
                <br className="desktop-break" />
                mejor se adapte a vos
              </h2>

              <p className="booking-description">
                Seleccioná el tipo de reserva, elegí las fechas
                y completá el formulario.
              </p>
            </div>

          </div>


          {/* SELECTOR */}

          <div className="mode-selector">

            <button
              type="button"
              onClick={() => changeMode('stay')}
              className={
                mode === 'stay'
                  ? 'mode-button selected'
                  : 'mode-button'
              }
            >
              <span className="mode-icon">⌂</span>

              <span>
                <strong>ESTADÍA</strong>
                <small>Descanso y alojamiento</small>
              </span>

              <b>→</b>
            </button>


            <button
              type="button"
              onClick={() => changeMode('event')}
              className={
                mode === 'event'
                  ? 'mode-button selected'
                  : 'mode-button'
              }
            >
              <span className="mode-icon">□</span>

              <span>
                <strong>EVENTO</strong>
                <small>Celebraciones y encuentros</small>
              </span>

              <b>→</b>
            </button>

          </div>


          {/* TARJETAS DE PRECIO */}

          <div
            className="price-overview"
            id="precios"
          >

            <div className="price-card">

              <div className="price-card-top">
                <span className="price-symbol">⌂</span>

                <span className="price-tag">
                  ESTADÍA
                </span>
              </div>

              <h3>
                {money(PRICING.stayPerNight)}
              </h3>

              <p>
                por noche
              </p>

              <div className="price-line" />

              <small>
                Mínimo 2 noches
                <br />
                Hasta {PRICING.maxPeople} personas
              </small>

            </div>


            <div className="price-card">

              <div className="price-card-top">
                <span className="price-symbol">□</span>

                <span className="price-tag">
                  EVENTO
                </span>
              </div>

              <h3>
                {money(PRICING.eventPerDay)}
              </h3>

              <p>
                por día
              </p>

              <div className="price-line" />

              <small>
                Modalidad masiva
                <br />
                Un único día
              </small>

            </div>


            <div className="price-card special">

              <div className="price-card-top">
                <span className="price-symbol">✦</span>

                <span className="price-tag">
                  FECHAS ESPECIALES
                </span>
              </div>

              <h3>
                Tarifas
                <br />
                diferenciales
              </h3>

              <p>
                Navidad y Año Nuevo
              </p>

              <div className="price-line" />

              <small>
                La tarifa se informa
                <br />
                al seleccionar la fecha.
              </small>

            </div>

          </div>


          {/* DISPONIBILIDAD */}

          <div className="availability-box">

            <div className="availability-header">

              <div>
                <p className="eyebrow">
                  DISPONIBILIDAD
                </p>

                <h3>
                  {mode === 'stay'
                    ? 'Elegí ingreso y egreso'
                    : 'Elegí el día del evento'}
                </h3>

                <p>
                  {mode === 'stay'
                    ? 'La estadía se calcula por noches. Mínimo 2 noches.'
                    : 'Los eventos se reservan por un único día.'}
                </p>
              </div>

              <div className="calendar-badge">
                CALENDARIO
              </div>

            </div>


            {loading && (
              <div className="loading-message">
                <span />
                Cargando disponibilidad...
              </div>
            )}


            {error && (
              <div className="error-message">
                {error}
              </div>
            )}


            <div className="calendar-wrapper">
              <Calendar
                reservations={reservations}
                blocks={blocks}
                mode={mode}
                onPick={handlePick}
              />
            </div>

          </div>


          {/* INFORMACIÓN DE RESERVA */}

          <div className="reservation-info-grid">

            <article>
              <span className="info-index">
                01
              </span>

              <div>
                <h4>
                  Estadías
                </h4>

                <p>
                  Ingreso 14:00 · Egreso 11:00.
                  Capacidad máxima de {PRICING.maxPeople} personas.
                </p>
              </div>
            </article>


            <article>
              <span className="info-index">
                02
              </span>

              <div>
                <h4>
                  Eventos
                </h4>

                <p>
                  Modalidad masiva y reserva de una única fecha.
                  No se aplica el límite de personas de las estadías.
                </p>
              </div>
            </article>


            <article>
              <span className="info-index">
                03
              </span>

              <div>
                <h4>
                  Seña
                </h4>

                <p>
                  Para confirmar la reserva se solicita una
                  seña del {PRICING.depositPercent * 100}%.
                </p>
              </div>
            </article>

          </div>


          {/* FORMULARIO */}

          {selection.start && selection.end && (
            <div className="form-area">

              <div className="form-intro">

                <p className="eyebrow">
                  ÚLTIMO PASO
                </p>

                <h3>
                  Completá tus datos
                </h3>

                <p>
                  Revisá las fechas seleccionadas y completá
                  la información para enviar tu solicitud.
                </p>

              </div>

              <div className="form-card">
                <ReservationForm
                  start={selection.start}
                  end={selection.end}
                  mode={mode}
                  onDone={handleDone}
                />
              </div>

            </div>
          )}

        </section>


        {/* =========================
            INFORMACIÓN
        ========================= */}

        <section
          className="information-new"
          id="informacion"
        >

          <div className="information-inner">

            <div className="information-title">

              <p className="eyebrow">
                INFORMACIÓN
              </p>

              <h2>
                Todo lo que
                <br />
                necesitás saber.
              </h2>

            </div>


            <div className="information-items">

              <article>

                <div className="info-icon">
                  ☁
                </div>

                <div>
                  <h3>
                    ¿Lluvia?
                  </h3>

                  <p>
                    {RAIN_TEXT}
                  </p>
                </div>

              </article>


              <article>

                <div className="info-icon">
                  $
                </div>

                <div>
                  <h3>
                    Seña y pago
                  </h3>

                  <p>
                    Para confirmar la reserva se solicita una
                    seña. El resto se abona al llegar.
                  </p>
                </div>

              </article>


              <article>

                <div className="info-icon">
                  ◎
                </div>

                <div>
                  <h3>
                    Ubicación
                  </h3>

                  <p>
                    La dirección se comparte una vez
                    confirmada la reserva.
                  </p>
                </div>

              </article>


              <article>

                <div className="info-icon">
                  ◌
                </div>

                <div>
                  <h3>
                    ¿Dudas o consultas?
                  </h3>

                  <p>
                    Escribinos por WhatsApp y te ayudamos.
                  </p>
                </div>

              </article>

            </div>

          </div>

        </section>


        {/* =========================
            CTA WHATSAPP
        ========================= */}

        <section className="final-cta">

          <div>

            <p className="eyebrow">
              CHACRA LOS ABUELOS
            </p>

            <h2>
              ¿Ya estás pensando
              <br />
              en tu próxima escapada?
            </h2>

            <p>
              Consultanos por disponibilidad
              y empezá a planificar tu estadía.
            </p>

            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="primary-button"
            >
              <span>Escribinos por WhatsApp</span>
              <strong>→</strong>
            </a>

          </div>

        </section>


        {/* =========================
            FOOTER
        ========================= */}

        <footer className="new-footer">

          <div className="footer-main">

            <div className="footer-logo">

              <Image
                src="/logo.png"
                alt="Chacra Los Abuelos"
                width={145}
                height={95}
              />

              <p>
                Un lugar para disfrutar,
                <br />
                descansar y compartir.
              </p>

            </div>


            <div className="footer-nav">

              <span>NAVEGACIÓN</span>

              <a href="#inicio">
                Inicio
              </a>

              <a href="#reservar">
                Reservas
              </a>

              <a href="#precios">
                Precios
              </a>

              <a href="#informacion">
                Información
              </a>

            </div>


            <div className="footer-contact">

              <span>CONTACTO</span>

              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>

              <p>
                SEÑA · MERCADO PAGO
              </p>

              <strong>
                {ALIAS}
              </strong>

            </div>

          </div>


          <div className="footer-bottom">
            <span>
              © 2026 Chacra Los Abuelos
            </span>

            <span>
              RESERVAS ONLINE
            </span>
          </div>

        </footer>

      </main>


      {/* =========================
          ESTILOS
      ========================= */}

      <style jsx global>{`

        :root {
          --chacra-blue: #63b5d1;
          --chacra-blue-dark: #398da9;
          --chacra-blue-light: #e8f5f8;
          --chacra-cream: #f8f5ed;
          --chacra-cream-dark: #eee9dc;
          --chacra-ink: #24383c;
          --chacra-muted: #718084;
          --chacra-line: #dce2df;
          --chacra-white: #ffffff;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: var(--chacra-cream);
          color: var(--chacra-ink);
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button {
          font-family: inherit;
        }

        .chacra-site {
          overflow: hidden;
          background: var(--chacra-cream);
        }

        /* HEADER */

        .topbar {
          position: relative;
          z-index: 20;
          background: rgba(255,255,255,0.96);
          border-bottom: 1px solid rgba(36,56,60,0.08);
        }

        .topbar-inner {
          width: min(1240px, calc(100% - 64px));
          min-height: 88px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
        }

        .brand {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .brand-logo {
          width: 155px;
          height: auto;
          object-fit: contain;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 34px;
          margin-left: auto;
        }

        .desktop-nav a {
          font-size: 13px;
          color: #46585c;
          transition: color 0.2s ease;
        }

        .desktop-nav a:hover {
          color: var(--chacra-blue-dark);
        }

        .whatsapp-button {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 13px 20px;
          border-radius: 999px;
          background: var(--chacra-blue);
          color: white;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .whatsapp-button:hover {
          transform: translateY(-2px);
          background: var(--chacra-blue-dark);
        }

        .whatsapp-icon {
          font-size: 17px;
        }

        /* HERO */

        .hero-new {
          position: relative;
          min-height: min(720px, calc(100vh - 88px));
          display: flex;
          align-items: center;
          isolation: isolate;
        }

        .hero-image {
          position: absolute;
          inset: 0;
          z-index: -3;
        }

        .hero-photo {
          object-fit: cover;
          object-position: center 55%;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          z-index: -2;
          background:
            linear-gradient(
              90deg,
              rgba(19,35,37,0.62) 0%,
              rgba(19,35,37,0.31) 42%,
              rgba(19,35,37,0.05) 75%
            );
        }

        .hero-content {
          width: min(1240px, calc(100% - 64px));
          margin: 0 auto;
          padding: 100px 0;
          color: white;
        }

        .hero-small {
          margin: 0 0 16px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 4px;
        }

        .hero-content h1 {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(58px, 7vw, 102px);
          line-height: 0.91;
          font-weight: 400;
          letter-spacing: -4px;
          max-width: 700px;
        }

        .hero-content h1 span {
          display: block;
        }

        .hero-text {
          margin: 30px 0 34px;
          font-size: 17px;
          line-height: 1.65;
          color: rgba(255,255,255,0.92);
        }

        .primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          min-width: 250px;
          padding: 16px 19px 16px 23px;
          border-radius: 999px;
          background: var(--chacra-blue);
          color: white;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.2px;
          transition:
            transform 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .primary-button strong {
          display: grid;
          place-items: center;
          width: 29px;
          height: 29px;
          border-radius: 50%;
          background: rgba(255,255,255,0.22);
          font-size: 17px;
        }

        .primary-button:hover {
          transform: translateY(-2px);
          background: var(--chacra-blue-dark);
          box-shadow: 0 12px 30px rgba(25,70,80,0.2);
        }

        .hero-bottom-label {
          position: absolute;
          bottom: 25px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255,255,255,0.85);
          font-size: 9px;
          letter-spacing: 3px;
          white-space: nowrap;
        }

        /* INTRO */

        .intro-new {
          position: relative;
          text-align: center;
          padding: 125px 25px 120px;
          background: var(--chacra-cream);
        }

        .intro-decoration {
          width: 50px;
          margin: 0 auto 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .intro-decoration span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--chacra-blue);
        }

        .eyebrow {
          margin: 0 0 16px;
          color: var(--chacra-blue-dark);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3px;
        }

        .intro-new h2 {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(44px, 5vw, 68px);
          line-height: 1.02;
          font-weight: 400;
          letter-spacing: -2px;
        }

        .intro-description {
          max-width: 570px;
          margin: 27px auto 0;
          color: var(--chacra-muted);
          font-size: 15px;
          line-height: 1.75;
        }

        /* BOOKING */

        .booking-new {
          width: min(1240px, calc(100% - 64px));
          margin: 0 auto;
          padding: 0 0 125px;
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: end;
          margin-bottom: 38px;
        }

        .booking-header h2 {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(40px, 4.5vw, 62px);
          line-height: 1.02;
          font-weight: 400;
          letter-spacing: -2px;
        }

        .booking-description {
          max-width: 450px;
          margin: 22px 0 0;
          color: var(--chacra-muted);
          font-size: 14px;
          line-height: 1.7;
        }

        /* MODE SELECTOR */

        .mode-selector {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .mode-button {
          min-height: 90px;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 18px 24px;
          border: 1px solid var(--chacra-line);
          border-radius: 18px;
          background: rgba(255,255,255,0.5);
          color: var(--chacra-ink);
          text-align: left;
          cursor: pointer;
          transition:
            background 0.2s ease,
            border 0.2s ease,
            transform 0.2s ease;
        }

        .mode-button:hover {
          transform: translateY(-2px);
          border-color: var(--chacra-blue);
        }

        .mode-button.selected {
          border-color: var(--chacra-blue);
          background: var(--chacra-blue-light);
        }

        .mode-icon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 50%;
          background: white;
          color: var(--chacra-blue-dark);
          font-size: 19px;
        }

        .mode-button span:nth-child(2) {
          flex: 1;
        }

        .mode-button strong {
          display: block;
          margin-bottom: 5px;
          font-size: 12px;
          letter-spacing: 1.5px;
        }

        .mode-button small {
          color: var(--chacra-muted);
          font-size: 12px;
        }

        .mode-button b {
          color: var(--chacra-blue-dark);
          font-size: 20px;
          font-weight: 400;
        }

        /* PRICE CARDS */

        .price-overview {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 38px;
        }

        .price-card {
          min-height: 235px;
          padding: 27px;
          border: 1px solid var(--chacra-line);
          border-radius: 18px;
          background: rgba(255,255,255,0.68);
        }

        .price-card-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 25px;
        }

        .price-symbol {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: var(--chacra-blue-light);
          color: var(--chacra-blue-dark);
        }

        .price-tag {
          color: var(--chacra-muted);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .price-card h3 {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 30px;
          line-height: 1.1;
          font-weight: 400;
        }

        .price-card > p {
          margin: 6px 0 0;
          color: var(--chacra-muted);
          font-size: 12px;
        }

        .price-line {
          width: 100%;
          height: 1px;
          margin: 20px 0 15px;
          background: var(--chacra-line);
        }

        .price-card small {
          color: var(--chacra-muted);
          font-size: 11px;
          line-height: 1.7;
        }

        .price-card.special {
          background: #f1f4ec;
        }

        /* CALENDAR */

        .availability-box {
          padding: 35px;
          border-radius: 24px;
          background: white;
          border: 1px solid rgba(36,56,60,0.07);
          box-shadow: 0 18px 50px rgba(48,65,65,0.06);
        }

        .availability-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 30px;
          padding-bottom: 30px;
          border-bottom: 1px solid var(--chacra-line);
        }

        .availability-header h3 {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 34px;
          font-weight: 400;
        }

        .availability-header p:last-child {
          margin: 10px 0 0;
          color: var(--chacra-muted);
          font-size: 13px;
        }

        .calendar-badge {
          padding: 10px 14px;
          border-radius: 999px;
          background: var(--chacra-blue-light);
          color: var(--chacra-blue-dark);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          white-space: nowrap;
        }

        .loading-message {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 18px 0;
          color: var(--chacra-muted);
          font-size: 12px;
        }

        .loading-message span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--chacra-blue);
          animation: pulse 1.2s infinite;
        }

        @keyframes pulse {
          0%,100% { opacity: 0.35; }
          50% { opacity: 1; }
        }

        .error-message {
          margin-top: 20px;
          padding: 14px 17px;
          border-radius: 12px;
          background: #fff0ef;
          color: #a34f4b;
          font-size: 12px;
        }

        .calendar-wrapper {
          padding-top: 28px;
        }

        /* INFO RESERVA */

        .reservation-info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 20px;
          border-top: 1px solid var(--chacra-line);
          border-bottom: 1px solid var(--chacra-line);
        }

        .reservation-info-grid article {
          display: flex;
          gap: 18px;
          padding: 30px 28px;
        }

        .reservation-info-grid article + article {
          border-left: 1px solid var(--chacra-line);
        }

        .info-index {
          color: var(--chacra-blue-dark);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .reservation-info-grid h4 {
          margin: 0 0 8px;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 21px;
          font-weight: 400;
        }

        .reservation-info-grid p {
          margin: 0;
          color: var(--chacra-muted);
          font-size: 12px;
          line-height: 1.65;
        }

        /* FORM */

        .form-area {
          margin-top: 65px;
          padding: 45px;
          border-radius: 24px;
          background: var(--chacra-blue-light);
        }

        .form-intro {
          margin-bottom: 28px;
        }

        .form-intro h3 {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 39px;
          font-weight: 400;
        }

        .form-intro > p:last-child {
          max-width: 500px;
          margin: 12px 0 0;
          color: var(--chacra-muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .form-card {
          padding: 25px;
          border-radius: 18px;
          background: white;
        }

        /* INFORMATION */

        .information-new {
          padding: 105px 0;
          background: #ece9df;
        }

        .information-inner {
          width: min(1240px, calc(100% - 64px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: 0.75fr 1.5fr;
          gap: 80px;
        }

        .information-title h2 {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(42px, 4vw, 58px);
          line-height: 1.04;
          font-weight: 400;
          letter-spacing: -2px;
        }

        .information-items {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0;
        }

        .information-items article {
          display: flex;
          gap: 18px;
          padding: 25px 25px 32px 0;
        }

        .information-items article:nth-child(even) {
          padding-left: 25px;
          border-left: 1px solid rgba(36,56,60,0.12);
        }

        .information-items article:nth-child(n+3) {
          padding-top: 32px;
          border-top: 1px solid rgba(36,56,60,0.12);
        }

        .info-icon {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid rgba(57,141,169,0.25);
          border-radius: 50%;
          color: var(--chacra-blue-dark);
          font-size: 17px;
        }

        .information-items h3 {
          margin: 0 0 8px;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 21px;
          font-weight: 400;
        }

        .information-items p {
          margin: 0;
          color: var(--chacra-muted);
          font-size: 12px;
          line-height: 1.65;
        }

        /* FINAL CTA */

        .final-cta {
          padding: 125px 25px;
          text-align: center;
          background: var(--chacra-cream);
        }

        .final-cta h2 {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(42px, 5vw, 65px);
          line-height: 1.02;
          font-weight: 400;
          letter-spacing: -2px;
        }

        .final-cta > div > p:not(.eyebrow) {
          max-width: 470px;
          margin: 22px auto 30px;
          color: var(--chacra-muted);
          font-size: 14px;
          line-height: 1.7;
        }

        /* FOOTER */

        .new-footer {
          background: #dfe8e4;
        }

        .footer-main {
          width: min(1240px, calc(100% - 64px));
          margin: 0 auto;
          padding: 65px 0;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr;
          gap: 70px;
        }

        .footer-logo img {
          width: 145px;
          height: auto;
          object-fit: contain;
          margin-bottom: 12px;
        }

        .footer-logo p {
          margin: 0;
          color: #66767a;
          font-size: 12px;
          line-height: 1.6;
        }

        .footer-nav,
        .footer-contact {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .footer-nav > span,
        .footer-contact > span {
          margin-bottom: 18px;
          color: #627174;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .footer-nav a,
        .footer-contact a {
          margin-bottom: 10px;
          color: #42565a;
          font-size: 12px;
        }

        .footer-nav a:hover,
        .footer-contact a:hover {
          color: var(--chacra-blue-dark);
        }

        .footer-contact p {
          margin: 12px 0 5px;
          color: #718084;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .footer-contact strong {
          color: #42565a;
          font-size: 12px;
        }

        .footer-bottom {
          width: min(1240px, calc(100% - 64px));
          margin: 0 auto;
          padding: 18px 0;
          border-top: 1px solid rgba(36,56,60,0.12);
          display: flex;
          justify-content: space-between;
          color: #758387;
          font-size: 8px;
          letter-spacing: 1.5px;
        }

        /* TABLET */

        @media (max-width: 900px) {

          .desktop-nav {
            display: none;
          }

          .topbar-inner {
            width: min(100% - 36px, 1240px);
          }

          .hero-content {
            width: min(100% - 44px, 1240px);
          }

          .booking-new,
          .information-inner,
          .footer-main,
          .footer-bottom {
            width: min(100% - 44px, 1240px);
          }

          .price-overview {
            grid-template-columns: 1fr 1fr;
          }

          .price-card.special {
            grid-column: span 2;
          }

          .information-inner {
            grid-template-columns: 1fr;
            gap: 45px;
          }

          .footer-main {
            grid-template-columns: 1fr 1fr;
          }

          .footer-logo {
            grid-column: span 2;
          }

        }

        /* MOBILE */

        @media (max-width: 650px) {

          .topbar {
            position: sticky;
            top: 0;
          }

          .topbar-inner {
            width: calc(100% - 28px);
            min-height: 72px;
            gap: 10px;
          }

          .brand-logo {
            width: 112px;
          }

          .whatsapp-button {
            padding: 10px 13px;
            font-size: 10px;
          }

          .whatsapp-icon {
            font-size: 14px;
          }

          /* HERO MOBILE */

          .hero-new {
            min-height: 610px;
          }

          .hero-photo {
            object-position: 57% center;
          }

          .hero-overlay {
            background:
              linear-gradient(
                180deg,
                rgba(20,35,37,0.22) 0%,
                rgba(20,35,37,0.55) 65%,
                rgba(20,35,37,0.72) 100%
              );
          }

          .hero-content {
            width: calc(100% - 36px);
            padding: 120px 0 80px;
            align-self: flex-end;
          }

          .hero-small {
            margin-bottom: 13px;
            font-size: 8px;
            letter-spacing: 2.7px;
          }

          .hero-content h1 {
            font-size: clamp(53px, 15vw, 76px);
            line-height: 0.9;
            letter-spacing: -3px;
          }

          .hero-text {
            margin: 22px 0 25px;
            font-size: 14px;
            line-height: 1.55;
          }

          .desktop-break {
            display: none;
          }

          .primary-button {
            width: 100%;
            min-width: 0;
            padding: 14px 15px 14px 18px;
          }

          .hero-bottom-label {
            bottom: 18px;
            font-size: 7px;
            letter-spacing: 2px;
          }

          /* INTRO MOBILE */

          .intro-new {
            padding: 85px 22px 80px;
          }

          .intro-new h2 {
            font-size: 45px;
            letter-spacing: -1.5px;
          }

          .intro-description {
            font-size: 13px;
            line-height: 1.7;
          }

          /* BOOKING MOBILE */

          .booking-new {
            width: calc(100% - 28px);
            padding-bottom: 85px;
          }

          .booking-header {
            margin-bottom: 25px;
          }

          .booking-header h2 {
            font-size: 41px;
            letter-spacing: -1.5px;
          }

          .booking-description {
            font-size: 13px;
          }

          .mode-selector {
            grid-template-columns: 1fr;
            gap: 9px;
          }

          .mode-button {
            min-height: 78px;
            padding: 14px 16px;
            border-radius: 15px;
          }

          .mode-button small {
            font-size: 11px;
          }

          /* PRICE MOBILE */

          .price-overview {
            grid-template-columns: 1fr;
            gap: 9px;
          }

          .price-card {
            min-height: auto;
            padding: 22px;
            border-radius: 15px;
          }

          .price-card.special {
            grid-column: auto;
          }

          .price-card-top {
            margin-bottom: 17px;
          }

          .price-card h3 {
            font-size: 27px;
          }

          /* CALENDAR MOBILE */

          .availability-box {
            padding: 18px 12px;
            border-radius: 18px;
          }

          .availability-header {
            display: block;
            padding-bottom: 22px;
          }

          .availability-header h3 {
            font-size: 29px;
            line-height: 1.05;
          }

          .availability-header p:last-child {
            font-size: 12px;
            line-height: 1.55;
          }

          .calendar-badge {
            display: inline-block;
            margin-top: 15px;
          }

          .calendar-wrapper {
            padding-top: 20px;
            overflow-x: hidden;
          }

          /* RESERVATION INFO MOBILE */

          .reservation-info-grid {
            grid-template-columns: 1fr;
          }

          .reservation-info-grid article {
            padding: 22px 5px;
          }

          .reservation-info-grid article + article {
            border-left: 0;
            border-top: 1px solid var(--chacra-line);
          }

          /* FORM MOBILE */

          .form-area {
            margin-top: 45px;
            padding: 22px 14px;
            border-radius: 18px;
          }

          .form-intro h3 {
            font-size: 33px;
          }

          .form-card {
            padding: 13px;
            border-radius: 14px;
          }

          /* INFORMATION MOBILE */

          .information-new {
            padding: 80px 0;
          }

          .information-inner {
            width: calc(100% - 28px);
            gap: 35px;
          }

          .information-title h2 {
            font-size: 43px;
          }

          .information-items {
            grid-template-columns: 1fr;
          }

          .information-items article,
          .information-items article:nth-child(even) {
            padding: 22px 0;
            border-left: 0;
          }

          .information-items article + article {
            border-top: 1px solid rgba(36,56,60,0.12);
          }

          .information-items article:nth-child(n+3) {
            padding-top: 22px;
          }

          /* CTA MOBILE */

          .final-cta {
            padding: 85px 20px;
          }

          .final-cta h2 {
            font-size: 43px;
          }

          .final-cta .primary-button {
            width: min(100%, 340px);
          }

          /* FOOTER MOBILE */

          .footer-main {
            width: calc(100% - 28px);
            grid-template-columns: 1fr;
            gap: 38px;
            padding: 50px 0;
          }

          .footer-logo {
            grid-column: auto;
          }

          .footer-bottom {
            width: calc(100% - 28px);
            gap: 10px;
            flex-direction: column;
          }

        }

      `}</style>
    </>
  );
}
