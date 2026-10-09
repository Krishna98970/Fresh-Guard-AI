import { NextResponse } from 'next/server';
import { store } from '@/lib/db/store';

export async function GET() {
  const orders = store.getOrders();
  return NextResponse.json({ success: true, orders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, customerAddress, customerPhone, items, status } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    const newOrder = store.createOrder({
      customerName,
      customerAddress,
      customerPhone,
      items,
      status: status || 'INSPECTION',
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
