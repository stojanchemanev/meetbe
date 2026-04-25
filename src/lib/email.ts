import { Resend } from "resend";
import { render } from "@react-email/render";
import * as React from "react";
import CapacityNotification from "@/emails/CapacityNotification";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCapacityNotificationEmail({
    ownerEmail,
    businessName,
    clientName,
}: {
    ownerEmail: string;
    businessName: string;
    clientName: string;
}) {
    if (
        !process.env.RESEND_API_KEY ||
        process.env.RESEND_API_KEY === "re_your_key_here"
    )
        return;

    const html = await render(
        React.createElement(CapacityNotification, { businessName, clientName }),
    );

    await resend.emails.send({
        from: "MeetMe <notifications@meetme.app>",
        to: ownerEmail,
        subject: `${clientName} tried to book at ${businessName} — client limit reached`,
        html,
    });
}
