import type { DashboardStats } from "@omardtf/shared-types";
import { money } from "@/lib/format";

/** 30-day revenue bars drawn as plain SVG (no chart dependency). */
export default function RevenueChart({ daily }: { daily: DashboardStats["daily"] }) {
  const max = Math.max(...daily.map((d) => d.revenue), 1);
  const barW = 100 / daily.length;

  return (
    <figure>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-48 w-full" role="img" aria-label="Revenue per day, last 30 days">
        {daily.map((d, i) => {
          const h = (d.revenue / max) * 38;
          return (
            <rect key={d.date} x={i * barW + 0.3} y={40 - h} width={barW - 0.6} height={h} className="fill-neutral-900">
              <title>{`${d.date}: ${money(d.revenue)} (${d.orders} orders)`}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-neutral-500">
        <span>{daily[0]?.date}</span>
        <span>peak day {money(max === 1 && daily.every((d) => d.revenue === 0) ? 0 : max)}</span>
        <span>{daily.at(-1)?.date}</span>
      </figcaption>
    </figure>
  );
}
