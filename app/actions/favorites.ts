"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Favorite } from "@/src/types";

export async function getFavorites(): Promise<{
    data: Favorite[] | null;
    error: string | null;
}> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { data: null, error: "Unauthorized" };

    const { data, error } = await supabase
        .from("favorites")
        .select(
            `
            id,
            client_id,
            business_id,
            created_at,
            business:businesses(id, name, description, category, address, logo, rating)
        `,
        )
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };

    return { data: data as Favorite[], error: null };
}

export async function addFavorite(
    businessId: string,
): Promise<{ error: string | null }> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("favorites")
        .insert({ client_id: user.id, business_id: businessId });

    if (error) return { error: error.message };
    return { error: null };
}

export async function removeFavorite(
    businessId: string,
): Promise<{ error: string | null }> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("client_id", user.id)
        .eq("business_id", businessId);

    if (error) return { error: error.message };
    return { error: null };
}

export async function isFavorite(
    businessId: string,
): Promise<{ favorited: boolean }> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { favorited: false };

    const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("client_id", user.id)
        .eq("business_id", businessId)
        .maybeSingle();

    return { favorited: !!data };
}
