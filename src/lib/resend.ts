/**
 * Resend Client
 *
 * Singleton Resend instance used across the app to send transactional emails.
 * Auth emails (magic link, password reset, etc.) are handled by Supabase — not this client.
 *
 * @see https://resend.com/docs/send-with-nodejs
 */

import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
    throw new Error(
        "Missing RESEND_API_KEY environment variable. " +
        "Get your API key from https://resend.com/api-keys",
    );
}

export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Resolves the email recipient.
 * In development, all emails are routed to Resend's test address so they
 * appear in the Resend dashboard without hitting real inboxes.
 */
export function resolveRecipient(to: string): string {
    return process.env.NODE_ENV === "development" ? "delivered@resend.dev" : to;
}
