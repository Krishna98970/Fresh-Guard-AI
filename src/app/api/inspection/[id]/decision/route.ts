import { NextResponse } from 'next/server';
import { store } from '@/lib/db/store';
import { InspectionDecision } from '@/lib/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { decision } = body as { decision: InspectionDecision };

    if (!decision || !['APPROVED', 'REVIEW', 'REJECTED'].includes(decision)) {
      return NextResponse.json(
        { error: 'Valid decision (APPROVED, REVIEW, REJECTED) required' },
        { status: 400 }
      );
    }

    const updated = store.updateInspectionDecision(id, decision);
    if (!updated) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, inspection: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
