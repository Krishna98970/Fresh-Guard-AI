import { NextResponse } from 'next/server';
import { store } from '@/lib/db/store';

export async function GET() {
  const alerts = store.getAlerts();
  return NextResponse.json({ success: true, alerts });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newAlert = store.createAlert(body);
    return NextResponse.json({ success: true, alert: newAlert }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
