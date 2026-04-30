"use client";
import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button } from "@/src/components/ui";
import { signInWithOAuth } from "@/app/actions/auth";
import { UserRole } from "@/src/types";

const LoginContent = () => {
    const { login, loading, user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") ?? "/";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<
        "google" | "facebook" | null
    >(null);
    const [error, setError] = useState(
        searchParams.get("error") === "oauth"
            ? "Social login failed. Please try again."
            : "",
    );

    // useEffect(() => {
    //     if (user && !loading) {
    //         const destination =
    //             redirectTo !== "/"
    //                 ? redirectTo
    //                 : user.role === UserRole.BUSINESS
    //                   ? "/dashboard/business"
    //                   : "/dashboard/client";
    //         router.push(destination);
    //     }
    // }, [user, loading, router, redirectTo]);

    const handleOAuth = async (provider: "google" | "facebook") => {
        setError("");
        setOauthLoading(provider);
        const result = await signInWithOAuth(provider);

        if ("error" in result) {
            setError(result.error ?? "OAuth failed");
            setOauthLoading(null);
            return;
        }
        window.location.href = result.url!;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        if (!email || !password) {
            setError("Please fill in all fields");
            setSubmitting(false);
            return;
        }
        try {
            const result = await login(email, password);
            console.log("result", result);

            if (!result.success) {
                setError(result.error || "Login failed");
                setSubmitting(false);
                return;
            }

            const destination =
                redirectTo !== "/"
                    ? redirectTo
                    : user?.role === UserRole.BUSINESS
                      ? "/dashboard/business"
                      : "/dashboard/client";
            router.push(destination);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err: unknown) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
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
                        Sign in to your account
                    </h2>
                </div>

                <Card className="p-8 border-gray-100">
                    {error && (
                        <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-primary-700 text-sm">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <input
                                required
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                            <input
                                required
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-medium outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                        </div>

                        <div className="flex justify-end -mt-2">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-primary-600 font-semibold hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 text-md font-bold rounded-xl shadow-lg shadow-primary-100 disabled:opacity-50"
                        >
                            {submitting ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>

                    {false && (
                        <>
                            <div className="flex items-center gap-3 my-6">
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                    or
                                </span>
                                <div className="flex-1 h-px bg-gray-100" />
                            </div>

                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => handleOAuth("google")}
                                    disabled={!!oauthLoading}
                                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors font-semibold text-sm text-gray-700 disabled:opacity-50"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    {oauthLoading === "google"
                                        ? "Redirecting..."
                                        : "Continue with Google"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleOAuth("facebook")}
                                    disabled={!!oauthLoading}
                                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors font-semibold text-sm text-gray-700 disabled:opacity-50"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                        fill="#1877F2"
                                    >
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                    {oauthLoading === "facebook"
                                        ? "Redirecting..."
                                        : "Continue with Facebook"}
                                </button>
                            </div>
                        </>
                    )}
                </Card>

                <p className="text-center mt-8 text-sm font-medium text-gray-500">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/register"
                        className="text-primary-600 font-bold hover:underline"
                    >
                        Join free
                    </Link>
                </p>
            </div>
        </div>
    );
};

const Page = () => (
    <Suspense>
        <LoginContent />
    </Suspense>
);

export default Page;
