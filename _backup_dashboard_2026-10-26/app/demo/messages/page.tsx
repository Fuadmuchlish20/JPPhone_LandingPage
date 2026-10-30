import { notFound } from "next/navigation";
import { MessagesView } from "@/app/dashboard/messages/messages-view";
import { mockMessages } from "../mock";

export default function MessagesPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <MessagesView messages={mockMessages()} backHref="/demo/dashboard" readOnly />;
}
