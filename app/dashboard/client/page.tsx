"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Briefcase, Calendar, ChevronRight, Heart, Search, User as UserIcon } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/src/components/ui";
import {
    getClientAppointments,
    cancelAppointment,
} from "@/app/actions/appointments";
import { AppointmentWithRelations } from "@/src/types";
import CancelModal from "@/src/components/shared/CancelModal";

const STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    CONFIRMED: "bg-green-50 text-green-700 border border-green-200",
    CANCELLED: "bg-gray-100 text-gray-500 border border-gray-200",
};

export default function ClientDashboard() {
    const { user, employeeLinks, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [appointments, setAppointments] = useState<AppointmentWithRelations[]>(
        [],
    );
    const [apptLoading, setApptLoading] = useState(true);
    const [cancelTarget, setCancelTarget] =
        useState<AppointmentWithRelations | null>(null);

    useEffect(() => {
        if (isAuthenticated === false) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (!user) return;
        getClientAppointments().then(({ data }) => {
            setAppointments(data ?? []);
            setApptLoading(false);
        });
    }, [user]);

    const handleCancel = async (reason: string) => {
        if (!cancelTarget) return;
        const { error } = await cancelAppointment(cancelTarget.id, reason);
        if (!error) {
            setAppointments((prev) =>
                prev.map((a) =>
                    a.id === cancelTarget.id
                        ? {
                              ...a,
                              status: "CANCELLED" as const,
                              cancellation_reason: reason,
                          }
                        : a,
                ),
            );
        }
        setCancelTarget(null);
    };

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

    const profileFields = [
        user.name,
        user.avatar,
        user.phone,
        user.age,
        user.sex,
        user.address,
        user.city,
    ];
    const profileCompletion = Math.round(
        (profileFields.filter(Boolean).length / profileFields.length) * 100,
    );

    const now = new Date();
    const upcoming = appointments
        .filter(
            (a) =>
                a.status !== "CANCELLED" &&
                new Date(a.slot.start_time) > now,
        )
        .sort(
            (a, b) =>
                new Date(a.slot.start_time).getTime() -
                new Date(b.slot.start_time).getTime(),
        );
    const next = upcoming[0];

    return (
        <main className="max-w-4xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-gray-900">
                    Welcome back, {user.name.split(" ")[0]}
                </h1>
                <p className="text-gray-500 mt-1">
                    Manage your bookings and discover new services.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <Card className="p-6 border-gray-100">
                    <Calendar className="w-5 h-5 text-primary-500 mb-3" />
                    <p className="text-2xl font-extrabold text-gray-900">
                        {upcoming.length}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Upcoming bookings
                    </p>
                    {next && (
                        <p className="text-xs text-primary-500 font-semibold mt-2 truncate">
                            Next: {next.service?.name ?? "Appointment"} &middot;{" "}
                            {format(new Date(next.slot.start_time), "MMM d")}
                        </p>
                    )}
                </Card>

                <Card className="p-6 border-gray-100">
                    <Search className="w-5 h-5 text-primary-500 mb-3" />
                    <p className="text-2xl font-extrabold text-gray-900">
                        {appointments.length}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Total bookings</p>
                </Card>

                <Link href="/dashboard/client/profile">
                    <Card className="p-6 border-gray-100 hover:border-primary-200 transition-colors cursor-pointer">
                        <UserIcon className="w-5 h-5 text-primary-500 mb-3" />
                        <p className="text-2xl font-extrabold text-gray-900">
                            {profileCompletion}%
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Profile completion
                        </p>
                        {profileCompletion < 100 && (
                            <p className="text-xs text-primary-500 font-semibold mt-2 flex items-center gap-0.5">
                                Complete profile
                                <ChevronRight className="w-3 h-3" />
                            </p>
                        )}
                    </Card>
                </Link>
            </div>

            {/* Employee banner */}
            {employeeLinks.length > 0 && (
                <Link href="/dashboard/employee">
                    <div className="flex items-center justify-between gap-3 bg-primary-50 border border-primary-100 rounded-xl px-5 py-4 mb-6 hover:border-primary-300 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                                <Briefcase className="w-4 h-4 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">
                                    You&apos;re staff at{" "}
                                    {employeeLinks[0].business_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    View your work schedule
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-primary-400 shrink-0" />
                    </div>
                </Link>
            )}

            {/* Favorites shortcut */}
            <div className="flex justify-end mb-6">
                <Link href="/dashboard/client/favorites">
                    <Button variant="outline" className="gap-2">
                        <Heart className="w-4 h-4" />
                        My Favorites
                    </Button>
                </Link>
            </div>

            {/* Appointments list */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Your Appointments
                </h2>

                {apptLoading ? (
                    <Card className="p-8 text-center text-sm text-gray-400">
                        Loading appointments...
                    </Card>
                ) : appointments.length === 0 ? (
                    <Card className="p-8 border-gray-100 text-center">
                        <Search className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-700 mb-2">
                            No appointments yet
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Browse local businesses and book your first
                            appointment.
                        </p>
                        <Link href="/browse">
                            <Button className="py-3 px-6 font-bold rounded-xl shadow-lg shadow-primary-100">
                                Browse Services
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {appointments.map((appt) => (
                            <Card key={appt.id} className="p-5 border-gray-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span
                                                className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${STATUS_STYLES[appt.status]}`}
                                            >
                                                {appt.status}
                                            </span>
                                        </div>
                                        <p className="font-bold text-gray-900 truncate">
                                            {appt.service?.name ?? "Appointment"}{" "}
                                            &mdash; {appt.business.name}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {format(
                                                new Date(appt.slot.start_time),
                                                "EEEE, MMM d · h:mm a",
                                            )}{" "}
                                            · {appt.employee.name}
                                        </p>
                                        {appt.status === "CANCELLED" &&
                                            appt.cancellation_reason && (
                                                <p className="text-xs text-gray-400 mt-1.5 italic">
                                                    Reason:{" "}
                                                    {appt.cancellation_reason}
                                                </p>
                                            )}
                                    </div>

                                    {appt.status !== "CANCELLED" && (
                                        <Button
                                            variant="danger"
                                            onClick={() =>
                                                setCancelTarget(appt)
                                            }
                                            className="shrink-0"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {cancelTarget && (
                <CancelModal
                    appointment={cancelTarget}
                    onClose={() => setCancelTarget(null)}
                    onConfirm={handleCancel}
                />
            )}
        </main>
    );
}
