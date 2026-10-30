import "server-only";
import type { MessageRow } from "../db-types";
import { adminClient } from "../supabase/admin";

/** Best-effort in-app notification; never throws (a failed message must not fail the action that sent it). */
export async function notify(
  userId: string,
  msg: Pick<MessageRow, "kind" | "title" | "body"> & { link?: string | null },
): Promise<void> {
  try {
    await adminClient().from("messages").insert({ user_id: userId, ...msg });
  } catch {
    /* ignore */
  }
}
