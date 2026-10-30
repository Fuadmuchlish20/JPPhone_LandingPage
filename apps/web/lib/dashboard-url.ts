// The user dashboard is a separate app. Point NEXT_PUBLIC_DASHBOARD_URL at it (no trailing slash).
export const DASHBOARD_URL = (process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:5173").replace(/\/+$/, "");

/** Link into the dashboard app, e.g. dashboardHref("/wallet/topup"). */
export const dashboardHref = (path = "") => `${DASHBOARD_URL}${path}`;
