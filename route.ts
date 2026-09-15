import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

async function callScript(body?: unknown, params?: Record<string, string>) {
  if (!scriptUrl) throw new Error('Falta GOOGLE_SCRIPT_URL en las variables de entorno.');
  const url = new URL(scriptUrl);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { ok: res.ok, raw: text }; }
}

export async function GET() {
  try {
    const data = await callScript(undefined, { action: 'availability' });
    return NextResponse.json({ ok: true, reservations: data.reservations || [], blocks: data.blocks || [] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error de disponibilidad' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action !== 'create') return NextResponse.json({ ok: false, error: 'Acción no válida' }, { status: 400 });
    const data = await callScript(body);
    return NextResponse.json(data, { status: data.ok ? 200 : 409 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error al crear la reserva' }, { status: 500 });
  }
}
