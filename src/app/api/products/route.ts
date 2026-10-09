import { NextResponse } from 'next/server';
import { store } from '@/lib/db/store';

export async function GET() {
  const products = store.getProducts();
  return NextResponse.json({ success: true, products });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newProd = store.addProduct(body);
    return NextResponse.json({ success: true, product: newProd }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
