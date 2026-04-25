"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Briefcase, BarChart2, Calendar, CalendarDays, Tag, Settings, Zap } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/src/components/ui";
import { getUserBusiness } from "@/app/actions/businesses";
import { getBusinessAppointments, getUniqueClientCount } from "@/app/actions/appointments";
import { PLAN_LIMITS } from "@/src/lib/plans";
import type { Plan } from "@/src/lib/plans";

export default function BusinessDashboard() {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [plan, setPlan] = useState<Plan>("free");
    const [totalBookings, setTotalBookings] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [uniqueClients, setUniqueClients] = useState(0);

    useEffect(() => {
        if (isAuthenticated === false) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (!user) return;
        getUserBusiness().then(({ business }) => {
            if (business?.plan) setPlan(business.plan as Plan);
        });
        getBusinessAppointments().then(({ data }) => {
            if (!data) return;
            setTotalBookings(data.filter((a) => a.status !== "CANCELLED").length);
            setPendingCount(data.filter((a) => a.status === "PENDING").length);
        });
        getUniqueClientCount().then(setUniqueClients);
    }, [user]);

    if (loading || !user) return (
        <main className="max-w-4xl mx-auto px-6 py-12">
            <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-100 rounded w-1/3" />
                <div className="grid sm:grid-cols-3 gap-4">
                    {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
                </div>
                <div className="h-64 bg-gray-100 rounded-xl" />
            </div>
        </main>
    );

    return (
        <main className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-10 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        Business Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Manage your services, staff, and bookings.
                    </p>
                </div>
                <span
                    className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                        plan === "growth"
                            ? "bg-red-500 text-white"
                            : "bg-gray-100 text-gray-500"
                    }`}
                >
                    {plan === "growth" && <Zap className="w-3 h-3" />}
                    {plan === "growth" ? "Growth Plan" : "Free Plan"}
                </span>
            </div>

            {plan === "free" && (
                <div className={`mb-6 rounded-xl px-5 py-4 flex items-start gap-3 border ${
                    uniqueClients >= PLAN_LIMITS.free.clients
                        ? "bg-red-50 border-red-200"
                        : "bg-amber-50 border-amber-100"
                }`}>
                    <Zap className={`w-4 h-4 shrink-0 mt-0.5 ${uniqueClients >= PLAN_LIMITS.free.clients ? "text-red-500" : "text-amber-500"}`} />
                    <div className="flex-1 min-w-0">
                        {uniqueClients >= PLAN_LIMITS.free.clients ? (
                            <>
                                <p className="text-sm font-bold text-red-800">
                                    You&apos;ve reached your 10-client limit — new clients can&apos;t book right now.
                                </p>
                                <p className="text-xs text-red-700 mt-0.5">
                                    Upgrade to Growth to accept unlimited clients and never miss a booking.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-bold text-amber-800">
                                    Free plan: {uniqueClients} / {PLAN_LIMITS.free.clients} unique clients
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    Once you reach 10 clients, new bookings will be blocked. Upgrade to Growth for unlimited clients.
                                </p>
                            </>
                        )}
                    </div>
                    <Link href="/pricing">
                        <Button className="text-xs px-3 py-1.5 font-bold shrink-0">
                            Upgrade
                        </Button>
                    </Link>
                </div>
            )}

            <div className="grid sm:grid-cols-3 gap-4 mb-10">
                <Card className="p-6 border-gray-100">
                    <Calendar className="w-5 h-5 text-red-500 mb-3" />
                    <p className="text-2xl font-extrabold text-gray-900">
                        {totalBookings}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Total bookings</p>
                    {pendingCount > 0 && (
                        <p className="text-xs text-amber-600 font-semibold mt-2">
                            {pendingCount} awaiting confirmation
                        </p>
                    )}
                </Card>
                <Card className="p-6 border-gray-100">
                    <Users className="w-5 h-5 text-red-500 mb-3" />
                    <p className="text-2xl font-extrabold text-gray-900">{uniqueClients}</p>
                    <p className="text-sm text-gray-500 mt-1">Unique clients</p>
                    {plan === "free" && (
                        <p className="text-xs text-gray-400 mt-1">{PLAN_LIMITS.free.clients - uniqueClients} slots remaining</p>
                    )}
                </Card>
                <Card className="p-6 border-gray-100">
                    <BarChart2 className="w-5 h-5 text-red-500 mb-3" />
                    <p className="text-2xl font-extrabold text-gray-900">—</p>
                    <p className="text-sm text-gray-500 mt-1">Revenue this month</p>
                </Card>
            </div>

            {/* Quick-action cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
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

                <Card className="p-6 border-gray-100 hover:border-red-100 transition-colors relative">
                    {pendingCount > 0 && (
                        <span className="absolute top-4 right-4 text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full">
                            {pendingCount} pending
                        </span>
                    )}
                    <Calendar className="w-8 h-8 text-red-400 mb-3" />
                    <h2 className="text-base font-bold text-gray-800 mb-1">
                        Bookings
                    </h2>
                    <p className="text-sm text-gray-500 mb-5">
                        Review requests, confirm appointments, and manage your schedule.
                    </p>
                    <Link href="/dashboard/business/appointments">
                        <Button className="py-2 px-5 font-bold rounded-xl shadow-sm shadow-red-100 text-sm">
                            <Calendar className="w-4 h-4" />
                            View Bookings
                        </Button>
                    </Link>
                </Card>
            </div>

            {/* Schedule quick-action */}
            <div className="grid sm:grid-cols-3 gap-4">
                <Card className="p-6 border-gray-100 hover:border-red-100 transition-colors">
                    <CalendarDays className="w-8 h-8 text-red-400 mb-3" />
                    <h2 className="text-base font-bold text-gray-800 mb-1">Schedule</h2>
                    <p className="text-sm text-gray-500 mb-5">
                        Set available timeslots per staff member for clients to book.
                    </p>
                    <Link href="/dashboard/business/schedule">
                        <Button className="py-2 px-5 font-bold rounded-xl shadow-sm shadow-red-100 text-sm">
                            <CalendarDays className="w-4 h-4" />
                            Manage Schedule
                        </Button>
                    </Link>
                </Card>
            </div>
        </main>
    );
}
