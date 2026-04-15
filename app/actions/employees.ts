"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

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
            .select("owner_id")
            .eq("id", businessId)
            .single();

        if (business?.owner_id !== user.id) return { error: "Unauthorized" };

        const { data, error } = await supabase
            .from("employees")
            .insert({
                business_id: businessId,
                name,
                role,
                avatar: avatar || null,
                user_id: userId || null,
            })
            .select()
            .single();

        if (error) return { error: error.message };
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
