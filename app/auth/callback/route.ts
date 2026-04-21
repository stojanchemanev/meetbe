import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { UserRole } from "@/src/types";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const role = (searchParams.get("role") as UserRole) ?? UserRole.CLIENT;

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=oauth`);
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
        return NextResponse.redirect(`${origin}/login?error=oauth`);
    }

    const { data: profile } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", data.user.id)
        .single();

    if (!profile) {
        await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email,
            name:
                data.user.user_metadata?.full_name ??
                data.user.user_metadata?.name ??
                data.user.email,
            role,
            avatar: data.user.user_metadata?.avatar_url ?? null,
        });
    }

    const userRole = profile?.role ?? role;
    const redirectPath =
        userRole === UserRole.BUSINESS
            ? "/dashboard/business"
            : "/dashboard/client";

    return NextResponse.redirect(`${origin}${redirectPath}`);
}
