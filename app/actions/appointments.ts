"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { AppointmentWithRelations } from "@/src/types";
import { PLAN_LIMITS, CLIENT_LIMIT_ERROR } from "@/src/lib/plans";
import { sendCapacityNotificationEmail } from "@/src/lib/email";

export type EmployeeAppointment = {
    id: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED";
    cancellation_reason: string | null;
    created_at: string;
    slot: { start_time: string; end_time: string };
    service: { name: string; price: string; duration: number } | null;
    client: { name: string; avatar: string | null };
    business: { id: string; name: string; logo: string | null };
};

export type BusinessAppointment = {
    id: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED";
    cancellation_reason: string | null;
    created_at: string;
    slot: { start_time: string; end_time: string };
    service: { name: string; price: string; duration: number } | null;
    employee: { id: string; name: string; role: string; avatar: string | null };
    client: { name: string; avatar: string | null; phone: string | null };
};

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

export async function getEmployeeSchedule(): Promise<{
    data: EmployeeAppointment[] | null;
    error: string | null;
}> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Unauthorized" };

    // Find this user's employee record (one business per user enforced)
    const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!employee) return { data: null, error: "No employee record found" };

    const { data, error } = await supabase
        .from("appointments")
        .select(
            `
            id,
            status,
            cancellation_reason,
            created_at,
            slot:timeslots(start_time, end_time),
            service:services(name, price, duration),
            client:users!appointments_client_id_fkey(name, avatar),
            business:businesses(id, name, logo)
        `,
        )
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };

    return { data: data as EmployeeAppointment[], error: null };
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

export async function getBusinessAppointments(): Promise<{
    data: BusinessAppointment[] | null;
    error: string | null;
}> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Unauthorized" };

    const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .single();

    if (!business) return { data: null, error: "Business not found" };

    const { data, error } = await supabase
        .from("appointments")
        .select(
            `
            id,
            status,
            cancellation_reason,
            created_at,
            slot:timeslots(start_time, end_time),
            service:services(name, price, duration),
            employee:employees(id, name, role, avatar),
            client:users!appointments_client_id_fkey(name, avatar, phone)
        `,
        )
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };

    return { data: data as unknown as BusinessAppointment[], error: null };
}

export async function getUniqueClientCount(): Promise<number> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .single();

    if (!business) return 0;

    const { data } = await supabase
        .from("appointments")
        .select("client_id")
        .eq("business_id", business.id)
        .neq("status", "CANCELLED");

    const unique = new Set((data ?? []).map((r) => r.client_id));
    return unique.size;
}

export async function createAppointment(payload: {
    slotId: string;
    businessId: string;
    employeeId: string;
    serviceId: string;
}): Promise<{ error: string | null }> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Enforce: max 1 PENDING appointment per business per client
    const { data: existing } = await supabase
        .from("appointments")
        .select("id")
        .eq("client_id", user.id)
        .eq("business_id", payload.businessId)
        .eq("status", "PENDING")
        .maybeSingle();

    if (existing) {
        return {
            error: "You already have a pending request at this business. Wait for it to be confirmed before booking again.",
        };
    }

    // Enforce plan-based unique-client limit
    const { data: business } = await supabase
        .from("businesses")
        .select("plan, name, owner_id")
        .eq("id", payload.businessId)
        .single();

    const plan = ((business?.plan as string) ?? "free") as "free" | "growth";
    const clientLimit = PLAN_LIMITS[plan].clients;

    if (clientLimit !== Infinity) {
        // Count distinct clients who have at least one non-cancelled appointment
        const { data: clientRows } = await supabase
            .from("appointments")
            .select("client_id")
            .eq("business_id", payload.businessId)
            .neq("status", "CANCELLED");

        const uniqueClientIds = new Set((clientRows ?? []).map((r) => r.client_id));

        // If this client isn't already counted and we're at the limit, block them
        if (!uniqueClientIds.has(user.id) && uniqueClientIds.size >= clientLimit) {
            // Notify the business owner via email (best-effort)
            if (business?.owner_id) {
                const { data: ownerProfile } = await supabase
                    .from("users")
                    .select("email, name")
                    .eq("id", business.owner_id)
                    .single();

                const { data: clientProfile } = await supabase
                    .from("users")
                    .select("name")
                    .eq("id", user.id)
                    .single();

                if (ownerProfile?.email) {
                    sendCapacityNotificationEmail({
                        ownerEmail: ownerProfile.email,
                        businessName: business.name ?? "your business",
                        clientName: clientProfile?.name ?? "A client",
                    }).catch(() => {});
                }
            }

            return { error: CLIENT_LIMIT_ERROR };
        }
    }

    const { error: appointmentError } = await supabase
        .from("appointments")
        .insert({
            slot_id: payload.slotId,
            client_id: user.id,
            business_id: payload.businessId,
            employee_id: payload.employeeId,
            service_id: payload.serviceId,
            status: "PENDING",
        });

    if (appointmentError) return { error: appointmentError.message };

    const { error: slotError } = await supabase
        .from("timeslots")
        .update({ is_booked: true, booked_by: user.id })
        .eq("id", payload.slotId);

    if (slotError) return { error: slotError.message };

    return { error: null };
}

export async function confirmAppointment(
    appointmentId: string,
): Promise<{ error: string | null }> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Verify the appointment belongs to this owner's business
    const { data: appointment } = await supabase
        .from("appointments")
        .select("status, business_id")
        .eq("id", appointmentId)
        .single();

    if (!appointment) return { error: "Appointment not found" };
    if (appointment.status !== "PENDING") return { error: "Appointment is not pending" };

    const { data: business } = await supabase
        .from("businesses")
        .select("owner_id")
        .eq("id", appointment.business_id)
        .single();

    if (business?.owner_id !== user.id) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("appointments")
        .update({ status: "CONFIRMED", updated_at: new Date().toISOString() })
        .eq("id", appointmentId);

    if (error) return { error: error.message };
    return { error: null };
}

export async function cancelAppointmentAsOwner(
    appointmentId: string,
    reason: string,
): Promise<{ error: string | null }> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: appointment } = await supabase
        .from("appointments")
        .select("slot_id, status, business_id")
        .eq("id", appointmentId)
        .single();

    if (!appointment) return { error: "Appointment not found" };
    if (appointment.status === "CANCELLED") return { error: "Already cancelled" };

    const { data: business } = await supabase
        .from("businesses")
        .select("owner_id")
        .eq("id", appointment.business_id)
        .single();

    if (business?.owner_id !== user.id) return { error: "Unauthorized" };

    const { error: updateError } = await supabase
        .from("appointments")
        .update({
            status: "CANCELLED",
            cancellation_reason: reason,
            updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

    if (updateError) return { error: updateError.message };

    await supabase
        .from("timeslots")
        .update({ is_booked: false, booked_by: null })
        .eq("id", appointment.slot_id);

    return { error: null };
}
