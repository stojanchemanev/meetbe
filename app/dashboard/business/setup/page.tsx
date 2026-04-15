"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    Loader2,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/src/components/ui";
import {
    getUserBusiness,
    createBusiness,
    updateBusiness,
} from "@/app/actions/businesses";

const CATEGORIES = [
    "Barber",
    "Beauty Salon",
    "Fitness",
    "Nail Salon",
    "Personal Training",
    "Spa & Wellness",
    "Tattoo & Piercing",
    "Other",
];

const inputClass =
    "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder:text-gray-400 bg-white";

async function uploadLogoToS3(file: File): Promise<string | null> {
    try {
        const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
                folder: "logos",
                sizeBytes: file.size,
            }),
        });
        const { uploadUrl, publicUrl, error } = await res.json();
        if (error) throw new Error(error);

        await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
        });

        return publicUrl;
    } catch {
        return null;
    }
}

export default function BusinessSetupPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [businessId, setBusinessId] = useState<string | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [address, setAddress] = useState("");

    const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        getUserBusiness().then(({ business }) => {
            if (business) {
                setBusinessId(business.id);
                setName(business.name ?? "");
                setDescription(business.description ?? "");
                setCategory(business.category ?? "");
                setAddress(business.address ?? "");
                setCurrentLogoUrl(business.logo ?? null);
            }
            setPageLoading(false);
        });
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        const prev = logoPreview;
        if (prev) URL.revokeObjectURL(prev);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !category || !address.trim()) {
            setError("Business name, category, and address are required.");
            return;
        }

        setSaving(true);
        setError(null);

        let logoUrl: string | undefined = currentLogoUrl ?? undefined;
        if (logoFile) {
            const uploaded = await uploadLogoToS3(logoFile);
            if (uploaded) {
                logoUrl = uploaded;
                setCurrentLogoUrl(uploaded);
                setLogoFile(null);
            }
        }

        const result = businessId
            ? await updateBusiness(
                  businessId,
                  name,
                  description,
                  category,
                  address,
                  logoUrl,
              )
            : await createBusiness(name, description, category, address, logoUrl);

        if (result.error) {
            setError(result.error);
        } else {
            setSaved(true);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const created = (result as any).business;
            if (!businessId && created?.id) setBusinessId(created.id);
            setTimeout(() => setSaved(false), 2500);
        }

        setSaving(false);
    };

    if (loading || pageLoading) {
        return (
            <main className="max-w-2xl mx-auto px-6 py-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-100 rounded w-1/2" />
                    <div className="h-64 bg-gray-100 rounded-xl" />
                    <div className="h-64 bg-gray-100 rounded-xl" />
                </div>
            </main>
        );
    }

    const displayLogo = logoPreview ?? currentLogoUrl;

    return (
        <main className="max-w-2xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Link href="/dashboard/business">
                    <Button variant="ghost" className="px-2 py-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">
                        {businessId ? "Business Profile" : "Set Up Your Business"}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {businessId
                            ? "Update your public profile."
                            : "Fill in your details to start accepting bookings."}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Logo */}
                <Card className="p-6 border-gray-100">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">
                        Business Logo
                    </h2>
                    <div className="flex items-center gap-6">
                        {/* Clickable preview */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-24 h-24 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-red-400 hover:bg-red-50 transition-colors group shrink-0"
                        >
                            {displayLogo ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={displayLogo}
                                        alt="Logo preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-1">
                                    <Camera className="w-6 h-6 text-gray-300 group-hover:text-red-400 transition-colors" />
                                    <span className="text-[10px] text-gray-400 group-hover:text-red-400 transition-colors">
                                        Upload
                                    </span>
                                </div>
                            )}
                        </button>

                        <div>
                            <p className="text-sm font-semibold text-gray-700">
                                Upload a logo
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                PNG, JPG, WEBP · max 5 MB
                            </p>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-2 text-xs font-semibold text-red-600 hover:underline"
                            >
                                Choose file
                            </button>
                            {logoFile && (
                                <p className="text-xs text-gray-500 mt-1 max-w-[180px] truncate">
                                    {logoFile.name}
                                </p>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                </Card>

                {/* Details */}
                <Card className="p-6 border-gray-100">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">
                        Business Details
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Business Name{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Studio Luxe"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Category{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Select a category</option>
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Address{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="e.g. 123 Main St, New York, NY"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Tell clients what makes your business special..."
                                rows={3}
                                className={`${inputClass} resize-none`}
                            />
                        </div>
                    </div>
                </Card>

                {error && (
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                )}

                <div className="flex flex-wrap gap-3">
                    <Button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-2.5 font-bold rounded-xl shadow-lg shadow-red-100"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving…
                            </>
                        ) : saved ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Saved!
                            </>
                        ) : businessId ? (
                            "Save Changes"
                        ) : (
                            "Create Business"
                        )}
                    </Button>

                    {businessId && (
                        <Link href="/dashboard/business/services">
                            <Button
                                variant="outline"
                                type="button"
                                className="px-6 py-2.5 font-semibold"
                            >
                                Next: Services &amp; Staff →
                            </Button>
                        </Link>
                    )}
                </div>
            </form>
        </main>
    );
}
