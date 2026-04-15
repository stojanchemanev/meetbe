"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { Search, Clock, User as UserIcon } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/src/components/ui";

export default function ClientDashboard() {
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
                        Welcome back, {user.name.split(" ")[0]}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Manage your bookings and discover new services.
                    </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mb-10">
                    {[
                        { label: "Upcoming bookings", value: "0", icon: Clock },
                        { label: "Services browsed", value: "0", icon: Search },
                        {
                            label: "Profile completion",
                            value: "80%",
                            icon: UserIcon,
                        },
                    ].map(({ label, value, icon: Icon }) => (
                        <Card key={label} className="p-6 border-gray-100">
                            <Icon className="w-5 h-5 text-red-500 mb-3" />
                            <p className="text-2xl font-extrabold text-gray-900">
                                {value}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {label}
                            </p>
                        </Card>
                    ))}
                </div>

                <Card className="p-8 border-gray-100 text-center">
                    <Search className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-gray-700 mb-2">
                        No upcoming bookings
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Browse local businesses and book your first appointment.
                    </p>
                    <Link href="/browse">
                        <Button className="py-3 px-6 font-bold rounded-xl shadow-lg shadow-red-100">
                            Browse Services
                        </Button>
                    </Link>
                </Card>
        </main>
    );
}
