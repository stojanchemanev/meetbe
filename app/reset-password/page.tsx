"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Card, Button } from "@/src/components/ui";
import { updatePassword } from "@/app/actions/auth";

type Stage = "ready" | "success";

const Page = () => {
    const searchParams = useSearchParams();
    const linkInvalid = searchParams.get("error") === "invalid";
    const [stage, setStage] = useState<Stage>("ready");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setSubmitting(true);
        const { error } = await updatePassword(password);

        if (error) {
            setError(error);
            setSubmitting(false);
            return;
        }

        setStage("success");
        setSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 font-bold text-2xl text-primary-600 mb-6"
                    >
                        <Calendar className="w-8 h-8" />
                        <span>Meetme</span>
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Set new password
                    </h2>
                </div>

                <Card className="p-8 border-gray-100">
                    {linkInvalid && (
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                                <svg
                                    className="w-6 h-6 text-primary-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </div>
                            <p className="text-gray-700 font-medium">
                                Invalid or expired link
                            </p>
                            <p className="text-sm text-gray-500">
                                This reset link has expired or already been
                                used.
                            </p>
                            <Link
                                href="/forgot-password"
                                className="block text-sm text-primary-600 font-bold hover:underline mt-4"
                            >
                                Request a new link
                            </Link>
                        </div>
                    )}

                    {!linkInvalid && stage === "success" && (
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <svg
                                    className="w-6 h-6 text-green-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <p className="text-gray-700 font-medium">
                                Password updated
                            </p>
                            <p className="text-sm text-gray-500">
                                Your password has been changed successfully.
                            </p>
                            <Link
                                href="/login"
                                className="block text-sm text-primary-600 font-bold hover:underline mt-4"
                            >
                                Sign in
                            </Link>
                        </div>
                    )}

                    {!linkInvalid && stage === "ready" && (
                        <>
                            {error && (
                                <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-primary-700 text-sm">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <input
                                        required
                                        type="password"
                                        placeholder="New password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                    <input
                                        required
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 text-md font-bold rounded-xl shadow-lg shadow-primary-100 disabled:opacity-50"
                                >
                                    {submitting
                                        ? "Updating..."
                                        : "Update password"}
                                </Button>
                            </form>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Page;
