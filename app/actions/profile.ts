"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function getClientProfile() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return { data: null, error: "Not authenticated" };

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
}

export async function updateClientProfile(payload: {
    firstName: string;
    lastName: string;
    phone?: string;
    age?: number | null;
    sex?: string | null;
    address?: string;
    city?: string;
    avatar?: string | null;
}) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return { error: "Not authenticated" };

    const name = [payload.firstName.trim(), payload.lastName.trim()]
        .filter(Boolean)
        .join(" ");

    const { error } = await supabase
        .from("users")
        .update({
            name,
            phone: payload.phone || null,
            age: payload.age || null,
            sex: payload.sex || null,
            address: payload.address || null,
            city: payload.city || null,
            ...(payload.avatar !== undefined && { avatar: payload.avatar }),
            updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);

    if (error) return { error: error.message };
    return { success: true };
}
