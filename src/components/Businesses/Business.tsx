"use client";
import React, { useEffect, useMemo, useState } from "react";
import { BusinessPayload } from "@/app/business/[id]/page";
import { useAuth } from "@/src/context/AuthContext";
import { useBookings } from "@/src/context/BookingContext";
import { useNotifications } from "@/src/context/NotificationContext";
import { Employee, Service, TimeSlot } from "@/src/types";
import BookingConfirmationModal from "../shared/ConfirmationModal";

import { CheckCircle, Clock, Heart, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Card } from "../ui";
import { format } from "date-fns";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { createAppointment } from "@/app/actions/appointments";
import { CLIENT_LIMIT_ERROR } from "@/src/lib/plans";

const Business = (data: BusinessPayload | null) => {
    const navigate = useRouter();

    const { addNotification } = useNotifications();
    const { addAppointment } = useBookings();
    const { user } = useAuth();
    console.log("user", user);

    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
        null,
    );
    const [selectedService, setSelectedService] = useState<Service | null>(
        null,
    );
    const [selectedDate, setSelectedDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    });
    // State for the confirmation modal
    const [slotToConfirm, setSlotToConfirm] = useState<TimeSlot | null>(null);
    const [bookingConfirmed, setBookingConfirmed] = useState(false);

    const [hasPending, setHasPending] = useState(false);
    const [capacityReached, setCapacityReached] = useState(false);

    // Favorites state
    const [isFav, setIsFav] = useState(false);
    const [favLoading, setFavLoading] = useState(false);

    useEffect(() => {
        if (!user || !data) return;
        const supabase = createClient();
        supabase
            .from("appointments")
            .select("id")
            .eq("client_id", user.id)
            .eq("business_id", data.id)
            .eq("status", "PENDING")
            .maybeSingle()
            .then(({ data: pending }) => setHasPending(!!pending));
    }, [user, data]);

    // Fetch initial favorite status
    useEffect(() => {
        if (!user || !data) return;
        const supabase = createClient();
        supabase
            .from("favorites")
            .select("id")
            .eq("client_id", user.id)
            .eq("business_id", data.id)
            .maybeSingle()
            .then(({ data: fav }) => setIsFav(!!fav));
    }, [user, data]);

    const toggleFavorite = async () => {
        if (!user || favLoading || !data) return;
        setFavLoading(true);
        const supabase = createClient();
        if (isFav) {
            await supabase
                .from("favorites")
                .delete()
                .eq("client_id", user.id)
                .eq("business_id", data.id);
            setIsFav(false);
        } else {
            await supabase
                .from("favorites")
                .insert({ client_id: user.id, business_id: data.id });
            setIsFav(true);
        }
        setFavLoading(false);
    };

    // SEO Meta Tags Injection
    useEffect(() => {
        if (data) {
            document.title = `${data.name} | Meetbe`;

            const metaTags = [
                { name: "description", content: data.description },
                {
                    property: "og:title",
                    content: `${data.name} - Book on Meetbe`,
                },
                { property: "og:description", content: data.description },
                { property: "og:image", content: data.logo },
                { property: "og:url", content: window.location.href },
                { property: "og:type", content: "data.data" },
                { property: "og:site_name", content: "Meetbe" },
                { name: "twitter:card", content: "summary_large_image" },
                {
                    name: "twitter:title",
                    content: `${data.name} - Book on Meetbe`,
                },
                { name: "twitter:description", content: data.description },
                { name: "twitter:image", content: data.logo },
            ];

            metaTags.forEach((tag) => {
                let element;
                if (tag.name) {
                    element = document.querySelector(
                        `meta[name="${tag.name}"]`,
                    );
                    if (!element) {
                        element = document.createElement("meta");
                        element.setAttribute("name", tag.name);
                        document.head.appendChild(element);
                    }
                } else if (tag.property) {
                    element = document.querySelector(
                        `meta[property="${tag.property}"]`,
                    );
                    if (!element) {
                        element = document.createElement("meta");
                        element.setAttribute("property", tag.property);
                        document.head.appendChild(element);
                    }
                }
                element.setAttribute("content", tag.content);
            });

            return () => {
                document.title = "Meetbe - Smart Appointments";
            };
        }
    }, [data]);

    const slots: TimeSlot[] = useMemo(() => {
        if (!selectedEmployee || !selectedService) return [];

        const employee = data?.employees?.find(
            (e) => e.id === selectedEmployee.id,
        );
        if (!employee?.timeslots?.length) return [];

        const now = new Date();
        const futureSlots = employee.timeslots.filter(
            (slot) => new Date(slot.start_time) > now,
        );

        const selected = format(selectedDate, "yyyy-MM-dd");

        return futureSlots.filter(
            (slot) =>
                format(new Date(slot.start_time), "yyyy-MM-dd") === selected,
        );
    }, [selectedEmployee, selectedService, selectedDate, data]);

    const initiateBooking = (slot: TimeSlot) => {
        if (!user) {
            navigate.push("/login");
            return;
        }
        if (hasPending) return;
        setSlotToConfirm(slot);
    };

    const confirmBooking = async () => {
        if (
            !slotToConfirm ||
            !selectedEmployee ||
            !selectedService ||
            !data ||
            !user
        )
            return;

        const { error } = await createAppointment({
            slotId: slotToConfirm.id,
            businessId: data.id,
            employeeId: selectedEmployee.id,
            serviceId: selectedService.id,
        });

        if (error) {
            if (error === CLIENT_LIMIT_ERROR) {
                setCapacityReached(true);
                setSlotToConfirm(null);
                return;
            }
            addNotification("Booking Failed", error, "error");
            if (error.includes("pending")) setHasPending(true);
            setSlotToConfirm(null);
            return;
        }

        setBookingConfirmed(true);
        setHasPending(true);
        addNotification(
            "Booking Request Sent",
            `Your request for ${selectedService.name} is pending approval from ${data.name}.`,
            "booking",
        );
        setSlotToConfirm(null);
    };

    const resetSelection = () => {
        setBookingConfirmed(false);
        setSelectedEmployee(null);
        setSelectedService(null);
        setSlotToConfirm(null);
    };

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 text-lg">Business not found.</p>
            </div>
        );
    }

    const handleEmployeeSelect = (
        emp: Employee & { timeslots: TimeSlot[] },
    ) => {
        setSelectedEmployee(emp);
        setBookingConfirmed(false);

        const now = new Date();
        const firstAvailableSlot = emp.timeslots?.find(
            (slot) => !slot.is_booked && new Date(slot.start_time) > now,
        );
        if (firstAvailableSlot) {
            const d = new Date(firstAvailableSlot.start_time);
            setSelectedDate(
                new Date(d.getFullYear(), d.getMonth(), d.getDate()),
            );
        }
    };

    const handleServiceSelect = (service: Service) => {
        setSelectedService(service);
        setBookingConfirmed(false);
    };

    return (
        <div className="min-h-screen bg-[#fcfcfc]">
            <div className="bg-primary-600 h-64 w-full relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute -bottom-12 left-4 md:left-24 p-1.5 bg-white rounded-2xl shadow-xl">
                    <Image
                        src={data?.logo ?? "/avatar.png"}
                        alt={data?.name}
                        className="w-32 h-32 rounded-xl object-cover"
                        width={128}
                        height={128}
                    />
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 mt-20 pb-24 grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    <section>
                        <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-gray-900">
                            {data.name}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-gray-600 mb-8">
                            <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm text-sm">
                                <MapPin className="w-4 h-4 text-primary-500" />{" "}
                                {data.address}
                            </span>
                            <span className="flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg border border-primary-100 font-bold uppercase tracking-widest text-[10px]">
                                {data.category}
                            </span>
                            {user && (
                                <button
                                    onClick={toggleFavorite}
                                    disabled={favLoading}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all ${
                                        isFav
                                            ? "bg-primary-50 border-primary-200 text-primary-600"
                                            : "bg-white border-gray-100 text-gray-500 hover:border-primary-200 hover:text-primary-500"
                                    }`}
                                >
                                    <Heart
                                        className={`w-4 h-4 ${isFav ? "fill-current" : ""}`}
                                    />
                                    {isFav ? "Saved" : "Save"}
                                </button>
                            )}
                        </div>
                        <p className="text-lg text-gray-500 leading-relaxed max-w-2xl font-medium">
                            {data.description}
                        </p>
                    </section>

                    {/* Step 1: Employee Selection */}
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">
                                1. Choose a Professional
                            </h2>
                            <span className="text-xs text-gray-400 font-black uppercase tracking-widest">
                                {data?.employees?.length} Staff
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                            {data?.employees?.map((emp) => (
                                <button
                                    key={emp.id}
                                    onClick={() => handleEmployeeSelect(emp)}
                                    className={`p-6 rounded-xl border-2 transition-all text-center ${
                                        selectedEmployee?.id === emp.id
                                            ? "bg-primary-50/50 border-primary-600 ring-4 ring-primary-50 shadow-lg"
                                            : "bg-white border-gray-100 hover:border-primary-200 hover:shadow-md"
                                    }`}
                                >
                                    <Image
                                        src={emp.avatar ?? "/avatar.png"}
                                        alt={emp.name}
                                        className="w-20 h-20 rounded-xl mx-auto object-cover mb-4"
                                        width={80}
                                        height={80}
                                    />
                                    <h4 className="font-bold text-gray-900">
                                        {emp.name}
                                    </h4>
                                    <p className="text-xs text-primary-600 font-black uppercase tracking-widest mt-1">
                                        {emp.role}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Step 2: Service Selection */}
                    {selectedEmployee && (
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    2. Select a Therapy / Service
                                </h2>
                                <span className="text-xs text-gray-400 font-black uppercase tracking-widest">
                                    {data?.services?.length} Available
                                </span>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {data.services.map((service) => (
                                    <button
                                        key={service.id}
                                        onClick={() =>
                                            handleServiceSelect(service)
                                        }
                                        className={`flex items-start justify-between p-5 rounded-xl border-2 transition-all text-left ${
                                            selectedService?.id === service.id
                                                ? "bg-primary-50/50 border-primary-600 shadow-md"
                                                : "bg-white border-gray-100 hover:border-primary-200 hover:shadow-sm"
                                        }`}
                                    >
                                        <div>
                                            <h4 className="font-bold text-gray-900">
                                                {service.name}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1 font-medium">
                                                {service.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-3">
                                                <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    {service.duration} mins
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-lg font-black text-primary-600">
                                            {service.price}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <aside className="lg:col-span-1">
                    <Card className="sticky top-24 p-8 border-none ring-1 ring-gray-100">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                            <Clock className="w-5 h-5 text-primary-600" /> Book
                            Session
                        </h3>
                        {capacityReached ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-6 h-6 text-gray-400" />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2">
                                    Fully Booked Right Now
                                </h4>
                                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                                    {data?.name} isn&apos;t accepting new clients at the moment.
                                    We&apos;ve let them know you&apos;re interested — they&apos;ll reach out to you as soon as a spot opens up.
                                </p>
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left">
                                    <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">What happens next?</p>
                                    <p className="text-xs text-amber-800 leading-relaxed">
                                        The business has been notified via email. They&apos;ll contact you directly when they&apos;re ready to accept new bookings.
                                    </p>
                                </div>
                            </div>
                        ) : hasPending && !bookingConfirmed ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-6 h-6 text-amber-500" />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2">
                                    Request Pending
                                </h4>
                                <p className="text-sm text-gray-500">
                                    You already have a pending booking at this
                                    business. You can book at another business
                                    while you wait for confirmation.
                                </p>
                            </div>
                        ) : bookingConfirmed ? (
                            <div className="text-center py-10 animate-in zoom-in duration-300">
                                <CheckCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                                <h4 className="text-xl font-bold text-gray-900">
                                    Request Sent
                                </h4>
                                <p className="text-sm text-gray-500 mt-2">
                                    Waiting for approval.
                                </p>
                                <div className="bg-amber-50 rounded-lg p-4 mt-6 text-left border border-amber-100">
                                    <p className="text-xs text-amber-800 uppercase font-black tracking-widest mb-1">
                                        Status
                                    </p>
                                    <p className="font-bold text-amber-900 text-sm mb-3">
                                        Pending Confirmation
                                    </p>
                                    <p className="text-xs text-amber-800 uppercase font-black tracking-widest mb-1">
                                        Service
                                    </p>
                                    <p className="font-bold text-amber-900 text-sm">
                                        {selectedService?.name}
                                    </p>
                                </div>
                                <Button
                                    className="w-full mt-8"
                                    onClick={resetSelection}
                                >
                                    Book Another
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                                        3. Select Time
                                    </label>
                                    {!selectedEmployee ? (
                                        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-400 text-center italic">
                                            Select a professional first
                                        </div>
                                    ) : !selectedService ? (
                                        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-400 text-center italic">
                                            Select a therapy to see times
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 animate-in fade-in">
                                            {/* // Add this above the slots grid,
                                            inside the "3. Select Time" section */}
                                            <input
                                                type="date"
                                                value={format(
                                                    selectedDate,
                                                    "yyyy-MM-dd",
                                                )}
                                                min={format(
                                                    new Date(),
                                                    "yyyy-MM-dd",
                                                )}
                                                onChange={(e) => {
                                                    const [y, m, d] =
                                                        e.target.value
                                                            .split("-")
                                                            .map(Number);
                                                    setSelectedDate(
                                                        new Date(y, m - 1, d),
                                                    );
                                                }}
                                                className="w-full mb-4 p-2 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-primary-400"
                                            />
                                            {slots.length === 0 ? (
                                                <div className="col-span-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-400 text-center italic">
                                                    No available slots for this
                                                    date
                                                </div>
                                            ) : (
                                                slots.map((slot) => (
                                                    <button
                                                        key={slot.id}
                                                        disabled={
                                                            slot.is_booked ||
                                                            hasPending
                                                        }
                                                        onClick={() =>
                                                            initiateBooking(
                                                                slot,
                                                            )
                                                        }
                                                        className={`p-3 text-xs font-bold rounded-lg border transition-all text-center ${
                                                            slot.is_booked ||
                                                            hasPending
                                                                ? "bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed line-through"
                                                                : "bg-white border-gray-200 text-gray-700 hover:border-primary-600 hover:bg-primary-50 hover:text-primary-700"
                                                        }`}
                                                    >
                                                        {format(
                                                            new Date(
                                                                slot.start_time,
                                                            ),
                                                            "HH:mm",
                                                        )}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                {selectedService && (
                                    <div className="pt-6 border-t border-gray-100">
                                        <div className="flex justify-between items-center text-sm mb-2">
                                            <span className="text-gray-500 font-medium">
                                                Service Total
                                            </span>
                                            <span className="font-bold text-gray-900">
                                                {selectedService.price}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-medium">
                                                Duration
                                            </span>
                                            <span className="font-bold text-gray-900">
                                                {selectedService.duration} min
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </aside>
            </main>

            {/* Confirmation Popup Modal */}
            {slotToConfirm && (
                <BookingConfirmationModal
                    slotToConfirm={slotToConfirm}
                    selectedEmployee={selectedEmployee}
                    selectedService={selectedService}
                    onClose={() => setSlotToConfirm(null)}
                    onConfirm={confirmBooking}
                />
            )}
        </div>
    );
};

export default Business;
