/**
 * Transactional Emails
 *
 * All app emails (booking requests, capacity alerts, etc.) are sent via Resend.
 * Auth emails (magic link, password reset, verification) are handled by Supabase.
 *
 * Templates live in /emails and are rendered server-side with @react-email/render.
 */

import { resend, resolveRecipient } from "@/src/lib/resend";

const FROM = process.env.RESEND_FROM_EMAIL!;

export async function sendBookingRequestEmail({
    ownerEmail,
    businessName,
    clientName,
    serviceName,
    slotDate,
    slotTime,
}: {
    ownerEmail: string;
    businessName: string;
    clientName: string;
    serviceName: string;
    slotDate: string;
    slotTime: string;
}) {
    const [{ render }, React, { default: BookingRequest }] = await Promise.all([
        import("@react-email/render"),
        import("react"),
        import("@/emails/BookingRequest"),
    ]);

    const html = await render(
        React.createElement(BookingRequest, {
            businessName,
            clientName,
            serviceName,
            slotDate,
            slotTime,
        }),
    );

    const { error } = await resend.emails.send({
        from: FROM,
        to: resolveRecipient(ownerEmail),
        subject: `New booking request from ${clientName} at ${businessName}`,
        html,
    });

    if (error) console.error("[resend] sendBookingRequestEmail:", error);
}

export async function sendCapacityNotificationEmail({
    ownerEmail,
    businessName,
    clientName,
}: {
    ownerEmail: string;
    businessName: string;
    clientName: string;
}) {
    const [{ render }, React, { default: CapacityNotification }] = await Promise.all([
        import("@react-email/render"),
        import("react"),
        import("@/emails/CapacityNotification"),
    ]);

    const html = await render(
        React.createElement(CapacityNotification, { businessName, clientName }),
    );

    const { error } = await resend.emails.send({
        from: FROM,
        to: resolveRecipient(ownerEmail),
        subject: `${clientName} tried to book at ${businessName} — client limit reached`,
        html,
    });

    if (error) console.error("[resend] sendCapacityNotificationEmail:", error);
}

export async function sendAppointmentConfirmedEmail({
    clientEmail,
    clientName,
    businessName,
    serviceName,
    slotDate,
    slotTime,
}: {
    clientEmail: string;
    clientName: string;
    businessName: string;
    serviceName: string;
    slotDate: string;
    slotTime: string;
}) {
    const [{ render }, React, { default: AppointmentConfirmed }] = await Promise.all([
        import("@react-email/render"),
        import("react"),
        import("@/emails/AppointmentConfirmed"),
    ]);

    const html = await render(
        React.createElement(AppointmentConfirmed, {
            clientName,
            businessName,
            serviceName,
            slotDate,
            slotTime,
        }),
    );

    const { error } = await resend.emails.send({
        from: FROM,
        to: resolveRecipient(clientEmail),
        subject: `Your appointment at ${businessName} is confirmed`,
        html,
    });

    if (error) console.error("[resend] sendAppointmentConfirmedEmail:", error);
}

export async function sendAppointmentCancelledEmail({
    clientEmail,
    clientName,
    businessName,
    serviceName,
    slotDate,
    slotTime,
    cancellationReason,
}: {
    clientEmail: string;
    clientName: string;
    businessName: string;
    serviceName: string;
    slotDate: string;
    slotTime: string;
    cancellationReason?: string;
}) {
    const [{ render }, React, { default: AppointmentCancelled }] = await Promise.all([
        import("@react-email/render"),
        import("react"),
        import("@/emails/AppointmentCancelled"),
    ]);

    const html = await render(
        React.createElement(AppointmentCancelled, {
            clientName,
            businessName,
            serviceName,
            slotDate,
            slotTime,
            cancellationReason,
        }),
    );

    const { error } = await resend.emails.send({
        from: FROM,
        to: resolveRecipient(clientEmail),
        subject: `Your appointment at ${businessName} has been cancelled`,
        html,
    });

    if (error) console.error("[resend] sendAppointmentCancelledEmail:", error);
}
