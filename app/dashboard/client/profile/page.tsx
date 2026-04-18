"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/src/components/ui";
import { getClientProfile, updateClientProfile } from "@/app/actions/profile";
import { User } from "@/src/types";

const SEX_OPTIONS = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
    { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

const inputClass =
    "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder:text-gray-400 bg-white";

async function uploadAvatarToS3(file: File): Promise<string | null> {
    try {
        const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
                folder: "avatars",
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

export default function ClientProfilePage() {
    const { user, loading, refreshUser } = useAuth();
    const router = useRouter();

    const [pageLoading, setPageLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [age, setAge] = useState("");
    const [sex, setSex] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");

    const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        getClientProfile().then(({ data }) => {
            if (data) {
                const profile = data as User;
                const parts = (profile.name ?? "").split(" ");
                setFirstName(parts[0] ?? "");
                setLastName(parts.slice(1).join(" "));
                setPhone(profile.phone ?? "");
                setAge(profile.age != null ? String(profile.age) : "");
                setSex(profile.sex ?? "");
                setAddress(profile.address ?? "");
                setCity(profile.city ?? "");
                setCurrentAvatarUrl(profile.avatar ?? null);
            }
            setPageLoading(false);
        });
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        const prev = avatarPreview;
        if (prev) URL.revokeObjectURL(prev);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName.trim()) {
            setError("First name is required.");
            return;
        }

        setSaving(true);
        setError(null);

        let avatarUrl: string | null | undefined = currentAvatarUrl;
        if (avatarFile) {
            const uploaded = await uploadAvatarToS3(avatarFile);
            if (uploaded) {
                avatarUrl = uploaded;
                setCurrentAvatarUrl(uploaded);
                setAvatarFile(null);
            }
        }

        const result = await updateClientProfile({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim() || undefined,
            age: age ? parseInt(age, 10) : null,
            sex: sex || null,
            address: address.trim() || undefined,
            city: city.trim() || undefined,
            avatar: avatarUrl,
        });

        if (result.error) {
            setError(result.error);
        } else {
            await refreshUser();
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        }

        setSaving(false);
    };

    if (loading || pageLoading) {
        return (
            <main className="max-w-2xl mx-auto px-6 py-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-100 rounded w-1/2" />
                    <div className="h-48 bg-gray-100 rounded-xl" />
                    <div className="h-64 bg-gray-100 rounded-xl" />
                </div>
            </main>
        );
    }

    const displayAvatar = avatarPreview ?? currentAvatarUrl;

    return (
        <main className="max-w-2xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Link href="/dashboard/client">
                    <Button variant="ghost" className="px-2 py-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">
                        Profile Settings
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Keep your details up to date.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Avatar */}
                <Card className="p-6 border-gray-100">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">
                        Profile Photo
                    </h2>
                    <div className="flex items-center gap-6">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-red-400 hover:bg-red-50 transition-colors group shrink-0"
                        >
                            {displayAvatar ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={displayAvatar}
                                        alt="Avatar preview"
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
                                Upload a photo
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
                            {avatarFile && (
                                <p className="text-xs text-gray-500 mt-1 max-w-[180px] truncate">
                                    {avatarFile.name}
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

                {/* Personal details */}
                <Card className="p-6 border-gray-100">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">
                        Personal Details
                    </h2>
                    <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    First Name{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) =>
                                        setFirstName(e.target.value)
                                    }
                                    placeholder="e.g. Jane"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="e.g. Smith"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. +1 555 000 0000"
                                className={inputClass}
                            />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Age
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={149}
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    placeholder="e.g. 28"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Sex
                                </label>
                                <select
                                    value={sex}
                                    onChange={(e) => setSex(e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select</option>
                                    {SEX_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Location */}
                <Card className="p-6 border-gray-100">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">
                        Location
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Address
                            </label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="e.g. 123 Main St"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                City
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g. New York"
                                className={inputClass}
                            />
                        </div>
                    </div>
                </Card>

                {error && (
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                )}

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
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </form>
        </main>
    );
}
