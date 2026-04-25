import React from "react";
import { Check } from "lucide-react";

import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";

const Page = () => {
    const plans = [
        {
            name: "Free",
            price: "$0",
            description: "Perfect for local shops starting out.",
            features: [
                "Up to 10 clients",
                "Basic Calendar",
                "Dashboard Analytics",
                "1 Employee / Business Owner",
            ],
            buttonText: "Start for Free — Forever",
            recommended: false,
        },
        {
            name: "Growth",
            price: "$19",
            description: "Scale your business with ease.",
            features: [
                "Unlimited Clients after 10",
                "Real-time Notifications",
                "Full Calendar",
                "3 Staff Members",
                "Email Alerts",
                "AI Scheduling",
            ],
            buttonText: "Get Started",
            recommended: true,
        },
        {
            name: "Enterprise",
            price: "Custom",
            description: "For multi-location franchises.",
            features: [
                "Unlimited Staff",
                "Custom Domain",
                "SMS Notifications",
                "Dedicated Manager",
                "API Access",
                "SSO Login",
            ],
            buttonText: "Contact Sales",
            recommended: false,
        },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-6">
                Transparent pricing <br />
                <span className="text-red-600 italic font-medium">
                    for growing businesses.
                </span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-16 font-medium">
                Always free for clients. Simple tiered pricing for business
                owners to scale effortlessly.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
                {plans.map((plan, i) => (
                    <Card
                        key={i}
                        className={`relative p-8 flex flex-col ${
                            plan.recommended
                                ? "ring-2 ring-red-600 shadow-2xl scale-105 z-10 overflow-visible"
                                : plan.name === "Free"
                                ? "border-gray-100 shadow-xl overflow-visible"
                                : "border-gray-100 shadow-xl"
                        }`}
                    >
                        {plan.recommended && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-red-100">
                                Most Popular
                            </div>
                        )}
                        {plan.name === "Free" && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                Free Forever
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {plan.name}
                        </h3>
                        <div className="mb-6">
                            <span className="text-5xl font-black text-gray-900 tracking-tighter">
                                {plan.price}
                            </span>
                            <span className="text-gray-400 font-bold">
                                {" "}
                                /mo
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-8 font-medium">
                            {plan.description}
                        </p>
                        <div className="space-y-4 mb-10 flex-1">
                            {plan.features.map((feat, j) => (
                                <div
                                    key={j}
                                    className="flex items-center gap-3 text-sm text-gray-600 font-semibold"
                                >
                                    <div className="w-5 h-5 bg-red-50 text-red-600 rounded-full flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    {feat}
                                </div>
                            ))}
                        </div>
                        <Button
                            variant={plan.recommended ? "primary" : "outline"}
                            className="w-full py-4 text-md font-bold rounded-xl"
                        >
                            {plan.buttonText}
                        </Button>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Page;
