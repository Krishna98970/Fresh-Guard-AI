import Link from 'next/link';

export default function FeedbackPage() {
  return <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6">
    <p className="text-sm font-semibold text-emerald-700">Customer portal</p>
    <h1 className="mt-2 text-2xl font-bold text-slate-950">Delivery feedback</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">Customers can check delivery progress and submit a rating after delivery using the private tracking token shared when their order was created.</p>
    <Link href="/track" className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white">Open tracking portal</Link>
  </section>;
}
