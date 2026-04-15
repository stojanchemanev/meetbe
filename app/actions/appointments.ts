"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { AppointmentWithRelations } from "@/src/types";

export async function getClientAppointments(): Promise<{
    data: AppointmentWithRelations[] | null;
    error: string | null;
}> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { data: null, error: "Unauthorized" };

    const { data, error } = await supabase
        .from("appointments")
        .select(
            `
            id,
            status,
            cancellation_reason,
            created_at,
            slot:timeslots(start_time, end_time),
            business:businesses(id, name, logo),
            employee:employees(name, role),
            service:services(name, price, duration)
        `,
        )
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };

    return { data: data as AppointmentWithRelations[], error: null };
}

export async function cancelAppointment(
    appointmentId: string,
    reason: string,
): Promise<{ error: string | null }> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    // Verify ownership and get slot_id
    const { data: appointment, error: fetchError } = await supabase
        .from("appointments")
        .select("slot_id, client_id, status")
        .eq("id", appointmentId)
        .single();

    if (fetchError || !appointment) return { error: "Appointment not found" };
    if (appointment.client_id !== user.id) return { error: "Unauthorized" };
    if (appointment.status === "CANCELLED")
        return { error: "Already cancelled" };

    const { error: updateError } = await supabase
        .from("appointments")
        .update({
            status: "CANCELLED",
            cancellation_reason: reason,
            updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

    if (updateError) return { error: updateError.message };

    // Free the timeslot so others can book it
    await supabase
        .from("timeslots")
        .update({ is_booked: false, booked_by: null })
        .eq("id", appointment.slot_id);

    return { error: null };
}
