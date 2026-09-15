import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';
const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
const adminSecret = process.env.ADMIN_SECRET;
const COOKIE = 'los_abuelos_admin';

function token() { return adminSecret ? createHmac('sha256', adminSecret).update('los-abuelos-admin-session').digest('hex') : ''; }
function authorized(req: NextRequest) {
  if (!adminSecret) return false;
  const value = req.cookies.get(COOKIE)?.value || '';
  const expected = token();
  try { return value.length === expected.length && timingSafeEqual(Buffer.from(value), Buffer.from(expected)); } catch { return false; }
}
async function callScript(body?: unknown, params?: Record<string,string>) {
  if (!scriptUrl) throw new Error('Falta GOOGLE_SCRIPT_URL.');
  const url = new URL(scriptUrl);
  Object.entries(params || {}).forEach(([k,v]) => url.searchParams.set(k,v));
  const res = await fetch(url.toString(), { method: body ? 'POST' : 'GET', headers: body ? {'Content-Type':'application/json'} : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return {ok:res.ok, raw:text}; }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.action === 'login') {
    if (!adminSecret || body.secret !== adminSecret) return NextResponse.json({ok:false,error:'Clave incorrecta'}, {status:401});
    const response = NextResponse.json({ok:true});
    response.cookies.set(COOKIE, token(), { httpOnly:true, secure:process.env.NODE_ENV === 'production', sameSite:'lax', path:'/', maxAge:60*60*8 });
    return response;
  }
  if (!authorized(req)) return NextResponse.json({ok:false,error:'No autorizado'}, {status:401});
  if (!['status','block','unblock'].includes(body.op)) return NextResponse.json({ok:false,error:'Acción no válida'}, {status:400});
  const data = await callScript(body);
  return NextResponse.json(data, {status:data.ok ? 200 : 409});
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ok:false,error:'No autorizado'}, {status:401});
  try { return NextResponse.json(await callScript(undefined, {action:'admin-list'})); }
  catch (e) { return NextResponse.json({ok:false,error:e instanceof Error ? e.message : 'Error'}, {status:500}); }
}
