import { OrderStatus, type Order } from "@omardtf/shared-types";
import { updateStatus } from "@/app/orders/actions";
import { money, shortDate } from "@/lib/format";

const STATUS_FLOW = [OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.READY, OrderStatus.DELIVERED];

/** One order with its items and one-click status buttons. */
export default function OrderCard({ order }: { order: Order }) {
  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">{order.customerName}</h2>
        <span className="text-sm text-neutral-500">{shortDate(order.createdAt)}</span>
      </div>
      <p className="text-sm text-neutral-600">
        <a href={`mailto:${order.customerEmail}`} className="underline">{order.customerEmail}</a> · {order.customerPhone}
      </p>
      <ul className="mt-3 space-y-0.5 text-sm">
        {order.items.map((i) => (
          <li key={i.id}>
            {i.quantity}× product {i.productId} · {i.size} · {i.color} · {money(i.price)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm font-medium">
        {money(order.totalAmount)} <span className="font-normal capitalize text-neutral-500">via {order.paymentMethod.replace(/_/g, " ")}</span>
      </p>
      <form action={updateStatus} className="mt-3 flex flex-wrap gap-2">
        <input type="hidden" name="id" value={order.id} />
        {STATUS_FLOW.map((s) => (
          <button
            key={s}
            name="status"
            value={s}
            disabled={s === order.status}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs disabled:bg-neutral-900 disabled:text-white"
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </form>
    </article>
  );
}
