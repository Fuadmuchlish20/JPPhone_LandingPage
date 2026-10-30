import type { PlanRow } from "../db-types";

/**
 * Rental lengths offered for every plan. Price = plan's daily rate × days × factor,
 * so short rentals cost a bit more per day and long ones a bit less.
 */
export const PACKAGES = [
  { days: 3, factor: 1.4 },
  { days: 7, factor: 1.25 },
  { days: 30, factor: 1 },
  { days: 90, factor: 0.9 },
] as const;

export type PackageDays = (typeof PACKAGES)[number]["days"];

/**
 * Active promotion, in percent off the regular price. This is what checkout actually charges,
 * so the crossed-out price shown to users is always the real regular price. Set to 0 to end the promo.
 */
export const DEFAULT_DISCOUNT_PERCENT = 20;
const DISCOUNT_BY_PLAN: Record<string, number> = {}; // e.g. { svip: 30 } to override one plan

export function discountPercent(slug: string): number {
  return Math.min(90, Math.max(0, DISCOUNT_BY_PLAN[slug] ?? DEFAULT_DISCOUNT_PERCENT));
}

const ZERO_DECIMAL = new Set(["IDR", "JPY", "KRW", "VND"]);

function round(amount: number, currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? Math.round(amount / 100) * 100 : Math.round(amount * 100) / 100;
}

export function packagePrice(plan: Pick<PlanRow, "slug" | "price" | "period_days" | "currency">, days: number): {
  /** amount charged (promo applied) */
  total: number;
  /** price before the promo, for the crossed-out display */
  regular: number;
  perDay: number;
  /** long-rental saving vs. the plan's daily rate */
  savePct: number;
  /** promo percent applied to this plan */
  discountPct: number;
} {
  const pkg = PACKAGES.find((p) => p.days === days) ?? { days, factor: 1 };
  const daily = Number(plan.price) / plan.period_days;
  const regular = round(daily * days * pkg.factor, plan.currency);
  const discountPct = discountPercent(plan.slug);
  const total = round((regular * (100 - discountPct)) / 100, plan.currency);
  return { total, regular, perDay: total / days, savePct: Math.round((1 - pkg.factor) * 100), discountPct };
}
