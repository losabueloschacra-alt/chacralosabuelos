/**
 * Los Abuelos Chacra — backend Google Apps Script + Google Sheets.
 * La aplicación Next.js nunca recibe credenciales de Google.
 */
const SHEET_NAME = 'Reservas';
const BLOCKS_SHEET = 'Bloqueos';
const HEADERS = ['id','createdAt','name','phone','email','type','start','end','days','people','total','deposit','status','notes'];
const BLOCK_HEADERS = ['id','start','end','reason','createdAt'];
const PRICING = { weekend:280000, weekday:100000, eventPerDay:200000, depositPercent:0.5, maxPeople:8 };
const SPECIALS = [
  { label:'Navidad', dates:['2026-12-24','2026-12-25'], price:350000 },
  { label:'Año Nuevo', dates:['2026-12-31','2027-01-01'], price:400000 }
];

function json(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function getSheet(name, headers){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  let sh=ss.getSheetByName(name);
  if(!sh) sh=ss.insertSheet(name);
  if(sh.getLastRow()===0) sh.appendRow(headers);
  return sh;
}
function setup(){ getSheet(SHEET_NAME,HEADERS); getSheet(BLOCKS_SHEET,BLOCK_HEADERS); }
function records(name, headers){
  const sh=getSheet(name,headers); const values=sh.getDataRange().getValues();
  return values.slice(1).filter(r=>r[0]).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]])));
}
function isoDate(d){ return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
function parseDate(s){ const [y,m,d]=String(s).split('-').map(Number); return new Date(y,m-1,d,12,0,0); }
function addDays(s,n){ const d=parseDate(s); d.setDate(d.getDate()+n); return isoDate(d); }
function daysBetween(start,end){ return Math.round((parseDate(end)-parseDate(start))/86400000); }
function datesRange(start,end){ const n=daysBetween(start,end); return Array.from({length:n},(_,i)=>addDays(start,i)); }
function isFridayToSunday(start,end){ return parseDate(start).getDay()===5 && daysBetween(start,end)===3; }
function specialGroups(start,end){ const selected=new Set(datesRange(start,end)); return SPECIALS.filter(g=>g.dates.some(d=>selected.has(d))); }
function calculateTotal(type,start,end){
  const days=daysBetween(start,end); const groups=specialGroups(start,end); const specialDates=new Set(groups.flatMap(g=>g.dates));
  const normalDays=datesRange(start,end).filter(d=>!specialDates.has(d)).length;
  let normalTotal;
  let specialTotal=0;
  if(type==='event'){
    const specialDateSet=new Set(SPECIALS.flatMap(g=>g.dates));
    const selectedDates=datesRange(start,end);
    const specialDays=selectedDates.filter(d=>specialDateSet.has(d)).length;
    const normalEventDays=selectedDates.length-specialDays;
    normalTotal=normalEventDays*PRICING.eventPerDay;
    specialTotal=specialDays*250000;
  }else{
    normalTotal=isFridayToSunday(start,end)&&groups.length===0 ? PRICING.weekend : normalDays*PRICING.weekday;
    specialTotal=groups.reduce((s,g)=>s+g.price,0);
  }
  return {total:normalTotal+specialTotal,days};
}
function activeReservation(r){ return r.status==='PENDIENTE'||r.status==='CONFIRMADA'; }
function overlaps(a,b){ return a.start < b.end && b.start < a.end && activeReservation(b); }
function overlapsBlock(a,b){ return a.start < b.end && b.start < a.end; }
function availability(){
  return { reservations: records(SHEET_NAME,HEADERS).filter(activeReservation).map(r=>({id:r.id,type:r.type,start:r.start,end:r.end,status:r.status,people:Number(r.people)||0})), blocks: records(BLOCKS_SHEET,BLOCK_HEADERS) };
}
function validateCreate(data){
  if(!data.name||!data.phone||!data.email) return 'Completá nombre, teléfono y email.';
  if(!['weekend','week','event'].includes(data.type)) return 'Tipo de reserva inválido.';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(data.start)||!/^\d{4}-\d{2}-\d{2}$/.test(data.end)) return 'Fechas inválidas.';
  const days=daysBetween(data.start,data.end); if(days<1) return 'El rango de fechas no es válido.';
  if(data.type!=='event' && days<2) return 'La estadía tiene un mínimo de 2 días.';
  if(data.type==='weekend' && !isFridayToSunday(data.start,data.end)) return 'El fin de semana debe ser exactamente viernes a domingo.';
  if(data.type!=='event' && (!Number.isInteger(Number(data.people))||Number(data.people)<1||Number(data.people)>PRICING.maxPeople)) return `La capacidad máxima es de ${PRICING.maxPeople} personas.`;
  return '';
}
function findRow(sh, id){ const values=sh.getDataRange().getValues(); const idCol=HEADERS.indexOf('id'); for(let i=1;i<values.length;i++) if(String(values[i][idCol])===String(id)) return i+1; return 0; }

function doGet(e){
  const action=e.parameter.action||'availability';
  if(action==='availability') return json({ok:true,...availability()});
  if(action==='admin-list') return json({ok:true,reservations:records(SHEET_NAME,HEADERS),blocks:records(BLOCKS_SHEET,BLOCK_HEADERS)});
  return json({ok:false,error:'Acción no válida'});
}

function doPost(e){
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try{
    setup(); const data=JSON.parse(e.postData.contents||'{}');
    if(data.action==='create'){
      const validation=validateCreate(data); if(validation) return json({ok:false,error:validation});
      const candidate={start:data.start,end:data.end,status:'PENDIENTE'};
      const existing=records(SHEET_NAME,HEADERS); const blocks=records(BLOCKS_SHEET,BLOCK_HEADERS);
      if(existing.some(r=>overlaps(candidate,r))) return json({ok:false,error:'Esas fechas acaban de ser tomadas. Elegí otras fechas.'});
      if(blocks.some(b=>overlapsBlock(candidate,b))) return json({ok:false,error:'Alguna de las fechas seleccionadas está bloqueada.'});
      const calc=calculateTotal(data.type,data.start,data.end); const total=calc.total; const deposit=total*PRICING.depositPercent;
      const id=Utilities.getUuid();
      getSheet(SHEET_NAME,HEADERS).appendRow([id,data.createdAt||new Date().toISOString(),String(data.name).trim(),String(data.phone).trim(),String(data.email).trim(),data.type,data.start,data.end,calc.days,data.type==='event'?0:Number(data.people),total,deposit,'PENDIENTE',String(data.notes||'').trim()]);
      return json({ok:true,id,total,deposit,status:'PENDIENTE'});
    }
    if(data.op==='status'){
      if(!['PENDIENTE','CONFIRMADA','LIBERADA','CANCELADA'].includes(data.status)) return json({ok:false,error:'Estado inválido'});
      const sh=getSheet(SHEET_NAME,HEADERS); const row=findRow(sh,data.id); if(!row) return json({ok:false,error:'Reserva no encontrada'});
      sh.getRange(row,HEADERS.indexOf('status')+1).setValue(data.status); return json({ok:true});
    }
    if(data.op==='block'){
      if(!data.start||!data.end||data.end<=data.start) return json({ok:false,error:'Rango de bloqueo inválido.'});
      const candidate={start:data.start,end:data.end}; const existing=records(SHEET_NAME,HEADERS).filter(activeReservation); const blocks=records(BLOCKS_SHEET,BLOCK_HEADERS);
      if(existing.some(r=>overlaps(candidate,r))) return json({ok:false,error:'El rango se cruza con una reserva activa.'});
      if(blocks.some(b=>overlapsBlock(candidate,b))) return json({ok:false,error:'El rango ya está bloqueado.'});
      const id=Utilities.getUuid(); getSheet(BLOCKS_SHEET,BLOCK_HEADERS).appendRow([id,data.start,data.end,String(data.reason||''),new Date().toISOString()]); return json({ok:true,id});
    }
    if(data.op==='unblock'){
      const sh=getSheet(BLOCKS_SHEET,BLOCK_HEADERS); const values=sh.getDataRange().getValues(); const idCol=BLOCK_HEADERS.indexOf('id');
      for(let i=1;i<values.length;i++) if(String(values[i][idCol])===String(data.id)){sh.deleteRow(i+1);return json({ok:true});}
      return json({ok:false,error:'Bloqueo no encontrado'});
    }
    return json({ok:false,error:'Acción no válida'});
  }finally{lock.releaseLock();}
}
