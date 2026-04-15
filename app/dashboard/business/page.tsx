"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { Users, Briefcase, BarChart2, Calendar, Tag, Settings } from "lucide-react";
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

            {/* Quick-action cards */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <Card className="p-6 border-gray-100 hover:border-red-100 transition-colors">
                    <Settings className="w-8 h-8 text-red-400 mb-3" />
                    <h2 className="text-base font-bold text-gray-800 mb-1">
                        Business Profile
                    </h2>
                    <p className="text-sm text-gray-500 mb-5">
                        Set your name, category, address, and upload a logo.
                    </p>
                    <Link href="/dashboard/business/setup">
                        <Button className="py-2 px-5 font-bold rounded-xl shadow-sm shadow-red-100 text-sm">
                            <Briefcase className="w-4 h-4" />
                            Edit Profile
                        </Button>
                    </Link>
                </Card>

                <Card className="p-6 border-gray-100 hover:border-red-100 transition-colors">
                    <Tag className="w-8 h-8 text-red-400 mb-3" />
                    <h2 className="text-base font-bold text-gray-800 mb-1">
                        Services &amp; Staff
                    </h2>
                    <p className="text-sm text-gray-500 mb-5">
                        Add your services, staff members, and assign who
                        performs what.
                    </p>
                    <Link href="/dashboard/business/services">
                        <Button className="py-2 px-5 font-bold rounded-xl shadow-sm shadow-red-100 text-sm">
                            <Users className="w-4 h-4" />
                            Manage
                        </Button>
                    </Link>
                </Card>
            </div>
        </main>
    );
}
