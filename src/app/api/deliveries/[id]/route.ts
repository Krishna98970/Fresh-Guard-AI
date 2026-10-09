import { NextResponse } from 'next/server';
import { store } from '@/lib/db/store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const del = store.getDeliveryById(id);
  if (!del) {
    return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, delivery: del });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.action === 'COMPLETE') {
    const completed = store.completeDelivery(id);
    if (!completed) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, delivery: completed });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
