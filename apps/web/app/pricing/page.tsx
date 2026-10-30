import Link from "next/link";
import type { Metadata } from "next";
import { getPlans } from "@/lib/devices/queries";
import { formatPrice, formatRam } from "@/lib/format";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const plans = await getPlans();
  return (
    <section className="section">
      <div className="container">
        <h1>Pricing</h1>
        <p className="muted">Every plan runs 24/7. Cancel any time.</p>
        <div className="grid grid-3" style={{ marginTop: 28 }}>
          {plans.map((p) => (
            <div key={p.id} className="card plan">
              <h3>{p.name}</h3>
              <div className="price">
                {formatPrice(p.price, p.currency)}
                <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>
                  {" "}
                  / {p.period_days} days
                </span>
              </div>
              {p.description && <p className="muted">{p.description}</p>}
              <ul>
                <li>
                  {Number(p.cpu)} vCPU · {formatRam(p.ram_mb)} RAM
                </li>
                <li>{p.storage_gb} GB storage</li>
                <li>
                  Up to {p.max_devices} device{p.max_devices > 1 ? "s" : ""}
                </li>
                <li>{p.idle_stop_minutes ? `Auto-stop after ${p.idle_stop_minutes} min idle` : "Always on"}</li>
              </ul>
              <Link href={`/register?plan=${p.slug}`} className="btn btn-primary" style={{ marginTop: "auto" }}>
                Choose {p.name}
              </Link>
            </div>
          ))}
          {plans.length === 0 && <p className="muted">Plans are not configured yet.</p>}
        </div>
      </div>
    </section>
  );
}
