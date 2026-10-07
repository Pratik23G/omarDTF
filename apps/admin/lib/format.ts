export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
