"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, User as UserIcon, Briefcase } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { UserRole } from "@/src/types";
import { Card, Button } from "@/src/components/ui";

const Page = () => {
    const { login, loading, user } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user && !loading) {
            router.push("/");
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        if (!email || !password) {
            setError("Please fill in all fields");
            setSubmitting(false);
            return;
        }

        const result = await login(email, password);

        if (!result.success) {
            setError(result.error || "Login failed");
            setSubmitting(false);
            return;
        }

        setSubmitting(false);
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 font-bold text-2xl text-red-600 mb-6"
                    >
                        <Calendar className="w-8 h-8" />
                        <span>Meetme</span>
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Sign in to your account
                    </h2>
                </div>

                <Card className="p-8 border-gray-100">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole(UserRole.CLIENT)}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all font-bold text-sm ${
                                    role === UserRole.CLIENT
                                        ? "bg-red-50 border-red-600 text-red-700"
                                        : "bg-white text-gray-400 border-gray-100"
                                }`}
                            >
                                <UserIcon className="w-4 h-4" /> Client
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole(UserRole.BUSINESS)}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all font-bold text-sm ${
                                    role === UserRole.BUSINESS
                                        ? "bg-red-50 border-red-600 text-red-700"
                                        : "bg-white text-gray-400 border-gray-100"
                                }`}
                            >
                                <Briefcase className="w-4 h-4" /> Business
                            </button>
                        </div>

                        <div className="space-y-4">
                            <input
                                required
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-red-500 transition-all"
                            />
                            <input
                                required
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-red-500 transition-all"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 text-md font-bold rounded-xl shadow-lg shadow-red-100 disabled:opacity-50"
                        >
                            {submitting ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                </Card>

                <p className="text-center mt-8 text-sm font-medium text-gray-500">
                    Don't have an account?{" "}
                    <Link
                        href="/register"
                        className="text-red-600 font-bold hover:underline"
                    >
                        Join free
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Page;
