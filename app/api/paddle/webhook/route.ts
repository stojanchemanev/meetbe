import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Paddle v2 webhook – verifies signature, then syncs subscription state to DB.
//
// Required env vars:
//   PADDLE_WEBHOOK_SECRET        – from Paddle dashboard > Notifications
//   NEXT_PUBLIC_SUPABASE_URL     – already used elsewhere
//   SUPABASE_SERVICE_ROLE_KEY    – service-role key (bypasses RLS for writes)
// ---------------------------------------------------------------------------

function getServiceRoleClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

/** Verify Paddle-Signature header per Paddle v2 spec. */
function verifySignature(
    rawBody: string,
    signatureHeader: string,
    secret: string,
): boolean {
    try {
        const parts = Object.fromEntries(
            signatureHeader.split(";").map((p) => p.split("=")),
        );
        const ts = parts.ts;
        const h1 = parts.h1;
        if (!ts || !h1) return false;

        const expected = createHmac("sha256", secret)
            .update(`${ts}:${rawBody}`)
            .digest("hex");

        return timingSafeEqual(Buffer.from(h1, "hex"), Buffer.from(expected, "hex"));
    } catch {
        return false;
    }
}

export async function POST(req: NextRequest) {
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!secret) {
        return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const rawBody = await req.text();
    const sig = req.headers.get("Paddle-Signature") ?? "";

    if (!verifySignature(rawBody, sig, secret)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event: Record<string, any> = JSON.parse(rawBody);
    const eventType: string = event.event_type ?? "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = event.data ?? {};

    const supabase = getServiceRoleClient();

    // ── subscription.activated / subscription.updated ───────────────────────
    if (
        eventType === "subscription.activated" ||
        eventType === "subscription.updated"
    ) {
        const businessId: string | undefined =
            data.custom_data?.businessId ?? data.custom_data?.business_id;

        if (!businessId) {
            return NextResponse.json(
                { error: "Missing businessId in custom_data" },
                { status: 400 },
            );
        }

        const paddleSubId: string = data.id;
        const paddleCustomerId: string = data.customer_id;
        const status: string = data.status;
        const currentPeriodEnd: string | null =
            data.current_billing_period?.ends_at ?? null;

        // Upsert subscription record
        await supabase.from("subscriptions").upsert(
            {
                business_id: businessId,
                paddle_subscription_id: paddleSubId,
                paddle_customer_id: paddleCustomerId,
                status,
                plan: "growth",
                current_period_end: currentPeriodEnd,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "paddle_subscription_id" },
        );

        // Upgrade business to growth
        if (status === "active" || status === "trialing") {
            await supabase
                .from("businesses")
                .update({ plan: "growth", updated_at: new Date().toISOString() })
                .eq("id", businessId);
        }
    }

    // ── subscription.cancelled / subscription.paused / subscription.past_due ─
    if (
        eventType === "subscription.cancelled" ||
        eventType === "subscription.paused" ||
        eventType === "subscription.past_due"
    ) {
        const paddleSubId: string = data.id;

        // Find which business owns this subscription
        const { data: sub } = await supabase
            .from("subscriptions")
            .select("business_id")
            .eq("paddle_subscription_id", paddleSubId)
            .single();

        if (sub?.business_id) {
            // Mark subscription status
            await supabase
                .from("subscriptions")
                .update({
                    status: data.status,
                    updated_at: new Date().toISOString(),
                })
                .eq("paddle_subscription_id", paddleSubId);

            // Downgrade business to free
            await supabase
                .from("businesses")
                .update({ plan: "free", updated_at: new Date().toISOString() })
                .eq("id", sub.business_id);
        }
    }

    return NextResponse.json({ received: true });
}
