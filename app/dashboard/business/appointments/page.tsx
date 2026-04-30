"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format, isAfter } from "date-fns";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Phone,
    User,
    XCircle,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/src/components/ui";
import {
    getBusinessAppointments,
    confirmAppointment,
    cancelAppointmentAsOwner,
    type BusinessAppointment,
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

type Tab = "pending" | "upcoming" | "past";

// ─── Cancel modal ──────────────────────────────────────────────────────────────
function CancelModal({
    appointment,
    onClose,
    onConfirm,
}: {
    appointment: BusinessAppointment;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
}) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) return;
        setSubmitting(true);
        await onConfirm(reason.trim());
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <h3 className="text-lg font-black text-gray-900 mb-4">
                    Cancel Appointment
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1">
                    <p className="text-sm font-bold text-gray-900">
                        {appointment.service?.name ?? "Appointment"}
                    </p>
                    <p className="text-xs text-gray-500">
                        {appointment.client.name} &middot;{" "}
                        {format(
                            new Date(appointment.slot.start_time),
                            "EEEE, MMM d · h:mm a",
                        )}
                    </p>
                </div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                    Reason for cancellation
                </label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Schedule conflict..."
                    rows={3}
                    className="w-full text-sm border border-gray-200 rounded-xl p-3 text-gray-700 resize-none focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 mb-4"
                />
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Keep it
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleSubmit}
                        disabled={!reason.trim() || submitting}
                    >
                        {submitting ? "Cancelling..." : "Cancel"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Appointment card ──────────────────────────────────────────────────────────
function AppointmentCard({
    appt,
    onConfirm,
    onCancel,
    confirming,
}: {
    appt: BusinessAppointment;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirming?: boolean;
}) {
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

                <div className="w-px self-stretch bg-gray-100 shrink-0" />

                {/* Main content */}
                <div className="flex-1 min-w-0">
                    {/* Status badge */}
                    <div className="flex items-center gap-2 mb-2">
                        <span
                            className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLES[appt.status]}`}
                        >
                            {STATUS_ICONS[appt.status]}
                            {appt.status}
                        </span>
                    </div>

                    {/* Service + time */}
                    <p className="font-bold text-gray-900 truncate">
                        {appt.service?.name ?? "Appointment"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {format(start, "h:mm a")} – {format(end, "h:mm a")}
                        </span>
                        {appt.service && (
                            <span className="text-xs font-bold text-primary-600">
                                {appt.service.price}
                            </span>
                        )}
                    </div>

                    {/* Employee row */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                        {appt.employee.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={appt.employee.avatar}
                                alt={appt.employee.name}
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                                <User className="w-3 h-3 text-primary-400" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">
                                {appt.employee.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                                {appt.employee.role}
                            </p>
                        </div>
                    </div>

                    {/* Client row */}
                    <div className="flex items-center gap-2 mt-2">
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
                        <div className="flex items-center gap-2 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">
                                {appt.client.name}
                            </p>
                            {appt.client.phone && (
                                <span className="flex items-center gap-0.5 text-[10px] text-gray-400 shrink-0">
                                    <Phone className="w-2.5 h-2.5" />
                                    {appt.client.phone}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Cancellation reason */}
                    {appt.status === "CANCELLED" && appt.cancellation_reason && (
                        <p className="text-xs text-gray-400 mt-2 italic">
                            Reason: {appt.cancellation_reason}
                        </p>
                    )}

                    {/* Actions */}
                    {appt.status !== "CANCELLED" && (onConfirm || onCancel) && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                            {onConfirm && appt.status === "PENDING" && (
                                <Button
                                    onClick={onConfirm}
                                    disabled={confirming}
                                    className="text-xs px-4 py-1.5 gap-1 bg-green-600 hover:bg-green-700 focus:ring-green-500"
                                >
                                    <CheckCircle2 className="w-3 h-3" />
                                    {confirming ? "Confirming..." : "Confirm"}
                                </Button>
                            )}
                            {onCancel && (
                                <Button
                                    variant="danger"
                                    onClick={onCancel}
                                    className="text-xs px-4 py-1.5"
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function BusinessAppointmentsPage() {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [appointments, setAppointments] = useState<BusinessAppointment[]>([]);
    const [apptLoading, setApptLoading] = useState(true);
    const [tab, setTab] = useState<Tab>("pending");
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [cancelTarget, setCancelTarget] = useState<BusinessAppointment | null>(null);

    useEffect(() => {
        if (isAuthenticated === false) router.push("/login");
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (!user) return;
        getBusinessAppointments().then(({ data }) => {
            setAppointments(data ?? []);
            setApptLoading(false);
        });
    }, [user]);

    const handleConfirm = async (apptId: string) => {
        setConfirmingId(apptId);
        const { error } = await confirmAppointment(apptId);
        if (!error) {
            setAppointments((prev) =>
                prev.map((a) =>
                    a.id === apptId ? { ...a, status: "CONFIRMED" as const } : a,
                ),
            );
        }
        setConfirmingId(null);
    };

    const handleCancel = async (reason: string) => {
        if (!cancelTarget) return;
        const { error } = await cancelAppointmentAsOwner(cancelTarget.id, reason);
        if (!error) {
            setAppointments((prev) =>
                prev.map((a) =>
                    a.id === cancelTarget.id
                        ? { ...a, status: "CANCELLED" as const, cancellation_reason: reason }
                        : a,
                ),
            );
        }
        setCancelTarget(null);
    };

    if (loading || apptLoading) {
        return (
            <main className="max-w-2xl mx-auto px-6 py-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-100 rounded w-1/3" />
                    <div className="h-16 bg-gray-100 rounded-xl" />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 bg-gray-100 rounded-xl" />
                    ))}
                </div>
            </main>
        );
    }

    const now = new Date();

    const pending = appointments.filter((a) => a.status === "PENDING");
    const upcoming = appointments.filter(
        (a) =>
            a.status === "CONFIRMED" &&
            isAfter(new Date(a.slot.start_time), now),
    );
    const past = appointments.filter(
        (a) =>
            a.status === "CANCELLED" ||
            (a.status === "CONFIRMED" &&
                !isAfter(new Date(a.slot.start_time), now)),
    );

    const tabs: { key: Tab; label: string; count: number }[] = [
        { key: "pending", label: "Pending", count: pending.length },
        { key: "upcoming", label: "Upcoming", count: upcoming.length },
        { key: "past", label: "Past", count: past.length },
    ];

    const shown =
        tab === "pending" ? pending : tab === "upcoming" ? upcoming : past;

    const sortedShown =
        tab === "past"
            ? [...shown].sort(
                  (a, b) =>
                      new Date(b.slot.start_time).getTime() -
                      new Date(a.slot.start_time).getTime(),
              )
            : [...shown].sort(
                  (a, b) =>
                      new Date(a.slot.start_time).getTime() -
                      new Date(b.slot.start_time).getTime(),
              );

    return (
        <main className="max-w-2xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Link href="/dashboard/business">
                    <Button variant="ghost" className="px-2 py-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary-500" />
                        <h1 className="text-2xl font-extrabold text-gray-900">
                            Bookings
                        </h1>
                        {pending.length > 0 && (
                            <span className="text-xs font-black bg-amber-500 text-white px-2 py-0.5 rounded-full">
                                {pending.length} pending
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Manage all appointment requests.
                    </p>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                    { label: "Pending", value: pending.length, highlight: pending.length > 0 },
                    { label: "Upcoming", value: upcoming.length, highlight: false },
                    {
                        label: "Total",
                        value: appointments.filter((a) => a.status !== "CANCELLED").length,
                        highlight: false,
                    },
                ].map(({ label, value, highlight }) => (
                    <Card key={label} className="p-4 border-gray-100 text-center">
                        <p
                            className={`text-2xl font-extrabold ${highlight ? "text-amber-500" : "text-gray-900"}`}
                        >
                            {value}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
                {tabs.map(({ key, label, count }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setTab(key)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
                            tab === key
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {label}
                        {count > 0 && (
                            <span
                                className={`ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                    tab === key && key === "pending"
                                        ? "bg-amber-100 text-amber-700"
                                        : tab === key
                                          ? "bg-gray-100 text-gray-600"
                                          : "bg-gray-200 text-gray-500"
                                }`}
                            >
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Appointment list */}
            {sortedShown.length === 0 ? (
                <Card className="p-10 border-gray-100 text-center">
                    <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-400">
                        {tab === "pending"
                            ? "No pending requests."
                            : tab === "upcoming"
                              ? "No upcoming appointments."
                              : "No past appointments."}
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {sortedShown.map((appt) => (
                        <AppointmentCard
                            key={appt.id}
                            appt={appt}
                            onConfirm={
                                appt.status === "PENDING"
                                    ? () => handleConfirm(appt.id)
                                    : undefined
                            }
                            onCancel={
                                appt.status !== "CANCELLED"
                                    ? () => setCancelTarget(appt)
                                    : undefined
                            }
                            confirming={confirmingId === appt.id}
                        />
                    ))}
                </div>
            )}

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
