'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Calendar from '../components/Calendar';
import ReservationForm from '../components/ReservationForm';
import type { Block, Reservation } from '../lib/types';
import { ALIAS, PRICING, RAIN_TEXT, WHATSAPP } from '../lib/config';

const money=(value:number)=>`$${value.toLocaleString('es-AR')}`;

export default function Home(){
 const [reservations,setReservations]=useState<Reservation[]>([]);
 const [blocks,setBlocks]=useState<Block[]>([]);
 const [selection,setSelection]=useState({start:'',end:''});
 const [error,setError]=useState('');
 async function refresh(){try{const r=await fetch('/api/reservas',{cache:'no-store'});const d=await r.json();if(!r.ok||!d.ok) throw new Error(d.error);setReservations(d.reservations||[]);setBlocks(d.blocks||[])}catch(e){setError(e instanceof Error?e.message:'No se pudo cargar la disponibilidad.')}}
 useEffect(()=>{refresh()},[]);
 return <main>
  <header className="hero"><div className="brand"><Image src="/logo.png" alt="Los Abuelos Chacra" width={180} height={180} priority/></div><div className="eyebrow">ESCAPADA DE FIN DE SEMANA</div><h1>LOS ABUELOS CHACRA</h1><p>Reservá tu estadía y disfrutá de la tranquilidad del campo.</p><a className="hero-cta" href="#reservar">CONSULTAR DISPONIBILIDAD</a><div className="hero-line"/></header>
  <section className="booking" id="reservar">
   <div className="section-title"><span>01</span><div><h2>Elegí tus fechas</h2><p>Diciembre 2026 · Enero 2027 · Febrero 2027</p></div></div>
   {error&&<div className="message">{error}</div>}
   <Calendar reservations={reservations} blocks={blocks} onPick={(start,end)=>setSelection({start,end})}/>
   <section className="rates rates-inline" aria-label="Tarifas">
    <div><small>FIN DE SEMANA</small><strong>{money(PRICING.weekend)}</strong><span>Viernes + sábado + domingo</span></div>
    <div><small>SEMANA</small><strong>{money(PRICING.weekday)}</strong><span>Por día · mínimo 2 días</span></div>
    <div><small>EVENTO</small><strong>{money(PRICING.eventPerDay)}</strong><span>Por día · modalidad masiva</span></div>
   </section>
   <div className="capacity-note"><b>Capacidad</b><span>Estadías para quedarse a dormir: hasta {PRICING.maxPeople} personas. Eventos: modalidad masiva, para más personas.</span></div>
   {selection.start&&<ReservationForm start={selection.start} end={selection.end} onDone={refresh}/>} 
  </section>
  <section className="info"><div><b>Reserva</b><span>La solicitud queda pendiente y se confirma con una seña del {PRICING.depositPercent*100}%.</span></div><div><b>Clima</b><span>{RAIN_TEXT}</span></div><div><b>Pago</b><span>Después de solicitar la reserva recibirás el alias para realizar la seña y el enlace para enviar el comprobante.</span></div></section>
  <footer><span>LOS ABUELOS · CHACRA</span><a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">WhatsApp</a><a href="#reservar">Consultar disponibilidad</a><small>ALIAS: {ALIAS} · Cuenta Mercado Pago</small></footer>
 </main>
}
