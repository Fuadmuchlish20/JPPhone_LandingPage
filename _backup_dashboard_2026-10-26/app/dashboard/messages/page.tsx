import type { Metadata } from "next";
import { getMyMessages } from "@/lib/account/queries";
import { requireUser } from "@/lib/auth";
import { MessagesView } from "./messages-view";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  await requireUser();
  return <MessagesView messages={await getMyMessages()} />;
}
