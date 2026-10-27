/** Shown instead of a crash when the store API can't be reached. */
export default function ApiUnavailable({ what = "products" }: { what?: string }) {
  return (
    <div role="status" className="border border-stone-200 bg-white p-6 text-center">
      <p className="font-display text-lg uppercase tracking-wide">We&apos;re having trouble loading {what}</p>
      <p className="mt-2 text-sm text-stone-600">
        Please refresh in a moment. If it keeps happening, message us on WhatsApp and we&apos;ll help with your order.
      </p>
    </div>
  );
}
