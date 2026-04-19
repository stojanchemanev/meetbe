export type Plan = "free" | "growth";

export const PLAN_LIMITS = {
    free: { services: 3, employees: 2, clients: 10 },
    growth: { services: Infinity, employees: Infinity, clients: Infinity },
} as const;

/** Sentinel returned by server actions when a plan limit is hit. */
export const PLAN_LIMIT_ERROR = "PLAN_LIMIT_REACHED";

export function planLabel(plan: Plan): string {
    return plan === "growth" ? "Growth" : "Free";
}
