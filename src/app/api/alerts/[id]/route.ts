import { NextResponse } from 'next/server';
import { store } from '@/lib/db/store';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.isRead === true) {
    store.markAlertAsRead(id);
    return NextResponse.json({ success: true, message: 'Alert marked as read' });
  }

  return NextResponse.json({ error: 'Unsupported update' }, { status: 400 });
}
