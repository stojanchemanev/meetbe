"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { Card, Button } from "@/src/components/ui";
import { requestPasswordReset } from "@/app/actions/auth";

const Page = () => {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        const result = await requestPasswordReset(email);

        if ("error" in result && result.error) {
            setError(result.error);
            setSubmitting(false);
            return;
        }

        setSent(true);
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
                        Reset your password
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                        Enter your email and we&apos;ll send you a reset link
                    </p>
                </div>

                <Card className="p-8 border-gray-100">
                    {sent ? (
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
                                Check your email
                            </p>
                            <p className="text-sm text-gray-500">
                                We sent a password reset link to{" "}
                                <span className="font-semibold text-gray-700">
                                    {email}
                                </span>
                            </p>
                            <Link
                                href="/login"
                                className="block text-sm text-primary-600 font-bold hover:underline mt-4"
                            >
                                Back to sign in
                            </Link>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-primary-700 text-sm">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <input
                                    required
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                />
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 text-md font-bold rounded-xl shadow-lg shadow-primary-100 disabled:opacity-50"
                                >
                                    {submitting
                                        ? "Sending..."
                                        : "Send reset link"}
                                </Button>
                            </form>
                        </>
                    )}
                </Card>

                {!sent && (
                    <p className="text-center mt-8 text-sm font-medium text-gray-500">
                        Remember your password?{" "}
                        <Link
                            href="/login"
                            className="text-primary-600 font-bold hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Page;
