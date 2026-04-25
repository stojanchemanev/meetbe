export type Plan = "free" | "growth";

export const PLAN_LIMITS = {
    free: { services: 3, employees: 1, clients: 10 },
    growth: { services: Infinity, employees: Infinity, clients: Infinity },
} as const;

/** Sentinel returned by server actions when a plan limit is hit. */
export const PLAN_LIMIT_ERROR = "PLAN_LIMIT_REACHED";

/** Sentinel returned when a business has reached their client limit. */
export const CLIENT_LIMIT_ERROR = "CLIENT_LIMIT_REACHED";

export function planLabel(plan: Plan): string {
    return plan === "growth" ? "Growth" : "Free";
}
