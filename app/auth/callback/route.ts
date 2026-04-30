import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/src/types";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const role = (searchParams.get("role") as UserRole) ?? UserRole.CLIENT;
    const next = searchParams.get("next") ?? null;

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=oauth`);
    }

    const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookies) {
                    cookies.forEach((cookie) => cookiesToSet.push(cookie));
                },
            },
        }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
        return NextResponse.redirect(`${origin}/login?error=oauth`);
    }

    const { data: profile } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", data.user.id)
        .single();

    const meta = data.user.user_metadata ?? {};

    // Parse age from birthday if provided (ISO date or { year, month, day } object)
    let age: number | null = null;
    const rawBirthday = meta.birthday ?? meta.dob ?? meta.birthdate;
    if (rawBirthday) {
        const dateStr = typeof rawBirthday === "object"
            ? `${rawBirthday.year}-${String(rawBirthday.month).padStart(2, "0")}-${String(rawBirthday.day).padStart(2, "0")}`
            : String(rawBirthday);
        const birth = new Date(dateStr);
        if (!isNaN(birth.getTime())) {
            const today = new Date();
            age = today.getFullYear() - birth.getFullYear();
            const hasBirthdayPassed =
                today.getMonth() > birth.getMonth() ||
                (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
            if (!hasBirthdayPassed) age--;
        }
    }

    const phone: string | null =
        meta.phone ?? meta.phone_number ?? meta.phone_numbers?.[0]?.value ?? null;

    const avatar: string | null =
        meta.avatar_url ?? meta.picture ?? null;

    const name: string =
        meta.full_name ?? meta.name ?? data.user.email!;

    if (!profile) {
        await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email,
            name,
            role,
            avatar,
            phone,
            age,
        });
    } else {
        // Keep avatar and name fresh on every login
        await supabase
            .from("users")
            .update({ avatar, name })
            .eq("id", data.user.id);
    }

    const userRole = profile?.role ?? role;
    const defaultPath =
        userRole === UserRole.BUSINESS ? "/dashboard/business" : "/dashboard/client";
    const redirectPath = next ?? defaultPath;

    const response = NextResponse.redirect(`${origin}${redirectPath}`);
    cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
    );
    return response;
}
