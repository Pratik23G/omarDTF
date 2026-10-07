"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus } from "@omardtf/shared-types";
import { setOrderStatus } from "@/lib/api";

/** Server action behind the status buttons; the API re-checks admin access. */
export async function updateStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!Object.values(OrderStatus).includes(status as OrderStatus)) return;
  await setOrderStatus(id, status as OrderStatus);
  revalidatePath("/orders");
  revalidatePath("/");
}
