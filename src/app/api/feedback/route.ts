import { NextResponse } from 'next/server';
import { store } from '@/lib/db/store';

export async function GET() {
  const feedback = store.getFeedback();
  return NextResponse.json({ success: true, feedback });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newFb = store.addFeedback(body);
    return NextResponse.json({ success: true, feedback: newFb }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
