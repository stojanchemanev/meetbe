"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    Clock,
    Loader2,
    Plus,
    Tag,
    Trash2,
    User,
    Users,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/src/components/ui";
import { getUserBusiness } from "@/app/actions/businesses";
import {
    getEmployees,
    createEmployee,
    deleteEmployee,
    getOrCreateOwnerEmployee,
} from "@/app/actions/employees";
import {
    getServices,
    createService,
    deleteService,
    assignEmployeeToService,
    removeEmployeeFromService,
    getEmployeeServicesMap,
} from "@/app/actions/services";
import { Service } from "@/src/types";
import UpgradeModal from "@/src/components/UpgradeModal";
import { PLAN_LIMIT_ERROR } from "@/src/lib/plans";
import type { Plan } from "@/src/lib/plans";

// Raw shape returned by Supabase (snake_case column names)
type DBEmployee = {
    id: string;
    business_id: string;
    user_id?: string | null;
    name: string;
    role: string;
    avatar?: string | null;
};

const inputClass =
    "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder:text-gray-400 bg-white";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

async function uploadAvatarToS3(file: File): Promise<string | null> {
    try {
        const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
                folder: "avatars",
                sizeBytes: file.size,
            }),
        });
        const { uploadUrl, publicUrl, error } = await res.json();
        if (error) throw new Error(error);
        await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
        });
        return publicUrl;
    } catch {
        return null;
    }
}

// ─── Toggle component ──────────────────────────────────────────────────────────
function Toggle({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                checked ? "bg-red-600" : "bg-gray-200"
            }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    checked ? "translate-x-5" : "translate-x-0.5"
                }`}
            />
        </button>
    );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ServicesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [businessId, setBusinessId] = useState<string | null>(null);
    const [plan, setPlan] = useState<Plan>("free");
    const [pageLoading, setPageLoading] = useState(true);

    // Upgrade modal
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [upgradeType, setUpgradeType] = useState<
        "services" | "employees" | "clients"
    >("services");

    const [employees, setEmployees] = useState<DBEmployee[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    // serviceId → employeeIds
    const [empByService, setEmpByService] = useState<Record<string, string[]>>(
        {},
    );

    const [soleOperator, setSoleOperator] = useState(false);
    const [ownerEmployeeId, setOwnerEmployeeId] = useState<string | null>(null);
    const [togglingMode, setTogglingMode] = useState(false);

    // Employee form
    const [showEmpForm, setShowEmpForm] = useState(false);
    const [empName, setEmpName] = useState("");
    const [empRole, setEmpRole] = useState("");
    const [empAvatarFile, setEmpAvatarFile] = useState<File | null>(null);
    const [empAvatarPreview, setEmpAvatarPreview] = useState<string | null>(
        null,
    );
    const [savingEmp, setSavingEmp] = useState(false);
    const [empError, setEmpError] = useState<string | null>(null);
    const empAvatarRef = useRef<HTMLInputElement>(null);

    // Service form
    const [showSvcForm, setShowSvcForm] = useState(false);
    const [svcName, setSvcName] = useState("");
    const [svcDuration, setSvcDuration] = useState(30);
    const [svcPrice, setSvcPrice] = useState("");
    const [svcDescription, setSvcDescription] = useState("");
    const [savingSvc, setSavingSvc] = useState(false);
    const [svcError, setSvcError] = useState<string | null>(null);

    // Per-service assignment toggling
    const [togglingLink, setTogglingLink] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        (async () => {
            const { business } = await getUserBusiness();
            if (!business?.id) {
                router.push("/dashboard/business/setup");
                return;
            }

            setBusinessId(business.id);
            setPlan((business.plan as Plan) ?? "free");

            const [empRes, svcRes, mapRes] = await Promise.all([
                getEmployees(business.id),
                getServices(business.id),
                getEmployeeServicesMap(business.id),
            ]);

            const empList = (empRes.data as DBEmployee[]) ?? [];
            setEmployees(empList);
            setServices((svcRes.data as Service[]) ?? []);
            setEmpByService(mapRes.data ?? {});

            // Detect sole-operator mode: only 1 employee and it's the owner
            const ownerEmp = empList.find((e) => e.user_id === user.id);
            const hasOtherEmployees = empList.some((e) => e.user_id !== user.id);
            if (ownerEmp && !hasOtherEmployees) {
                setSoleOperator(true);
                setOwnerEmployeeId(ownerEmp.id);
            } else if (ownerEmp) {
                setOwnerEmployeeId(ownerEmp.id);
            }

            setPageLoading(false);
        })();
    }, [user, router]);

    // ── Sole-operator toggle ────────────────────────────────────────────────
    const handleSoleOperatorToggle = async (val: boolean) => {
        if (!businessId) return;
        setSoleOperator(val);

        if (val && !ownerEmployeeId) {
            setTogglingMode(true);
            const result = await getOrCreateOwnerEmployee(businessId);
            if (result.success && result.data) {
                const emp = result.data as DBEmployee;
                setOwnerEmployeeId(emp.id);
                setEmployees((prev) => {
                    if (prev.find((e) => e.id === emp.id)) return prev;
                    return [...prev, emp];
                });
            }
            setTogglingMode(false);
        }
    };

    // ── Employee CRUD ───────────────────────────────────────────────────────
    const handleEmpAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setEmpAvatarFile(file);
        const prev = empAvatarPreview;
        if (prev) URL.revokeObjectURL(prev);
        setEmpAvatarPreview(URL.createObjectURL(file));
    };

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessId || !empName.trim() || !empRole.trim()) {
            setEmpError("Name and role are required.");
            return;
        }
        setSavingEmp(true);
        setEmpError(null);

        let avatarUrl: string | undefined;
        if (empAvatarFile) {
            const uploaded = await uploadAvatarToS3(empAvatarFile);
            if (uploaded) avatarUrl = uploaded;
        }

        const result = await createEmployee(
            businessId,
            empName,
            empRole,
            avatarUrl,
        );

        if (result.error) {
            if (result.error === PLAN_LIMIT_ERROR) {
                setUpgradeType("employees");
                setUpgradeOpen(true);
            } else {
                setEmpError(result.error);
            }
        } else if (result.data) {
            setEmployees((prev) => [...prev, result.data as DBEmployee]);
            setEmpName("");
            setEmpRole("");
            setEmpAvatarFile(null);
            setEmpAvatarPreview(null);
            setShowEmpForm(false);
        }
        setSavingEmp(false);
    };

    const handleDeleteEmployee = async (employeeId: string) => {
        const result = await deleteEmployee(employeeId);
        if (!result.error) {
            setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
        }
    };

    // ── Service CRUD ────────────────────────────────────────────────────────
    const handleAddService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessId || !svcName.trim() || !svcPrice.trim()) {
            setSvcError("Name and price are required.");
            return;
        }
        setSavingSvc(true);
        setSvcError(null);

        const result = await createService(
            businessId,
            svcName,
            svcDuration,
            svcPrice,
            svcDescription,
        );

        if (result.error) {
            if (result.error === PLAN_LIMIT_ERROR) {
                setUpgradeType("services");
                setUpgradeOpen(true);
            } else {
                setSvcError(result.error);
            }
        } else if (result.data) {
            const newService = result.data as Service;
            setServices((prev) => [...prev, newService]);

            // Auto-assign to owner in sole-operator mode
            if (soleOperator && ownerEmployeeId) {
                await assignEmployeeToService(ownerEmployeeId, newService.id);
                setEmpByService((prev) => ({
                    ...prev,
                    [newService.id]: [ownerEmployeeId],
                }));
            }

            setSvcName("");
            setSvcDuration(30);
            setSvcPrice("");
            setSvcDescription("");
            setShowSvcForm(false);
        }
        setSavingSvc(false);
    };

    const handleDeleteService = async (serviceId: string) => {
        const result = await deleteService(serviceId);
        if (!result.error) {
            setServices((prev) => prev.filter((s) => s.id !== serviceId));
            setEmpByService((prev) => {
                const next = { ...prev };
                delete next[serviceId];
                return next;
            });
        }
    };

    // ── Employee ↔ Service linking ──────────────────────────────────────────
    const handleToggleLink = async (employeeId: string, serviceId: string) => {
        const key = `${employeeId}:${serviceId}`;
        setTogglingLink(key);

        const assigned = (empByService[serviceId] ?? []).includes(employeeId);

        if (assigned) {
            await removeEmployeeFromService(employeeId, serviceId);
            setEmpByService((prev) => ({
                ...prev,
                [serviceId]: (prev[serviceId] ?? []).filter(
                    (id) => id !== employeeId,
                ),
            }));
        } else {
            await assignEmployeeToService(employeeId, serviceId);
            setEmpByService((prev) => ({
                ...prev,
                [serviceId]: [...(prev[serviceId] ?? []), employeeId],
            }));
        }
        setTogglingLink(null);
    };

    // ── Render ──────────────────────────────────────────────────────────────
    if (loading || pageLoading) {
        return (
            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-100 rounded w-1/3" />
                    <div className="h-20 bg-gray-100 rounded-xl" />
                    <div className="h-48 bg-gray-100 rounded-xl" />
                    <div className="h-48 bg-gray-100 rounded-xl" />
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-3xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Link href="/dashboard/business">
                    <Button variant="ghost" className="px-2 py-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-extrabold text-gray-900">
                            Services &amp; Staff
                        </h1>
                        <span
                            className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                plan === "growth"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-100 text-gray-500"
                            }`}
                        >
                            {plan === "growth" ? "Growth" : "Free"}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Manage what you offer and who delivers it.
                    </p>
                </div>
            </div>

            {/* ── Sole-operator toggle ──────────────────────────────────── */}
            <Card className="p-5 border-gray-100 mb-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">
                                I&apos;m the sole operator
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                No other staff — services are assigned to you
                                automatically.
                            </p>
                        </div>
                    </div>
                    {togglingMode ? (
                        <Loader2 className="w-5 h-5 animate-spin text-red-500 shrink-0" />
                    ) : (
                        <Toggle
                            checked={soleOperator}
                            onChange={handleSoleOperatorToggle}
                        />
                    )}
                </div>
            </Card>

            {/* ── Employees section (hidden when sole operator) ─────────── */}
            {!soleOperator && (
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-red-500" />
                            Staff
                        </h2>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowEmpForm((p) => !p);
                                setEmpError(null);
                            }}
                            className="text-xs px-3 py-1.5 gap-1"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Employee
                        </Button>
                    </div>

                    {/* Add employee form */}
                    {showEmpForm && (
                        <Card className="p-5 border-gray-100 mb-4">
                            <form onSubmit={handleAddEmployee}>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                                    New Employee
                                </h3>
                                <div className="flex gap-4 items-start mb-4">
                                    {/* Avatar */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            empAvatarRef.current?.click()
                                        }
                                        className="relative w-16 h-16 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-red-400 hover:bg-red-50 transition-colors group shrink-0"
                                    >
                                        {empAvatarPreview ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={empAvatarPreview}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                    <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                                                </div>
                                            </>
                                        ) : (
                                            <Camera className="w-5 h-5 text-gray-300 group-hover:text-red-400" />
                                        )}
                                    </button>
                                    <input
                                        ref={empAvatarRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handleEmpAvatarChange}
                                    />

                                    <div className="flex-1 space-y-3">
                                        <input
                                            type="text"
                                            value={empName}
                                            onChange={(e) =>
                                                setEmpName(e.target.value)
                                            }
                                            placeholder="Full name *"
                                            className={inputClass}
                                        />
                                        <input
                                            type="text"
                                            value={empRole}
                                            onChange={(e) =>
                                                setEmpRole(e.target.value)
                                            }
                                            placeholder="Role (e.g. Stylist) *"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                {empError && (
                                    <p className="text-xs text-red-600 mb-3 font-medium">
                                        {empError}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        disabled={savingEmp}
                                        className="text-sm px-5 py-2 font-bold"
                                    >
                                        {savingEmp ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Add"
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setShowEmpForm(false)}
                                        className="text-sm px-4 py-2"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {/* Employee list */}
                    {employees.length === 0 ? (
                        <Card className="p-6 border-gray-100 text-center">
                            <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">
                                No staff added yet.
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {employees.map((emp) => (
                                <Card
                                    key={emp.id}
                                    className="px-4 py-3 border-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        {emp.avatar ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={emp.avatar}
                                                alt={emp.name}
                                                className="w-9 h-9 rounded-full object-cover shrink-0"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                {emp.name}
                                                {emp.user_id === user?.id && (
                                                    <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                                                        You
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {emp.role}
                                            </p>
                                        </div>
                                        {emp.user_id !== user?.id && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDeleteEmployee(emp.id)
                                                }
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1 shrink-0"
                                                title="Remove employee"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* ── Services section ──────────────────────────────────────── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-red-500" />
                        Services
                    </h2>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowSvcForm((p) => !p);
                            setSvcError(null);
                        }}
                        className="text-xs px-3 py-1.5 gap-1"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Service
                    </Button>
                </div>

                {/* Add service form */}
                {showSvcForm && (
                    <Card className="p-5 border-gray-100 mb-4">
                        <form onSubmit={handleAddService}>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                                New Service
                            </h3>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={svcName}
                                    onChange={(e) =>
                                        setSvcName(e.target.value)
                                    }
                                    placeholder="Service name *"
                                    className={inputClass}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                                            Duration
                                        </label>
                                        <select
                                            value={svcDuration}
                                            onChange={(e) =>
                                                setSvcDuration(
                                                    Number(e.target.value),
                                                )
                                            }
                                            className={inputClass}
                                        >
                                            {DURATION_OPTIONS.map((d) => (
                                                <option key={d} value={d}>
                                                    {d < 60
                                                        ? `${d} min`
                                                        : `${d / 60} hr${d > 60 ? "s" : ""}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                                            Price *
                                        </label>
                                        <input
                                            type="text"
                                            value={svcPrice}
                                            onChange={(e) =>
                                                setSvcPrice(e.target.value)
                                            }
                                            placeholder="e.g. $40"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <textarea
                                    value={svcDescription}
                                    onChange={(e) =>
                                        setSvcDescription(e.target.value)
                                    }
                                    placeholder="Description (optional)"
                                    rows={2}
                                    className={`${inputClass} resize-none`}
                                />
                            </div>

                            {svcError && (
                                <p className="text-xs text-red-600 mt-3 font-medium">
                                    {svcError}
                                </p>
                            )}

                            <div className="flex gap-2 mt-4">
                                <Button
                                    type="submit"
                                    disabled={savingSvc}
                                    className="text-sm px-5 py-2 font-bold"
                                >
                                    {savingSvc ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        "Add"
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowSvcForm(false)}
                                    className="text-sm px-4 py-2"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Service list */}
                {services.length === 0 ? (
                    <Card className="p-6 border-gray-100 text-center">
                        <Tag className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">
                            No services added yet.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {services.map((svc) => {
                            const assignedIds = empByService[svc.id] ?? [];
                            return (
                                <Card
                                    key={svc.id}
                                    className="p-5 border-gray-100"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900">
                                                {svc.name}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Clock className="w-3 h-3" />
                                                    {svc.duration < 60
                                                        ? `${svc.duration} min`
                                                        : `${svc.duration / 60} hr`}
                                                </span>
                                                <span className="text-xs font-bold text-red-600">
                                                    {svc.price}
                                                </span>
                                            </div>
                                            {svc.description && (
                                                <p className="text-xs text-gray-400 mt-1.5">
                                                    {svc.description}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDeleteService(svc.id)
                                            }
                                            className="text-gray-300 hover:text-red-500 transition-colors p-1 shrink-0 mt-0.5"
                                            title="Remove service"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Employee assignment (always shown) */}
                                    {employees.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-50">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                                                {soleOperator
                                                    ? "Performed by"
                                                    : "Assign to staff"}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {(soleOperator
                                                    ? employees.filter(
                                                          (e) =>
                                                              e.user_id ===
                                                              user?.id,
                                                      )
                                                    : employees
                                                ).map((emp) => {
                                                    const isAssigned =
                                                        assignedIds.includes(
                                                            emp.id,
                                                        );
                                                    const linkKey = `${emp.id}:${svc.id}`;
                                                    const isToggling =
                                                        togglingLink ===
                                                        linkKey;
                                                    return (
                                                        <button
                                                            key={emp.id}
                                                            type="button"
                                                            disabled={
                                                                soleOperator ||
                                                                isToggling
                                                            }
                                                            onClick={() =>
                                                                handleToggleLink(
                                                                    emp.id,
                                                                    svc.id,
                                                                )
                                                            }
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                                                                isAssigned
                                                                    ? "bg-red-50 border-red-200 text-red-700"
                                                                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600"
                                                            } disabled:opacity-60 disabled:cursor-default`}
                                                        >
                                                            {isToggling ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : isAssigned ? (
                                                                <CheckCircle2 className="w-3 h-3" />
                                                            ) : (
                                                                <Plus className="w-3 h-3" />
                                                            )}
                                                            {emp.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Show "add staff first" hint */}
                                    {employees.length === 0 &&
                                        !soleOperator && (
                                            <p className="mt-3 text-xs text-gray-400 italic">
                                                Add staff above to assign them
                                                to this service.
                                            </p>
                                        )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Bottom spacer */}
            <div className="h-12" />

            <UpgradeModal
                isOpen={upgradeOpen}
                onClose={() => setUpgradeOpen(false)}
                limitType={upgradeType}
                userEmail={user?.email ?? ""}
                businessId={businessId ?? ""}
            />
        </main>
    );
}
