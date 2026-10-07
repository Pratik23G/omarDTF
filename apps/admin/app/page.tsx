import { OrderStatus } from "@omardtf/shared-types";
import ApiErrorNotice from "@/components/ApiErrorNotice";
import RevenueChart from "@/components/RevenueChart";
import { getStats } from "@/lib/api";
import { money } from "@/lib/format";

const STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "Pending",
  [OrderStatus.IN_PROGRESS]: "In progress",
  [OrderStatus.READY]: "Ready",
  [OrderStatus.DELIVERED]: "Delivered",
};

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  let stats;
  try {
    stats = await getStats();
  } catch (error) {
    return <ApiErrorNotice error={error} />;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card label="Total revenue" value={money(stats.totalRevenue)} />
        <Card label="Orders" value={String(stats.orderCount)} />
        <Card label="Avg order" value={money(stats.averageOrderValue)} />
        <Card label="Awaiting fulfilment" value={String(stats.orderCount - stats.statusCounts[OrderStatus.DELIVERED])} />
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Cash tracker</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card label="Collected, not yet delivered" value={money(stats.inProgressValue)} hint="Paid by customers; work still owed" />
          <Card label="Collected and delivered" value={money(stats.deliveredValue)} hint="Paid and fulfilled" />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-2 font-semibold">Revenue, last 30 days</h2>
        <RevenueChart daily={stats.daily} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-2 font-semibold">Orders by status</h2>
          <ul className="space-y-1 text-sm">
            {Object.values(OrderStatus).map((s) => (
              <li key={s} className="flex justify-between">
                <span>{STATUS_LABEL[s]}</span>
                <span className="font-medium">{stats.statusCounts[s]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-2 font-semibold">Revenue by payment method</h2>
          {stats.revenueByMethod.length === 0 ? (
            <p className="text-sm text-neutral-500">No orders yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {stats.revenueByMethod.map((m) => (
                <li key={m.method} className="flex justify-between">
                  <span className="capitalize">{m.method.replace(/_/g, " ")}</span>
                  <span className="font-medium">{money(m.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
