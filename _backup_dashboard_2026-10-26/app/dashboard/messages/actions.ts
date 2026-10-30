"use server";

import { requireUser } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";

/** Marks all of the current user's messages as read (service role, scoped to the caller). */
export async function markMessagesReadAction(): Promise<void> {
  const user = await requireUser();
  await adminClient().from("messages").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
}
