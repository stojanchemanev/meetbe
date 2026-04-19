"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, CheckCircle2, Loader2, User, XCircle } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { Card, Button } from "@/src/components/ui";
import { getEmployeeByClaimToken, claimEmployee } from "@/app/actions/employees";

type EmployeeInfo = {
    id: string;
    name: string;
    role: string;
    avatar: string | null;
    businesses: { id: string; name: string; logo: string | null } | null;
};

export default function JoinPage() {
    const { token } = useParams<{ token: string }>();
    const router = useRouter();
    const { user, loading, isAuthenticated } = useAuth();

    const [info, setInfo] = useState<EmployeeInfo | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [claiming, setClaiming] = useState(false);
    const [claimError, setClaimError] = useState<string | null>(null);
    const [claimed, setClaimed] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        getEmployeeByClaimToken(token).then((res) => {
            if (res.error) {
                setFetchError(res.error);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setInfo(res.data as any);
            }
            setPageLoading(false);
        });
    }, [token]);

    const handleClaim = async () => {
        if (!user) {
            router.push(`/login?redirect=/join/${token}`);
            return;
        }
        setClaiming(true);
        setClaimError(null);
        const res = await claimEmployee(token);
        if (res.error) {
            setClaimError(res.error);
        } else {
            setClaimed(true);
            setTimeout(() => router.push("/dashboard"), 2000);
        }
        setClaiming(false);
    };

    if (loading || pageLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
            </main>
        );
    }

    if (fetchError) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <Card className="p-8 max-w-sm w-full text-center">
                    <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <h1 className="text-lg font-bold text-gray-900 mb-1">
                        Invalid invite
                    </h1>
                    <p className="text-sm text-gray-500">{fetchError}</p>
                </Card>
            </main>
        );
    }

    if (claimed) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <Card className="p-8 max-w-sm w-full text-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <h1 className="text-lg font-bold text-gray-900 mb-1">
                        You&apos;re in!
                    </h1>
                    <p className="text-sm text-gray-500">
                        Redirecting to your dashboard…
                    </p>
                </Card>
            </main>
        );
    }

    const business = info?.businesses;

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="p-8 max-w-sm w-full">
                {/* Business logo / icon */}
                <div className="flex justify-center mb-5">
                    {business?.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={business.logo}
                            alt={business.name}
                            className="w-16 h-16 rounded-2xl object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                            <Building2 className="w-7 h-7 text-red-500" />
                        </div>
                    )}
                </div>

                <h1 className="text-xl font-extrabold text-gray-900 text-center mb-1">
                    You&apos;ve been invited
                </h1>
                <p className="text-sm text-gray-500 text-center mb-6">
                    Join{" "}
                    <span className="font-bold text-gray-700">
                        {business?.name}
                    </span>{" "}
                    as a staff member.
                </p>

                {/* Employee card */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 mb-6">
                    {info?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={info.avatar}
                            alt={info.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-bold text-gray-900">
                            {info?.name}
                        </p>
                        <p className="text-xs text-gray-500">{info?.role}</p>
                    </div>
                </div>

                {isAuthenticated ? (
                    <>
                        <p className="text-xs text-gray-400 text-center mb-4">
                            Signed in as{" "}
                            <span className="font-semibold text-gray-600">
                                {user?.email}
                            </span>
                        </p>
                        {claimError && (
                            <p className="text-xs text-red-600 text-center mb-3 font-medium">
                                {claimError}
                            </p>
                        )}
                        <Button
                            onClick={handleClaim}
                            disabled={claiming}
                            className="w-full font-bold"
                        >
                            {claiming ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Accept invite"
                            )}
                        </Button>
                    </>
                ) : (
                    <>
                        <p className="text-xs text-gray-400 text-center mb-4">
                            You need an account to accept this invite.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={() =>
                                    router.push(`/login?redirect=/join/${token}`)
                                }
                                className="w-full font-bold"
                            >
                                Sign in
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.push(
                                        `/register?redirect=/join/${token}`,
                                    )
                                }
                                className="w-full"
                            >
                                Create account
                            </Button>
                        </div>
                    </>
                )}
            </Card>
        </main>
    );
}
