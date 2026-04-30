"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Sunrise, Sunset, Clock } from "lucide-react";
import { Calendar, dateFnsLocalizer, View, SlotInfo, EventProps } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/src/components/ui";
import { getUserBusiness } from "@/app/actions/businesses";
import { getEmployees } from "@/app/actions/employees";
import { getTimeslots, saveTimeslots, Timeslot } from "@/app/actions/timeslots";

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
    getDay,
    locales: { "en-US": enUS },
});

type Employee = {
    id: string;
    name: string;
    role: string;
    avatar: string | null;
};

type PendingSlot = {
    localId: string;
    start: Date;
    end: Date;
};

type CalendarEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: {
        type: "saved" | "pending-add";
        is_booked: boolean;
        markedForDelete: boolean;
    };
};

function ViewSwitcher({ view, onChange }: { view: View; onChange: (v: View) => void }) {
    return (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {(["day", "week", "month"] as const).map((v) => (
                <button
                    key={v}
                    type="button"
                    onClick={() => onChange(v)}
                    className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors capitalize ${
                        view === v
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                    {v}
                </button>
            ))}
        </div>
    );
}

function CustomEvent({ event }: EventProps<CalendarEvent>) {
    const { type, is_booked, markedForDelete } = event.resource;

    if (type === "pending-add") {
        return (
            <div className="bg-green-500 text-white text-xs rounded px-1.5 flex items-center justify-between gap-1 h-full overflow-hidden">
                <span className="truncate font-semibold">New ×</span>
            </div>
        );
    }

    if (is_booked) {
        return (
            <div className="bg-blue-500 text-white text-xs rounded px-1.5 h-full flex items-center overflow-hidden">
                <span className="font-semibold truncate">Booked</span>
            </div>
        );
    }

    if (markedForDelete) {
        return (
            <div className="bg-primary-50 border border-primary-300 text-primary-600 text-xs rounded px-1.5 h-full flex items-center overflow-hidden line-through">
                <span className="truncate">Remove ×</span>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 border border-gray-300 text-gray-700 text-xs rounded px-1.5 h-full flex items-center overflow-hidden">
            <span className="font-semibold truncate">Available</span>
        </div>
    );
}

function EmployeeAvatar({ employee, selected, onClick }: { employee: Employee; selected: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all font-semibold text-sm ${
                selected
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
            {employee.avatar ? (
                <img src={employee.avatar} alt={employee.name} className="w-6 h-6 rounded-full object-cover" />
            ) : (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${selected ? "bg-primary-500" : "bg-gray-300 text-gray-600"}`}>
                    {employee.name.charAt(0).toUpperCase()}
                </div>
            )}
            {employee.name}
        </button>
    );
}

function getVisibleRange(view: View, date: Date): { start: Date; end: Date } {
    if (view === "day") return { start: startOfDay(date), end: endOfDay(date) };
    if (view === "month") return { start: startOfMonth(date), end: endOfMonth(date) };
    // week — Mon to Sun
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

type TemplateRange = { from: number; to: number };

const TEMPLATES: {
    id: string;
    label: string;
    description: string;
    subtitle: string;
    icon: React.ReactNode;
    ranges: TemplateRange[];
}[] = [
    {
        id: "morning",
        label: "Morning Shift",
        description: "8:00 AM – 4:00 PM",
        subtitle: "8 hourly slots per day",
        icon: <Sunrise className="w-5 h-5" />,
        ranges: [{ from: 8, to: 16 }],
    },
    {
        id: "afternoon",
        label: "Afternoon Shift",
        description: "12:00 PM – 8:00 PM",
        subtitle: "8 hourly slots per day",
        icon: <Sunset className="w-5 h-5" />,
        ranges: [{ from: 12, to: 20 }],
    },
    {
        id: "split",
        label: "Split Shift",
        description: "8–12 AM & 4–8 PM",
        subtitle: "8 hourly slots per day",
        icon: <Clock className="w-5 h-5" />,
        ranges: [{ from: 8, to: 12 }, { from: 16, to: 20 }],
    },
];

function slotsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    return aStart < bEnd && aEnd > bStart;
}

function buildSlotsFromRanges(
    days: Date[],
    ranges: TemplateRange[],
    existingSaved: Timeslot[],
    existingPending: PendingSlot[],
): PendingSlot[] {
    const result: PendingSlot[] = [];
    for (const day of days) {
        for (const range of ranges) {
            for (let h = range.from; h < range.to; h++) {
                const start = new Date(day);
                start.setHours(h, 0, 0, 0);
                const end = new Date(day);
                end.setHours(h + 1, 0, 0, 0);
                const hasConflict =
                    existingSaved.some((s) => slotsOverlap(new Date(s.start_time), new Date(s.end_time), start, end)) ||
                    existingPending.some((p) => slotsOverlap(p.start, p.end, start, end));
                if (!hasConflict) {
                    result.push({ localId: crypto.randomUUID(), start, end });
                }
            }
        }
    }
    return result;
}

export default function SchedulePage() {
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [businessId, setBusinessId] = useState<string | null>(null);
    const [isSoleOperator, setIsSoleOperator] = useState(false);

    const [savedSlots, setSavedSlots] = useState<Timeslot[]>([]);
    const [pendingAdd, setPendingAdd] = useState<PendingSlot[]>([]);
    const [pendingDelete, setPendingDelete] = useState<Set<string>>(new Set());

    const [view, setView] = useState<View>("week");
    const [date, setDate] = useState<Date>(new Date());

    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [switchWarning, setSwitchWarning] = useState<string | null>(null);
    const [pendingEmployeeSwitch, setPendingEmployeeSwitch] = useState<string | null>(null);

    const hasPendingChanges = pendingAdd.length > 0 || pendingDelete.size > 0;

    useEffect(() => {
        if (isAuthenticated === false) router.push("/login");
    }, [isAuthenticated, router]);

    // Bootstrap: load business + employees
    useEffect(() => {
        if (!user) return;
        (async () => {
            const { business } = await getUserBusiness();
            if (!business) { router.push("/dashboard/business/setup"); return; }

            setBusinessId(business.id);
            setIsSoleOperator(!!business.sole_operator);

            const { data: emps } = await getEmployees(business.id);
            if (emps && emps.length > 0) {
                setEmployees(emps as Employee[]);
                setSelectedEmployeeId(emps[0].id);
            }
            setLoading(false);
        })();
    }, [user, router]);

    // Fetch slots whenever selected employee, view, or date changes
    const fetchSlots = useCallback(async (bizId: string, empId: string, v: View, d: Date) => {
        setSlotsLoading(true);
        const { start, end } = getVisibleRange(v, d);
        const { data, error: fetchError } = await getTimeslots(bizId, empId, start, end);
        if (fetchError) { setError(fetchError); setSlotsLoading(false); return; }
        setSavedSlots((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const fresh = (data ?? []).filter((s) => !existingIds.has(s.id));
            return [...prev, ...fresh];
        });
        setSlotsLoading(false);
    }, []);

    useEffect(() => {
        if (!businessId || !selectedEmployeeId) return;
        fetchSlots(businessId, selectedEmployeeId, view, date);
    }, [businessId, selectedEmployeeId, view, date, fetchSlots]);

    const events: CalendarEvent[] = useMemo(() => {
        const visibleSaved = savedSlots.filter((s) => s.employee_id === selectedEmployeeId);
        const saved: CalendarEvent[] = visibleSaved.map((slot) => ({
            id: slot.id,
            title: slot.is_booked
                ? "Booked"
                : pendingDelete.has(slot.id)
                ? "Remove"
                : "Available",
            start: new Date(slot.start_time),
            end: new Date(slot.end_time),
            resource: {
                type: "saved",
                is_booked: slot.is_booked,
                markedForDelete: pendingDelete.has(slot.id),
            },
        }));

        const pending: CalendarEvent[] = pendingAdd.map((p) => ({
            id: p.localId,
            title: "New slot",
            start: p.start,
            end: p.end,
            resource: { type: "pending-add", is_booked: false, markedForDelete: false },
        }));

        return [...saved, ...pending];
    }, [savedSlots, pendingAdd, pendingDelete, selectedEmployeeId]);

    const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
        if (view === "month") {
            setView("day");
            setDate(slotInfo.start);
            return;
        }
        setPendingAdd((prev) => [
            ...prev,
            { localId: crypto.randomUUID(), start: slotInfo.start, end: slotInfo.end },
        ]);
    }, [view]);

    const handleSelectEvent = useCallback((event: CalendarEvent) => {
        if (event.resource.type === "pending-add") {
            setPendingAdd((prev) => prev.filter((p) => p.localId !== event.id));
            return;
        }
        if (event.resource.is_booked) return;
        setPendingDelete((prev) => {
            const next = new Set(prev);
            if (next.has(event.id)) next.delete(event.id);
            else next.add(event.id);
            return next;
        });
    }, []);

    const handleSave = async () => {
        if (!businessId || !selectedEmployeeId) return;
        setSaving(true);
        setError(null);

        const result = await saveTimeslots({
            businessId,
            employeeId: selectedEmployeeId,
            create: pendingAdd.map((p) => ({
                start_time: p.start.toISOString(),
                end_time: p.end.toISOString(),
            })),
            deleteIds: Array.from(pendingDelete),
        });

        if (result.error) {
            setError(result.error);
            setSaving(false);
            return;
        }

        // Remove deleted slots and clear pending state, then refetch fresh
        setSavedSlots((prev) =>
            prev.filter((s) => !pendingDelete.has(s.id) || s.employee_id !== selectedEmployeeId),
        );
        setPendingAdd([]);
        setPendingDelete(new Set());

        // Refetch current window to get real IDs for newly created slots
        const { start, end } = getVisibleRange(view, date);
        const { data } = await getTimeslots(businessId, selectedEmployeeId, start, end);
        if (data) {
            setSavedSlots((prev) => {
                const existingIds = new Set(prev.map((s) => s.id));
                const fresh = data.filter((s) => !existingIds.has(s.id));
                return [...prev, ...fresh];
            });
        }

        setSaving(false);
    };

    const handleEmployeeClick = (empId: string) => {
        if (empId === selectedEmployeeId) return;
        if (hasPendingChanges) {
            setPendingEmployeeSwitch(empId);
            setSwitchWarning(empId);
            return;
        }
        setSavedSlots([]);
        setSelectedEmployeeId(empId);
    };

    const confirmEmployeeSwitch = () => {
        if (!pendingEmployeeSwitch) return;
        setPendingAdd([]);
        setPendingDelete(new Set());
        setSavedSlots([]);
        setSelectedEmployeeId(pendingEmployeeSwitch);
        setPendingEmployeeSwitch(null);
        setSwitchWarning(null);
    };

    const handleApplyTemplate = (ranges: TemplateRange[]) => {
        let targetView = view;
        let targetDate = date;

        // Month view: switch to week view for the current anchor date
        if (view === "month") {
            targetView = "week";
            setView("week");
        }

        const { start, end } = getVisibleRange(targetView, targetDate);
        const days = eachDayOfInterval({ start: startOfDay(start), end: startOfDay(end) });
        const visibleSaved = savedSlots.filter((s) => s.employee_id === selectedEmployeeId);
        const newSlots = buildSlotsFromRanges(days, ranges, visibleSaved, pendingAdd);
        if (newSlots.length > 0) setPendingAdd((prev) => [...prev, ...newSlots]);
    };

    if (authLoading || loading) {
        return (
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-100 rounded w-1/4" />
                    <div className="h-10 bg-gray-100 rounded-xl w-48" />
                    <div className="h-[600px] bg-gray-100 rounded-xl" />
                </div>
            </main>
        );
    }

    if (employees.length === 0) {
        return (
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/dashboard/business">
                        <Button variant="ghost" className="px-2 py-2"><ArrowLeft className="w-4 h-4" /></Button>
                    </Link>
                    <h1 className="text-2xl font-extrabold text-gray-900">Schedule</h1>
                </div>
                <Card className="p-10 text-center border-gray-100">
                    <p className="text-gray-500 mb-4">No staff members found. Add employees first before managing the schedule.</p>
                    <Link href="/dashboard/business/services">
                        <Button>Go to Services &amp; Staff</Button>
                    </Link>
                </Card>
            </main>
        );
    }

    const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

    return (
        <main className="max-w-6xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
                <Link href="/dashboard/business">
                    <Button variant="ghost" className="px-2 py-2"><ArrowLeft className="w-4 h-4" /></Button>
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-extrabold text-gray-900">Schedule</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Click or drag to add available timeslots. Click an event to remove it.
                    </p>
                </div>
                <ViewSwitcher view={view} onChange={setView} />
            </div>

            {/* Employee selector (hidden for sole operators with 1 employee) */}
            {!isSoleOperator && employees.length > 1 && (
                <div className="mb-5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Staff member</p>
                    <div className="flex flex-wrap gap-2">
                        {employees.map((emp) => (
                            <EmployeeAvatar
                                key={emp.id}
                                employee={emp}
                                selected={emp.id === selectedEmployeeId}
                                onClick={() => handleEmployeeClick(emp.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Unsaved changes warning on employee switch */}
            {switchWarning && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">You have unsaved changes</p>
                        <p className="text-sm text-amber-700 mt-0.5">Switching staff members will discard your pending changes.</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button variant="secondary" className="text-xs py-1.5 px-3" onClick={() => { setSwitchWarning(null); setPendingEmployeeSwitch(null); }}>
                            Cancel
                        </Button>
                        <Button variant="danger" className="text-xs py-1.5 px-3" onClick={confirmEmployeeSwitch}>
                            Discard &amp; Switch
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-xl text-sm text-primary-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Quick-fill templates */}
            <div className="mb-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quick-fill templates</p>
                <div className="grid grid-cols-3 gap-3">
                    {TEMPLATES.map((tpl) => (
                        <button
                            key={tpl.id}
                            type="button"
                            onClick={() => handleApplyTemplate(tpl.ranges)}
                            className="group text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50 transition-all"
                        >
                            <div className="flex items-center gap-2 text-primary-500 mb-2 group-hover:text-primary-600">
                                {tpl.icon}
                                <span className="text-sm font-bold text-gray-800 group-hover:text-gray-900">{tpl.label}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">{tpl.description}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{tpl.subtitle}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 border border-gray-300 inline-block" />Available</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" />New (unsaved)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary-100 border border-primary-300 inline-block" />Marked for removal</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block" />Booked</span>
                {slotsLoading && <span className="text-gray-400 italic">Loading…</span>}
                {selectedEmployee && !isSoleOperator && (
                    <span className="ml-auto font-semibold text-gray-700">{selectedEmployee.name}</span>
                )}
            </div>

            {/* Calendar */}
            <Card className="p-0 overflow-hidden border-gray-100">
                <Calendar<CalendarEvent>
                    localizer={localizer}
                    events={events}
                    view={view}
                    date={date}
                    onView={(v) => setView(v)}
                    onNavigate={(d) => setDate(d)}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    components={{ event: CustomEvent }}
                    step={30}
                    timeslots={2}
                    style={{ height: "calc(100vh - 280px)", minHeight: 520 }}
                    toolbar={true}
                />
            </Card>

            {/* Sticky Save Bar */}
            {hasPendingChanges && (
                <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pointer-events-none">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl px-6 py-4 flex items-center gap-6 pointer-events-auto">
                        <div className="text-sm text-gray-700 flex items-center gap-3">
                            {pendingAdd.length > 0 && (
                                <span className="text-green-600 font-bold">+{pendingAdd.length} to add</span>
                            )}
                            {pendingDelete.size > 0 && (
                                <span className="text-primary-600 font-bold">{pendingDelete.size} to remove</span>
                            )}
                        </div>
                        <Button
                            variant="secondary"
                            className="text-sm"
                            onClick={() => { setPendingAdd([]); setPendingDelete(new Set()); }}
                            disabled={saving}
                        >
                            Discard
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="px-6 font-bold">
                            {saving ? "Saving…" : "Save changes"}
                        </Button>
                    </div>
                </div>
            )}
        </main>
    );
}
