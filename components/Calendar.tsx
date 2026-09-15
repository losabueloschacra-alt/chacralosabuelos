'use client';
import { useMemo, useState } from 'react';
import { MONTHS, SPECIAL_DATES } from '../lib/config';
import type { Block, Reservation } from '../lib/types';

function iso(y:number,m:number,d:number){return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
function monthDays(y:number,m:number){return new Date(y,m+1,0).getDate()}
function overlaps(day:string,r:Reservation){return day>=r.start && day<r.end && (r.status==='PENDIENTE'||r.status==='CONFIRMADA')}
function blockedByManual(day:string,b:Block){return day>=b.start && day<b.end}

export default function Calendar({reservations,blocks,onPick}:{reservations:Reservation[],blocks:Block[],onPick:(start:string,end:string)=>void}){
  const [monthIndex,setMonthIndex]=useState(0);
  const [start,setStart]=useState('');
  const [end,setEnd]=useState('');
  const m=MONTHS[monthIndex];
  const days=monthDays(m.year,m.month);
  const first=new Date(m.year,m.month,1).getDay();
  const offset=(first+6)%7;
  const cells=useMemo(()=>Array.from({length:offset+days},(_,i)=>i<offset?null:i-offset+1),[offset,days]);
  const isReserved=(day:number)=>reservations.some(r=>overlaps(iso(m.year,m.month,day),r));
  const isBlocked=(day:number)=>blocks.some(b=>blockedByManual(iso(m.year,m.month,day),b));
  const special=(day:number)=>SPECIAL_DATES.find(x=>x.date===iso(m.year,m.month,day));

  function select(d:number){
    const day=iso(m.year,m.month,d);
    if(isReserved(d)||isBlocked(d)) return;
    if(!start || end){ setStart(day); setEnd(''); onPick(day,''); return; }
    if(day<=start){ setStart(day); setEnd(''); return; }
    const span=Math.round((new Date(`${day}T12:00:00`).getTime()-new Date(`${start}T12:00:00`).getTime())/86400000);
    const range=Array.from({length:span},(_,i)=>{
      const dt=new Date(`${start}T12:00:00`); dt.setDate(dt.getDate()+i); return dt.toISOString().slice(0,10);
    });
    if(range.some(x=>reservations.some(r=>overlaps(x,r)) || blocks.some(b=>blockedByManual(x,b)))) return;
    setEnd(day); onPick(start,day);
  }

  return <div className="calendar-card">
    <div className="month-tabs">{MONTHS.map((item,i)=><button key={item.label} className={i===monthIndex?'active':''} onClick={()=>setMonthIndex(i)}>{item.label.replace(' 20','\u00a0')}</button>)}</div>
    <div className="cal-head"><button aria-label="Mes anterior" disabled={monthIndex===0} onClick={()=>setMonthIndex(Math.max(0,monthIndex-1))}>‹</button><div><strong>{m.label}</strong><small>Seleccioná ingreso y salida</small></div><button aria-label="Mes siguiente" disabled={monthIndex===MONTHS.length-1} onClick={()=>setMonthIndex(Math.min(MONTHS.length-1,monthIndex+1))}>›</button></div>
    <div className="weekdays">{['L','M','X','J','V','S','D'].map(x=><span key={x}>{x}</span>)}</div>
    <div className="grid">{cells.map((d,i)=>d===null?<span key={i}/>:<button key={d} aria-label={`${d}/${m.month+1}/${m.year}`} className={`${(isReserved(d)||isBlocked(d))?'blocked ':''}${special(d)?'special ':''}${iso(m.year,m.month,d)===start?'selected ':''}${iso(m.year,m.month,d)===end?'selected end':''}`} onClick={()=>select(d)} disabled={isReserved(d)||isBlocked(d)}><span>{d}</span>{special(d)&&!isReserved(d)&&!isBlocked(d)&&<em>●</em>}</button>)}</div>
    {start&&<div className="selection-hint">Ingreso: <b>{start}</b>{end?<> · Egreso: <b>{end}</b></>:<> · Elegí ahora la fecha de egreso</>}</div>}
    <div className="legend"><span><i className="dot available"/>Disponible</span><span><i className="dot pending"/>Pendiente</span><span><i className="dot booked"/>Reservado</span><span><i className="dot special-dot"/>Fecha especial</span></div>
  </div>
}
