import { notFound } from "next/navigation";
import { OrdersView } from "@/app/dashboard/orders/orders-view";
import { mockOrders } from "../mock";

export default function OrdersPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <OrdersView orders={mockOrders()} backHref="/demo/dashboard" />;
}
