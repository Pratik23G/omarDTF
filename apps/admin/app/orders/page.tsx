import Link from "next/link";
import { OrderStatus } from "@omardtf/shared-types";
import ApiErrorNotice from "@/components/ApiErrorNotice";
import OrderCard from "@/components/OrderCard";
import { getOrders } from "@/lib/api";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = Object.values(OrderStatus).find((s) => s === status);

  let orders;
  try {
    orders = await getOrders(filter);
  } catch (error) {
    return <ApiErrorNotice error={error} />;
  }

  const tabs: { label: string; href: string; active: boolean }[] = [
    { label: "All", href: "/orders", active: !filter },
    ...Object.values(OrderStatus).map((s) => ({
      label: s.replace("_", " "),
      href: `/orders?status=${s}`,
      active: filter === s,
    })),
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-6 py-8">
      <h1 className="text-2xl font-bold">Orders</h1>
      <nav className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-full border px-3 py-1 text-sm ${t.active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {orders.length === 0 ? (
        <p className="text-sm text-neutral-500">No orders here yet.</p>
      ) : (
        orders.map((o) => <OrderCard key={o.id} order={o} />)
      )}
    </main>
  );
}
