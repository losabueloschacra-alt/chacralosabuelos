'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import Calendar from '../components/Calendar';
import ReservationForm from '../components/ReservationForm';
import type { Block, Reservation } from '../lib/types';
import { ALIAS, PRICING, RAIN_TEXT, WHATSAPP } from '../lib/config';

type ReservationMode = 'stay' | 'event';

export default function Home() {
  const [mode, setMode] = useState<ReservationMode>('stay');

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);

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

        <h1>LOS ABUELOS CHACRA</h1>

        <p>
          Reservá tu estadía y disfrutá de la tranquilidad
          del campo.
        </p>

        <a className="hero-cta" href="#reservar">
          CONSULTAR DISPONIBILIDAD
        </a>

        <div className="hero-line" />
      </header>

      <section className="booking" id="reservar">

        <div className="section-title">
          <span>01</span>

          <div>
            <h2>Elegí qué querés reservar</h2>

            <p>
              Seleccioná estadía o evento para consultar
              disponibilidad.
            </p>
          </div>
        </div>

        <div className="reservation-type-selector">

          <button
            type="button"
            className={
              mode === 'stay'
                ? 'reservation-type active'
                : 'reservation-type'
            }
            onClick={() => changeMode('stay')}
          >
            <strong>ESTADÍA</strong>

            <span>
              Desde $100.000 por noche
            </span>

            <small>
              Mínimo 2 noches · hasta 8 personas
            </small>
          </button>

          <button
            type="button"
            className={
              mode === 'event'
                ? 'reservation-type active'
                : 'reservation-type'
            }
            onClick={() => changeMode('event')}
          >
            <strong>EVENTO</strong>

            <span>
              Desde $200.000 por día
            </span>

            <small>
              Modalidad masiva · un solo día
            </small>
          </button>

        </div>

        {mode === 'stay' && (
          <div className="type-description">
            <b>ESTADÍA</b>

            <span>
              Elegí tu fecha de ingreso y egreso. El valor es
              de ${PRICING.stayPerNight.toLocaleString('es-AR')}
              por noche, con un mínimo de 2 noches.
            </span>
          </div>
        )}

        {mode === 'event' && (
          <div className="type-description">
            <b>EVENTO</b>

            <span>
              Elegí un único día. El valor normal es de
              ${PRICING.eventPerDay.toLocaleString('es-AR')}
              . Las fechas especiales tienen una tarifa
              diferencial.
            </span>
          </div>
        )}

        {loading && (
          <div className="message">
            Cargando disponibilidad...
          </div>
        )}

        {error && (
          <div className="message">
            {error}
          </div>
        )}

        <Calendar
          reservations={reservations}
          blocks={blocks}
          mode={mode}
          onPick={handlePick}
        />

        <section
          className="rates rates-inline"
          aria-label="Tarifas"
        >

          <div>
            <small>ESTADÍA</small>

            <strong>
              $100.000
            </strong>

            <span>
              Por noche · mínimo 2 noches
            </span>
          </div>

          <div>
            <small>EVENTO</small>

            <strong>
              $200.000
            </strong>

            <span>
              Un día · modalidad masiva
            </span>
          </div>

          <div>
            <small>FECHAS ESPECIALES</small>

            <strong>
              $250.000
            </strong>

            <span>
              Eventos en fechas especiales
            </span>
          </div>

        </section>

        <div className="capacity-note">

          <b>Capacidad</b>

          <span>
            Estadías para quedarse a dormir: hasta{' '}
            {PRICING.maxPeople} personas. Los eventos son
            modalidad masiva y no tienen ese límite.
          </span>

        </div>

        <ReservationForm
          start={selection.start}
          end={selection.end}
          mode={mode}
          onDone={handleDone}
        />

      </section>

      <section className="info">

        <div>
          <b>Reserva</b>

          <span>
            La solicitud queda pendiente y se confirma con
            una seña del {PRICING.depositPercent * 100}%.
          </span>
        </div>

        <div>
          <b>Horarios</b>

          <span>
            Estadías: ingreso 14:00 · egreso 11:00.
          </span>
        </div>

        <div>
          <b>Clima</b>

          <span>
            {RAIN_TEXT}
          </span>
        </div>

        <div>
          <b>Pago</b>

          <span>
            Después de solicitar la reserva recibirás el
            alias para realizar la seña y el enlace para
            enviar el comprobante.
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
