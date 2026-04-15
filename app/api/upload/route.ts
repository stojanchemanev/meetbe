import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Required env vars:
//   AWS_REGION
//   AWS_ACCESS_KEY_ID
//   AWS_SECRET_ACCESS_KEY
//   AWS_S3_BUCKET_NAME
//
// Install: npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
    try {
        const { filename, contentType, folder = "uploads", sizeBytes } =
            await req.json();

        if (!filename || !contentType) {
            return NextResponse.json(
                { error: "filename and contentType are required" },
                { status: 400 },
            );
        }

        if (!ALLOWED_TYPES.includes(contentType)) {
            return NextResponse.json(
                { error: "Only JPEG, PNG, WEBP, and GIF images are allowed" },
                { status: 400 },
            );
        }

        if (sizeBytes && sizeBytes > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { error: "File size must be 5 MB or less" },
                { status: 400 },
            );
        }

        const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
        const key = `${folder}/${uuidv4()}.${ext}`;
        const bucket = process.env.AWS_S3_BUCKET_NAME!;

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
        const publicUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        return NextResponse.json({ uploadUrl, publicUrl });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Upload error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
