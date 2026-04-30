"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type Timeslot = {
    id: string;
    employee_id: string;
    business_id: string;
    start_time: string;
    end_time: string;
    is_booked: boolean;
};

export type SaveTimeslotsPayload = {
    businessId: string;
    employeeId: string;
    create: { start_time: string; end_time: string }[];
    deleteIds: string[];
};

async function verifyOwnership(supabase: Awaited<ReturnType<typeof createClient>>, businessId: string, userId: string) {
    const { data: business } = await supabase
        .from("businesses")
        .select("owner_id")
        .eq("id", businessId)
        .single();
    return business?.owner_id === userId;
}

export async function getTimeslots(
    businessId: string,
    employeeId: string,
    startDate: Date,
    endDate: Date,
): Promise<{ data: Timeslot[] | null; error: string | null }> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Unauthorized" };

    const isOwner = await verifyOwnership(supabase, businessId, user.id);
    if (!isOwner) return { data: null, error: "Unauthorized" };

    const { data, error } = await supabase
        .from("timeslots")
        .select("id, employee_id, business_id, start_time, end_time, is_booked")
        .eq("business_id", businessId)
        .eq("employee_id", employeeId)
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString())
        .order("start_time", { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data: data as Timeslot[], error: null };
}

export async function saveTimeslots(
    payload: SaveTimeslotsPayload,
): Promise<{ success: boolean; created: number; deleted: number; error?: string }> {
    const { businessId, employeeId, create, deleteIds } = payload;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, created: 0, deleted: 0, error: "Unauthorized" };

    const isOwner = await verifyOwnership(supabase, businessId, user.id);
    if (!isOwner) return { success: false, created: 0, deleted: 0, error: "Unauthorized" };

    let deleted = 0;
    if (deleteIds.length > 0) {
        const { error: deleteError } = await supabase
            .from("timeslots")
            .delete()
            .in("id", deleteIds)
            .eq("business_id", businessId)
            .eq("employee_id", employeeId)
            .eq("is_booked", false);

        if (deleteError) return { success: false, created: 0, deleted: 0, error: deleteError.message };
        deleted = deleteIds.length;
    }

    let created = 0;
    if (create.length > 0) {
        const rows = create.map((s) => ({
            business_id: businessId,
            employee_id: employeeId,
            start_time: s.start_time,
            end_time: s.end_time,
            is_booked: false,
        }));

        const { error: insertError } = await supabase.from("timeslots").insert(rows);
        if (insertError) return { success: false, created: 0, deleted, error: insertError.message };
        created = create.length;
    }

    return { success: true, created, deleted };
}
