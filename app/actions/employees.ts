"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { PLAN_LIMITS, PLAN_LIMIT_ERROR } from "@/src/lib/plans";

export async function getEmployees(businessId: string) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase
            .from("employees")
            .select("*")
            .eq("business_id", businessId)
            .order("created_at", { ascending: true });

        if (error) return { error: error.message };
        return { success: true, data };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
    }
}

export async function createEmployee(
    businessId: string,
    name: string,
    role: string,
    avatar?: string,
    userId?: string,
) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { error: "Not authenticated" };

        const { data: business } = await supabase
            .from("businesses")
            .select("owner_id, plan")
            .eq("id", businessId)
            .single();

        if (business?.owner_id !== user.id) return { error: "Unauthorized" };

        const plan = (business?.plan ?? "free") as "free" | "growth";
        const limit = PLAN_LIMITS[plan].employees;
        if (limit !== Infinity) {
            const { count } = await supabase
                .from("employees")
                .select("*", { count: "exact", head: true })
                .eq("business_id", businessId);
            if ((count ?? 0) >= limit) return { error: PLAN_LIMIT_ERROR };
        }

        // Generate a claim token so the employee can link their account later.
        // Skip if the owner is pre-linking their own user_id (sole-operator flow).
        const claimToken = userId ? null : crypto.randomUUID();
        const claimExpiresAt = claimToken
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            : null;

        const { data, error } = await supabase
            .from("employees")
            .insert({
                business_id: businessId,
                name,
                role,
                avatar: avatar || null,
                user_id: userId || null,
                claim_token: claimToken,
                claim_expires_at: claimExpiresAt,
            })
            .select()
            .single();

        if (error) return { error: error.message };
        return { success: true, data };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
    }
}

/** Regenerates a fresh 7-day claim token for an unclaimed employee record. */
export async function generateClaimToken(employeeId: string) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { error: "Not authenticated" };

        // Only the business owner may regenerate tokens.
        const { data: employee } = await supabase
            .from("employees")
            .select("business_id, user_id")
            .eq("id", employeeId)
            .single();

        if (!employee) return { error: "Employee not found" };
        if (employee.user_id) return { error: "Employee already claimed" };

        const { data: business } = await supabase
            .from("businesses")
            .select("owner_id")
            .eq("id", employee.business_id)
            .single();

        if (business?.owner_id !== user.id) return { error: "Unauthorized" };

        const claimToken = crypto.randomUUID();
        const claimExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from("employees")
            .update({ claim_token: claimToken, claim_expires_at: claimExpiresAt, updated_at: new Date().toISOString() })
            .eq("id", employeeId)
            .select()
            .single();

        if (error) return { error: error.message };
        return { success: true, data };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
    }
}

/** Fetches public employee + business info for a claim token (no auth required). */
export async function getEmployeeByClaimToken(token: string) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase
            .from("employees")
            .select("id, name, role, avatar, user_id, claim_expires_at, businesses(id, name, logo)")
            .eq("claim_token", token)
            .single();

        if (error || !data) return { error: "Invalid or expired invite link" };
        if (data.user_id) return { error: "This invite has already been claimed" };

        const expiresAt = data.claim_expires_at ? new Date(data.claim_expires_at) : null;
        if (expiresAt && expiresAt < new Date()) return { error: "This invite link has expired" };

        return { success: true, data };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
    }
}

/** Links the current user's account to the employee record identified by token. */
export async function claimEmployee(token: string) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { error: "Not authenticated" };

        const { data, error } = await supabase.rpc("claim_employee", { p_token: token });

        if (error) {
            if (error.message.includes("INVALID_OR_EXPIRED_TOKEN"))
                return { error: "This invite link is invalid or has expired." };
            if (error.message.includes("ALREADY_EMPLOYEE"))
                return { error: "You are already an employee at another business." };
            return { error: error.message };
        }

        return { success: true, data };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
    }
}

export async function deleteEmployee(employeeId: string) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { error: "Not authenticated" };

        const { data: employee } = await supabase
            .from("employees")
            .select("business_id")
            .eq("id", employeeId)
            .single();

        if (!employee) return { error: "Employee not found" };

        const { data: business } = await supabase
            .from("businesses")
            .select("owner_id")
            .eq("id", employee.business_id)
            .single();

        if (business?.owner_id !== user.id) return { error: "Unauthorized" };

        const { error } = await supabase
            .from("employees")
            .delete()
            .eq("id", employeeId);

        if (error) return { error: error.message };
        return { success: true };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
    }
}

/** Ensures the business owner has their own employee record (for sole-operator mode). */
export async function getOrCreateOwnerEmployee(businessId: string) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { error: "Not authenticated" };

        // Return existing record if present
        const { data: existing } = await supabase
            .from("employees")
            .select("*")
            .eq("business_id", businessId)
            .eq("user_id", user.id)
            .single();

        if (existing) return { success: true, data: existing };

        const { data: profile } = await supabase
            .from("users")
            .select("name, avatar")
            .eq("id", user.id)
            .single();

        const { data, error } = await supabase
            .from("employees")
            .insert({
                business_id: businessId,
                user_id: user.id,
                name: profile?.name ?? "Owner",
                role: "Owner",
                avatar: profile?.avatar ?? null,
            })
            .select()
            .single();

        if (error) return { error: error.message };
        return { success: true, data };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
    }
}
