"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { MessageRow } from "@/lib/db-types";
import { formatDate, timeAgo } from "@/lib/format";
import { AccountShell } from "../account-shell";
import { BoltIcon, CheckIcon, ClockIcon, MessageIcon } from "../icons";
import { markMessagesReadAction } from "./actions";

const KIND_ICON = { info: <BoltIcon />, success: <CheckIcon />, warning: <ClockIcon /> } as const;

/** Unread messages are highlighted for this visit, then marked read in the background. */
export function MessagesView({ messages, backHref, readOnly }: { messages: MessageRow[]; backHref?: string; readOnly?: boolean }) {
  const unread = messages.filter((m) => !m.read_at).length;

  useEffect(() => {
    if (!readOnly && unread > 0) void markMessagesReadAction();
  }, [readOnly, unread]);

  return (
    <AccountShell title="Messages" backHref={backHref} actions={unread > 0 ? <span className="ac-count">{unread} new</span> : null}>
      {messages.length === 0 ? (
        <div className="ac-empty">
          <MessageIcon />
          <strong>No messages</strong>
          <span className="muted">Updates about your plan and devices will appear here.</span>
        </div>
      ) : (
        <ul className="ac-list">
          {messages.map((m) => (
            <li key={m.id} className={`ac-item ms-item ms-${m.kind}${m.read_at ? "" : " is-unread"}`}>
              <span className="ac-item-icon">{KIND_ICON[m.kind]}</span>
              <div className="ac-item-main">
                <strong>{m.title}</strong>
                {m.body && <p>{m.body}</p>}
                <span title={formatDate(m.created_at)}>{timeAgo(m.created_at)}</span>
              </div>
              {m.link && (
                <Link href={m.link} className="ms-link">
                  View
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
