"use client";
import React, { useCallback } from "react";
import Script from "next/script";
import { X, Zap, Check } from "lucide-react";
import { Button } from "@/src/components/ui";
import { PLAN_LIMITS } from "@/src/lib/plans";

// Minimal Paddle v2 type declaration
declare global {
    interface Window {
        Paddle?: {
            Environment: { set: (env: "sandbox" | "production") => void };
            Initialize: (opts: { token: string }) => void;
            Checkout: {
                open: (opts: {
                    items: { priceId: string; quantity: number }[];
                    customer?: { email: string };
                    customData?: Record<string, string>;
                }) => void;
            };
        };
    }
}

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Which limit was hit — shown in the header copy */
    limitType: "services" | "employees" | "clients";
    userEmail: string;
    businessId: string;
}

const LIMIT_COPY: Record<UpgradeModalProps["limitType"], string> = {
    services: "You've reached the 3-service limit on the Free plan.",
    employees: "You've reached the 1-employee limit on the Free plan.",
    clients: "You've reached the 10-client limit on the Free plan.",
};

const GROWTH_FEATURES = [
    "Unlimited services",
    "Unlimited staff members",
    "Unlimited clients",
    "Priority support",
];

export default function UpgradeModal({
    isOpen,
    onClose,
    limitType,
    userEmail,
    businessId,
}: UpgradeModalProps) {
    const handleUpgrade = useCallback(() => {
        const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
        const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;

        if (!clientToken || !priceId) {
            console.error("Paddle env vars not set.");
            return;
        }

        const paddle = window.Paddle;
        if (!paddle) {
            console.error("Paddle.js not loaded yet.");
            return;
        }

        const env = process.env.NEXT_PUBLIC_PADDLE_ENV as
            | "sandbox"
            | "production"
            | undefined;
        paddle.Environment.set(env === "production" ? "production" : "sandbox");
        paddle.Initialize({ token: clientToken });

        paddle.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            customer: { email: userEmail },
            customData: { businessId },
        });
    }, [userEmail, businessId]);

    if (!isOpen) return null;

    const free = PLAN_LIMITS.free;

    return (
        <>
            {/* Load Paddle.js once */}
            <Script
                src="https://cdn.paddle.com/paddle/v2/paddle.js"
                strategy="lazyOnload"
            />

            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Panel */}
                <div
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-5">
                        <Zap className="w-6 h-6 text-primary-500" />
                    </div>

                    <h2 className="text-xl font-extrabold text-gray-900 mb-1">
                        Upgrade to Growth
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                        {LIMIT_COPY[limitType]}
                    </p>

                    {/* Plan comparison */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {/* Free */}
                        <div className="rounded-xl border border-gray-100 p-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                Free
                            </p>
                            <ul className="space-y-1.5 text-sm text-gray-500">
                                <li>{free.services} services</li>
                                <li>{free.employees} employees</li>
                                <li>{free.clients} clients</li>
                            </ul>
                        </div>

                        {/* Growth */}
                        <div className="rounded-xl border-2 border-primary-500 p-4 bg-primary-50/30 relative">
                            <span className="absolute -top-2.5 left-3 bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                Recommended
                            </span>
                            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">
                                Growth
                            </p>
                            <ul className="space-y-1.5">
                                {GROWTH_FEATURES.map((f) => (
                                    <li
                                        key={f}
                                        className="flex items-center gap-1.5 text-sm text-gray-700 font-medium"
                                    >
                                        <Check className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={handleUpgrade}
                        className="w-full py-3 font-bold rounded-xl shadow-lg shadow-primary-100 text-base"
                    >
                        <Zap className="w-4 h-4" />
                        Upgrade to Growth
                    </Button>

                    <p className="text-center text-xs text-gray-400 mt-3">
                        Monthly subscription · cancel anytime
                    </p>
                </div>
            </div>
        </>
    );
}
