import { NextResponse } from 'next/server';
import { store } from '@/lib/db/store';

export async function GET() {
  const deliveries = store.getDeliveries();
  return NextResponse.json({ success: true, deliveries });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newDel = store.createDelivery(body);
    return NextResponse.json({ success: true, delivery: newDel }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
