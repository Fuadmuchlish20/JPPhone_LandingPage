import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <section className="section" style={{ paddingTop: 32 }}>
      <div className="container">
        <nav className="admin-tabs">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/hosts">Hosts</Link>
          <Link href="/admin/devices">Devices</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/codes">Redeem codes</Link>
          <Link href="/admin/topups">Top-ups</Link>
        </nav>
        {children}
      </div>
    </section>
  );
}
