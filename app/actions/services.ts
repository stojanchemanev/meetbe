"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function getServices(businessId: string) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase
            .from("services")
            .select("*")
            .eq("business_id", businessId)
            .order("created_at", { ascending: true });

        if (error) return { error: error.message };
        return { success: true, data };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
    }
}

export async function createService(
    businessId: string,
    name: string,
    duration: number,
    price: string,
    description?: string,
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
            .from("services")
            .insert({
                business_id: businessId,
                name,
                duration,
                price,
                description: description || null,
            })
            .select()
            .single();

        if (error) return { error: error.message };
        return { success: true, data };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
    }
}

export async function deleteService(serviceId: string) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { error: "Not authenticated" };

        const { data: service } = await supabase
            .from("services")
            .select("business_id")
            .eq("id", serviceId)
            .single();

        if (!service) return { error: "Service not found" };

        const { data: business } = await supabase
            .from("businesses")
            .select("owner_id")
            .eq("id", service.business_id)
            .single();

        if (business?.owner_id !== user.id) return { error: "Unauthorized" };

        const { error } = await supabase
            .from("services")
            .delete()
            .eq("id", serviceId);

        if (error) return { error: error.message };
        return { success: true };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
    }
}

export async function assignEmployeeToService(
    employeeId: string,
    serviceId: string,
) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { error: "Not authenticated" };

        const { error } = await supabase
            .from("employee_services")
            .insert({ employee_id: employeeId, service_id: serviceId });

        if (error) return { error: error.message };
        return { success: true };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
    }
}

export async function removeEmployeeFromService(
    employeeId: string,
    serviceId: string,
) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { error: "Not authenticated" };

        const { error } = await supabase
            .from("employee_services")
            .delete()
            .eq("employee_id", employeeId)
            .eq("service_id", serviceId);

        if (error) return { error: error.message };
        return { success: true };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
    }
}

/** Returns a map of serviceId → employeeId[] for a given business. */
export async function getEmployeeServicesMap(
    businessId: string,
): Promise<{ data?: Record<string, string[]>; error?: string }> {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Fetch all employee IDs for this business
        const { data: employees, error: empErr } = await supabase
            .from("employees")
            .select("id")
            .eq("business_id", businessId);

        if (empErr) return { error: empErr.message };
        if (!employees?.length) return { data: {} };

        const employeeIds = employees.map((e) => e.id);

        const { data: links, error: linkErr } = await supabase
            .from("employee_services")
            .select("employee_id, service_id")
            .in("employee_id", employeeIds);

        if (linkErr) return { error: linkErr.message };

        const map: Record<string, string[]> = {};
        for (const { employee_id, service_id } of links ?? []) {
            if (!map[service_id]) map[service_id] = [];
            map[service_id].push(employee_id);
        }

        return { data: map };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
    }
}
