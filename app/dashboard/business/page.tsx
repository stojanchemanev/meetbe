"use client";
import React, { useEffect } from "react";
import { Users, Briefcase, BarChart2, Calendar } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/src/components/ui";

export default function BusinessDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading || !user) return null;

    return (
        <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        Business Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Manage your services, staff, and bookings.
                    </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mb-10">
                    {[
                        { label: "Total bookings", value: "0", icon: Calendar },
                        { label: "Active clients", value: "0", icon: Users },
                        { label: "Revenue this month", value: "$0", icon: BarChart2 },
                    ].map(({ label, value, icon: Icon }) => (
                        <Card key={label} className="p-6 border-gray-100">
                            <Icon className="w-5 h-5 text-red-500 mb-3" />
                            <p className="text-2xl font-extrabold text-gray-900">
                                {value}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">{label}</p>
                        </Card>
                    ))}
                </div>

                <Card className="p-8 border-gray-100 text-center">
                    <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-gray-700 mb-2">
                        Set up your business profile
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Add your services, availability, and staff to start
                        accepting bookings.
                    </p>
                    <Button className="py-3 px-6 font-bold rounded-xl shadow-lg shadow-red-100">
                        Complete Setup
                    </Button>
                </Card>
        </main>
    );
}
