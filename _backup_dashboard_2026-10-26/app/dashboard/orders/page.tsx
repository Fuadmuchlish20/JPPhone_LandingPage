import type { Metadata } from "next";
import { getMyOrders } from "@/lib/account/queries";
import { requireUser } from "@/lib/auth";
import { OrdersView } from "./orders-view";

export const metadata: Metadata = { title: "Order History" };

export default async function OrdersPage() {
  await requireUser();
  return <OrdersView orders={await getMyOrders()} />;
}
