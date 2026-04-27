"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format, isAfter } from "date-fns";
import {
    ArrowLeft,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    Loader2,
    User,
    XCircle,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/src/components/ui";
import {
    getEmployeeSchedule,
    type EmployeeAppointment,
} from "@/app/actions/appointments";

const STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    CONFIRMED: "bg-green-50 text-green-700 border border-green-200",
    CANCELLED: "bg-gray-100 text-gray-500 border border-gray-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    PENDING: <Clock className="w-3 h-3" />,
    CONFIRMED: <CheckCircle2 className="w-3 h-3" />,
    CANCELLED: <XCircle className="w-3 h-3" />,
};

function AppointmentCard({ appt }: { appt: EmployeeAppointment }) {
    const start = new Date(appt.slot.start_time);
    const end = new Date(appt.slot.end_time);
    return (
        <Card className="p-5 border-gray-100">
            <div className="flex items-start gap-4">
                {/* Date block */}
                <div className="shrink-0 w-12 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                        {format(start, "MMM")}
                    </p>
                    <p className="text-2xl font-extrabold text-gray-900 leading-none">
                        {format(start, "d")}
                    </p>
                    <p className="text-[10px] font-semibold text-gray-400">
                        {format(start, "EEE")}
                    </p>
                </div>

                {/* Divider */}
                <div className="w-px self-stretch bg-gray-100 shrink-0" />

                {/* Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLES[appt.status]}`}
                        >
                            {STATUS_ICONS[appt.status]}
                            {appt.status}
                        </span>
                    </div>

                    <p className="font-bold text-gray-900 truncate">
                        {appt.service?.name ?? "Appointment"}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {format(start, "h:mm a")} –{" "}
                            {format(end, "h:mm a")}
                        </span>
                        {appt.service && (
                            <span className="text-xs font-bold text-primary-600">
                                {appt.service.price}
                            </span>
                        )}
                    </div>

                    {/* Client info */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                        {appt.client.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={appt.client.avatar}
                                alt={appt.client.name}
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                <User className="w-3 h-3 text-gray-400" />
                            </div>
                        )}
                        <p className="text-xs font-semibold text-gray-600">
                            {appt.client.name}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}

export default function EmployeeDashboard() {
    const { user, employeeLinks, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [appointments, setAppointments] = useState<EmployeeAppointment[] | null>(null);
    const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

    useEffect(() => {
        if (isAuthenticated === false) router.push("/login");
    }, [isAuthenticated, router]);

    useEffect(() => {
        // Wait for user to be set — setUser and setEmployeeLinks are batched together,
        // so this avoids a false redirect while employeeLinks is still loading.
        if (!loading && user && isAuthenticated && employeeLinks.length === 0) {
            router.push("/dashboard/client");
        }
    }, [loading, user, isAuthenticated, employeeLinks, router]);

    useEffect(() => {
        if (loading || !user || employeeLinks.length === 0) return;
        getEmployeeSchedule()
            .then(({ data }) => setAppointments(data ?? []))
            .catch(() => setAppointments([]));
    }, [user, employeeLinks, loading]);

    const apptLoading = !loading && user !== null && employeeLinks.length > 0 && appointments === null;

    if (loading || apptLoading) {
        return (
            <main className="max-w-2xl mx-auto px-6 py-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-100 rounded w-1/3" />
                    <div className="h-20 bg-gray-100 rounded-xl" />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-28 bg-gray-100 rounded-xl" />
                    ))}
                </div>
            </main>
        );
    }

    const business = employeeLinks[0];
    const now = new Date();

    const upcoming = (appointments ?? [])
        .filter(
            (a) => a.status !== "CANCELLED" && isAfter(new Date(a.slot.start_time), now),
        )
        .sort(
            (a, b) =>
                new Date(a.slot.start_time).getTime() -
                new Date(b.slot.start_time).getTime(),
        );

    const past = (appointments ?? [])
        .filter(
            (a) =>
                a.status === "CANCELLED" ||
                !isAfter(new Date(a.slot.start_time), now),
        )
        .sort(
            (a, b) =>
                new Date(b.slot.start_time).getTime() -
                new Date(a.slot.start_time).getTime(),
        );

    const shown = tab === "upcoming" ? upcoming : past;

    return (
        <main className="max-w-2xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Link href="/dashboard/client">
                    <Button variant="ghost" className="px-2 py-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary-500" />
                        <h1 className="text-2xl font-extrabold text-gray-900">
                            Work Schedule
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {business?.business_name ?? "Your business"}
                    </p>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <Card className="p-5 border-gray-100">
                    <p className="text-2xl font-extrabold text-gray-900">
                        {upcoming.length}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Upcoming appointments
                    </p>
                    {upcoming[0] && (
                        <p className="text-xs text-primary-500 font-semibold mt-2 truncate">
                            Next:{" "}
                            {format(
                                new Date(upcoming[0].slot.start_time),
                                "MMM d · h:mm a",
                            )}
                        </p>
                    )}
                </Card>
                <Card className="p-5 border-gray-100">
                    <p className="text-2xl font-extrabold text-gray-900">
                        {past.filter((a) => a.status !== "CANCELLED").length}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Completed sessions
                    </p>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
                {(["upcoming", "past"] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors capitalize ${
                            tab === t
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {t === "upcoming"
                            ? `Upcoming (${upcoming.length})`
                            : `Past (${past.length})`}
                    </button>
                ))}
            </div>

            {/* Appointment list */}
            {shown.length === 0 ? (
                <Card className="p-10 border-gray-100 text-center">
                    <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-400">
                        {tab === "upcoming"
                            ? "No upcoming appointments."
                            : "No past appointments."}
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {shown.map((appt) => (
                        <AppointmentCard key={appt.id} appt={appt} />
                    ))}
                </div>
            )}
        </main>
    );
}
