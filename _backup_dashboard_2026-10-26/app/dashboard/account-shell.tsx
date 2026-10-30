import Link from "next/link";
import { ArrowLeftIcon } from "./icons";

/** Page frame for Account sub-pages: back arrow + title bar, centered content. */
export function AccountShell({
  title,
  backHref = "/dashboard",
  actions,
  children,
}: {
  title: string;
  backHref?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="ac">
      <header className="ac-top">
        <Link href={backHref} className="nd-top-btn" aria-label="Back to devices">
          <ArrowLeftIcon />
        </Link>
        <h1>{title}</h1>
        <span className="spacer" />
        {actions}
      </header>
      <div className="ac-body">{children}</div>
    </div>
  );
}
