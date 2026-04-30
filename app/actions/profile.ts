"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_S3_SECRET_KEY!,
    },
});

function extractS3Key(url: string): string | null {
    try {
        const { hostname, pathname } = new URL(url);
        const bucket = process.env.AWS_BUCKET_NAME!;
        const region = process.env.AWS_REGION!;
        if (hostname === `${bucket}.s3.${region}.amazonaws.com`) {
            return pathname.slice(1); // strip leading "/"
        }
        return null;
    } catch {
        return null;
    }
}

async function deleteS3Object(url: string) {
    const key = extractS3Key(url);
    if (!key) return;
    try {
        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME!,
                Key: key,
            }),
        );
    } catch {
        // best-effort — don't block the profile update
    }
}

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
    name: string;
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

    // Fetch current avatar so we can delete it from S3 if replaced
    if (payload.avatar !== undefined) {
        const { data: current } = await supabase
            .from("users")
            .select("avatar")
            .eq("id", authUser.id)
            .single();

        if (current?.avatar && current.avatar !== payload.avatar) {
            await deleteS3Object(current.avatar);
        }
    }

    const { error } = await supabase
        .from("users")
        .update({
            name: payload.name.trim(),
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
