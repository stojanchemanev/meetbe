"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, User as UserIcon, Briefcase } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { UserRole } from "@/src/types";
import { Card, Button } from "@/src/components/ui";

const Page = () => {
    const { register, loading, user } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user && !loading) {
            router.push(
                user.role === UserRole.BUSINESS
                    ? "/dashboard/business"
                    : "/dashboard/client",
            );
        }
    }, [user, loading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        if (
            !formData.name ||
            !formData.email ||
            !formData.password ||
            !formData.confirmPassword
        ) {
            setError("Please fill in all fields");
            setSubmitting(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setSubmitting(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setSubmitting(false);
            return;
        }

        const result = await register(
            formData.name,
            formData.email,
            formData.password,
            role,
        );

        if (!result.success) {
            setError(result.error || "Registration failed");
            setSubmitting(false);
            return;
        }

        router.push(
            role === UserRole.BUSINESS
                ? "/dashboard/business"
                : "/dashboard/client",
        );
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
                        Create your account
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
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-red-500 transition-all"
                            />
                            <input
                                required
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-red-500 transition-all"
                            />
                            <input
                                required
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-red-500 transition-all"
                            />
                            <input
                                required
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-red-500 transition-all"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 text-md font-bold rounded-xl shadow-lg shadow-red-100 disabled:opacity-50"
                        >
                            {submitting
                                ? "Creating account..."
                                : "Create Account"}
                        </Button>
                    </form>
                </Card>

                <p className="text-center mt-8 text-sm font-medium text-gray-500">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-red-600 font-bold hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Page;
