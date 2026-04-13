"use client";
import React, { useEffect, useMemo, useState } from "react";
import { BusinessPayload } from "@/app/business/[id]/page";
import { useAuth } from "@/src/context/AuthContext";
import { useBookings } from "@/src/context/BookingContext";
import { useNotifications } from "@/src/context/NotificationContext";
import {
    Business as BusinessType,
    Employee,
    Service,
    TimeSlot,
    Appointment,
} from "@/src/types";
import { addHours } from "date-fns/fp/addHours";

import { id } from "date-fns/locale/id";
import {
    CalendarIcon,
    CheckCircle,
    Clock,
    MapPin,
    Star,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Card } from "../ui";
import { format } from "date-fns";
import Image from "next/image";

const Business = (data: BusinessPayload | null) => {
    const navigate = useRouter();

    const { addNotification } = useNotifications();
    const { addAppointment } = useBookings();
    const { user } = useAuth();

    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
        null,
    );
    const [selectedService, setSelectedService] = useState<Service | null>(
        null,
    );
    const [selectedDate, setSelectedDate] = useState(new Date());

    // State for the confirmation modal
    const [slotToConfirm, setSlotToConfirm] = useState<TimeSlot | null>(null);
    const [bookingConfirmed, setBookingConfirmed] = useState(false);

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

    const slots = useMemo(() => {
        const s: TimeSlot[] = [];
        if (!selectedEmployee || !selectedService || !data) return [];

        for (let i = 0; i < 6; i++) {
            const dayStart = new Date(selectedDate);
            dayStart.setHours(0, 0, 0, 0);
            const simpleStart = addHours(9 + i)(dayStart);

            s.push({
                id: `slot-${i}`,
                employeeId: selectedEmployee.id,
                businessId: data.id!,
                startTime: simpleStart.toISOString(),
                endTime: addHours(1)(simpleStart).toISOString(),
                isBooked: i % 3 === 0,
            });
        }
        return s;
    }, [selectedEmployee, selectedService, selectedDate, data]);

    const initiateBooking = (slot: TimeSlot) => {
        if (!user) {
            // If user is not logged in, redirect to login with return path
            navigate.push("/login");
            return;
        }
        setSlotToConfirm(slot);
    };

    const confirmBooking = () => {
        if (
            slotToConfirm &&
            selectedEmployee &&
            selectedService &&
            data &&
            user
        ) {
            const newAppointment: Appointment = {
                id: Math.random().toString(36).substr(2, 9),
                slotId: slotToConfirm.id,
                clientId: user.id,
                clientName: user.name as string,
                businessId: data.id as string,
                businessName: data.name,
                employeeId: selectedEmployee.id,
                employeeName: selectedEmployee.name,
                serviceName: selectedService.name,
                startTime: slotToConfirm.startTime,
                duration: selectedService.duration,
                price: selectedService.price,
                status: "PENDING",
                createdAt: new Date().toISOString(),
            };

            addAppointment(newAppointment);
            setBookingConfirmed(true);

            addNotification(
                "Booking Request Sent",
                `Your request for ${selectedService.name} is pending approval from ${business.name}.`,
                "booking",
            );
            setSlotToConfirm(null);
        }
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

    return (
        <div className="min-h-screen bg-[#fcfcfc]">
            <div className="bg-red-600 h-64 w-full relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute -bottom-12 left-4 md:left-24 p-1.5 bg-white rounded-2xl shadow-xl">
                    <Image
                        src={data?.logo}
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
                                <MapPin className="w-4 h-4 text-red-500" />{" "}
                                {data.address}
                            </span>
                            <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm text-sm font-bold text-gray-800">
                                <Star className="w-4 h-4 fill-current text-amber-500" />{" "}
                                {data.rating} Rating
                            </span>
                            <span className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-100 font-bold uppercase tracking-widest text-[10px]">
                                {data.category}
                            </span>
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
                                    onClick={() => {
                                        setSelectedEmployee(emp);
                                        setBookingConfirmed(false);
                                    }}
                                    className={`p-6 rounded-xl border-2 transition-all text-center ${
                                        selectedEmployee?.id === emp.id
                                            ? "bg-red-50/50 border-red-600 ring-4 ring-red-50 shadow-lg"
                                            : "bg-white border-gray-100 hover:border-red-200 hover:shadow-md"
                                    }`}
                                >
                                    <Image
                                        src={emp.avatar}
                                        alt={emp.name}
                                        className="w-20 h-20 rounded-xl mx-auto object-cover mb-4"
                                        width={80}
                                        height={80}
                                    />
                                    <h4 className="font-bold text-gray-900">
                                        {emp.name}
                                    </h4>
                                    <p className="text-xs text-red-600 font-black uppercase tracking-widest mt-1">
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
                                        onClick={() => {
                                            setSelectedService(service);
                                            setBookingConfirmed(false);
                                        }}
                                        className={`flex items-start justify-between p-5 rounded-xl border-2 transition-all text-left ${
                                            selectedService?.id === service.id
                                                ? "bg-red-50/50 border-red-600 shadow-md"
                                                : "bg-white border-gray-100 hover:border-red-200 hover:shadow-sm"
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
                                        <span className="text-lg font-black text-red-600">
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
                            <Clock className="w-5 h-5 text-red-600" /> Book
                            Session
                        </h3>
                        {bookingConfirmed ? (
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
                                            {slots.map((slot) => {
                                                console.log("slot", slot);

                                                return (
                                                    <button
                                                        key={slot.id}
                                                        disabled={slot.isBooked}
                                                        onClick={() =>
                                                            initiateBooking(
                                                                slot,
                                                            )
                                                        }
                                                        className={`p-3 text-xs font-bold rounded-lg border transition-all text-center ${
                                                            slot.isBooked
                                                                ? "bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed line-through"
                                                                : "bg-white border-gray-200 text-gray-700 hover:border-red-600 hover:bg-red-50 hover:text-red-700"
                                                        }`}
                                                    >
                                                        {format(
                                                            new Date(
                                                                slot.startTime,
                                                            ),
                                                            "HH:mm",
                                                        )}
                                                    </button>
                                                );
                                            })}
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
            {slotToConfirm && selectedEmployee && selectedService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-xl font-black text-gray-900">
                                    Confirm Booking
                                </h3>
                                <button
                                    onClick={() => setSlotToConfirm(null)}
                                    className="text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-start gap-4 p-3 bg-red-50 rounded-xl">
                                    <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0 text-red-600">
                                        <CalendarIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-red-500 uppercase tracking-wider mb-1">
                                            When
                                        </p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {format(
                                                slotToConfirm.startTime,
                                                "EEEE, MMM do",
                                            )}
                                        </p>
                                        <p className="text-sm font-medium text-gray-600">
                                            {format(
                                                slotToConfirm.startTime,
                                                "h:mm a",
                                            )}{" "}
                                            -{" "}
                                            {format(
                                                slotToConfirm.endTime,
                                                "h:mm a",
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Image
                                            src={selectedEmployee.avatar}
                                            alt={selectedEmployee.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                            width={32}
                                            height={32}
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">
                                                {selectedEmployee.name}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                {selectedEmployee.role}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">
                                            {selectedService.name}
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                            {selectedService.duration} mins
                                        </p>
                                    </div>
                                    <span className="font-black text-gray-900">
                                        {selectedService.price}
                                    </span>
                                </div>

                                <div className="flex gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs font-medium">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    This appointment will be pending until
                                    confirmed by the business.
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setSlotToConfirm(null)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={confirmBooking}>
                                    Request
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Business;
