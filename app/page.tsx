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
    <main className="site-shell">

      {/* HERO */}

      <header className="hero">
        <div className="hero-inner">

          <div className="hero-logo">
            <Image
              src="/logo.png"
              alt="Los Abuelos Chacra"
              width={190}
              height={190}
              priority
            />
          </div>

          <p className="hero-kicker">
            ESCAPADA · DESCANSO · NATURALEZA
          </p>

          <h1>
            Los Abuelos
            <span>Chacra</span>
          </h1>

          <div className="hero-divider" />

          <p className="hero-description">
            Un lugar para bajar el ritmo, disfrutar del campo
            y compartir momentos especiales.
          </p>

          <a
            className="hero-button"
            href="#reservar"
          >
            CONSULTAR DISPONIBILIDAD
            <span>↓</span>
          </a>

        </div>
      </header>


      {/* PRESENTACIÓN */}

      <section className="intro-section">
        <div className="intro-inner">

          <p className="section-eyebrow">
            LOS ABUELOS CHACRA
          </p>

          <h2>
            Tu momento de descanso
          </h2>

          <p className="intro-text">
            Reservá una estadía para disfrutar de la tranquilidad
            del campo o elegí una fecha para realizar tu evento.
          </p>

        </div>
      </section>


      {/* RESERVAS */}

      <section
        className="booking-section"
        id="reservar"
      >

        <div className="booking-container">

          <div className="booking-heading">

            <div>
              <p className="section-eyebrow">
                RESERVAS
              </p>

              <h2>
                Elegí cómo querés disfrutar la chacra
              </h2>

              <p>
                Seleccioná el tipo de reserva y después elegí
                la fecha en el calendario.
              </p>
            </div>

          </div>


          {/* SELECTOR */}

          <div className="reservation-switch">

            <button
              type="button"
              className={
                mode === 'stay'
                  ? 'switch-option active'
                  : 'switch-option'
              }
              onClick={() => changeMode('stay')}
            >
              <span className="switch-number">
                01
              </span>

              <span className="switch-content">
                <strong>ESTADÍA</strong>

                <small>
                  Descanso y alojamiento
                </small>
              </span>

              <span className="switch-arrow">
                →
              </span>
            </button>


            <button
              type="button"
              className={
                mode === 'event'
                  ? 'switch-option active'
                  : 'switch-option'
              }
              onClick={() => changeMode('event')}
            >
              <span className="switch-number">
                02
              </span>

              <span className="switch-content">
                <strong>EVENTO</strong>

                <small>
                  Celebraciones y encuentros
                </small>
              </span>

              <span className="switch-arrow">
                →
              </span>
            </button>

          </div>


          {/* DESCRIPCIÓN DEL MODO */}

          <div className="mode-intro">

            {mode === 'stay' ? (
              <>
                <div className="mode-icon">
                  01
                </div>

                <div>
                  <strong>
                    Estadía
                  </strong>

                  <p>
                    Desde {money(PRICING.stayPerNight)} por noche.
                    Mínimo 2 noches y hasta{' '}
                    {PRICING.maxPeople} personas.
                  </p>

                  <span className="mode-details">
                    Ingreso 14:00 · Egreso 11:00
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="mode-icon">
                  02
                </div>

                <div>
                  <strong>
                    Evento
                  </strong>

                  <p>
                    Una fecha exclusiva para tu evento.
                    Modalidad masiva, sin límite de 8 personas.
                  </p>

                  <span className="mode-details">
                    Tarifa desde {money(PRICING.eventPerDay)}
                  </span>
                </div>
              </>
            )}

          </div>


          {/* CALENDARIO */}

          <div className="calendar-section">

            <div className="calendar-heading">
              <div>
                <p className="section-eyebrow">
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

              <div className="calendar-season">
                DIC 2026
                <span>—</span>
                FEB 2027
              </div>
            </div>


            {loading && (
              <div className="status-message">
                <span className="status-dot" />
                Cargando disponibilidad...
              </div>
            )}

            {error && (
              <div className="status-message error">
                {error}
              </div>
            )}


            <Calendar
              reservations={reservations}
              blocks={blocks}
              mode={mode}
              onPick={handlePick}
            />

          </div>


          {/* INFORMACIÓN DE TARIFAS */}

          <div className="booking-details">

            <div className="detail-card">

              <span className="detail-label">
                ESTADÍA
              </span>

              <strong>
                {money(PRICING.stayPerNight)}
              </strong>

              <p>
                por noche
              </p>

              <div className="detail-line" />

              <span>
                Mínimo 2 noches · hasta {PRICING.maxPeople} personas
              </span>

            </div>


            <div className="detail-card">

              <span className="detail-label">
                EVENTO
              </span>

              <strong>
                {money(PRICING.eventPerDay)}
              </strong>

              <p>
                por día
              </p>

              <div className="detail-line" />

              <span>
                Modalidad masiva · un único día
              </span>

            </div>


            <div className="detail-card special-card">

              <span className="detail-label">
                FECHAS ESPECIALES
              </span>

              <strong>
                Tarifas diferenciales
              </strong>

              <p>
                Navidad y Año Nuevo
              </p>

              <div className="detail-line" />

              <span>
                Se informan automáticamente al seleccionar la fecha.
              </span>

            </div>

          </div>


          {/* INFORMACIÓN COMPLEMENTARIA */}

          <div className="reservation-notes">

            <div>
              <span className="note-number">
                01
              </span>

              <div>
                <strong>
                  Estadías
                </strong>

                <p>
                  Ingreso a las 14:00 y egreso a las 11:00.
                  Capacidad máxima de {PRICING.maxPeople} personas.
                </p>
              </div>
            </div>


            <div>
              <span className="note-number">
                02
              </span>

              <div>
                <strong>
                  Eventos
                </strong>

                <p>
                  Modalidad masiva y reserva de una única fecha.
                  No se aplica el límite de personas de las estadías.
                </p>
              </div>
            </div>


            <div>
              <span className="note-number">
                03
              </span>

              <div>
                <strong>
                  Seña
                </strong>

                <p>
                  Para confirmar la reserva se solicita una seña
                  del {PRICING.depositPercent * 100}%.
                </p>
              </div>
            </div>

          </div>


          {/* FORMULARIO */}

          {selection.start && selection.end && (
            <div className="reservation-form-section">

              <div className="form-heading">
                <p className="section-eyebrow">
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

              <ReservationForm
                start={selection.start}
                end={selection.end}
                onDone={handleDone}
              />

            </div>
          )}

        </div>
      </section>


      {/* LLUVIA / PAGO */}

      <section className="information-section">

        <div className="information-container">

          <div className="information-intro">

            <p className="section-eyebrow">
              INFORMACIÓN
            </p>

            <h2>
              Antes de reservar
            </h2>

          </div>


          <div className="information-grid">

            <article>
              <span className="info-number">
                01
              </span>

              <h3>
                En caso de lluvia
              </h3>

              <p>
                {RAIN_TEXT}
              </p>
            </article>


            <article>
              <span className="info-number">
                02
              </span>

              <h3>
                Confirmación
              </h3>

              <p>
                La solicitud queda pendiente hasta recibir
                la seña correspondiente.
              </p>
            </article>


            <article>
              <span className="info-number">
                03
              </span>

              <h3>
                Pago
              </h3>

              <p>
                Una vez enviada la solicitud recibirás los datos
                necesarios para realizar la seña.
              </p>
            </article>

          </div>

        </div>

      </section>


      {/* FOOTER */}

      <footer className="site-footer">

        <div className="footer-inner">

          <div className="footer-brand">
            <strong>
              Los Abuelos Chacra
            </strong>

            <span>
              Un lugar para disfrutar del campo.
            </span>
          </div>


          <div className="footer-links">

            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>

            <a href="#reservar">
              Reservar
            </a>

          </div>


          <div className="footer-payment">
            <span>
              SEÑA · MERCADO PAGO
            </span>

            <strong>
              {ALIAS}
            </strong>
          </div>

        </div>


        <div className="footer-bottom">
          LOS ABUELOS CHACRA · RESERVAS ONLINE
        </div>

      </footer>

    </main>
  );
}
