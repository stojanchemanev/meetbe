import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
    const { supabase, supabaseResponse } = createClient(request);

    // Always call getUser() to refresh the session cookie on every request.
    // Without this, expired access tokens are never rotated on non-dashboard pages
    // and onAuthStateChange gets a null session after a reload.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

    if (isDashboard && !user) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
