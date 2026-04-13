"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Appointment } from "../types";

interface BookingContextType {
    appointments: Appointment[];
    addAppointment: (appointment: Appointment) => void;
    updateStatus: (id: string, status: "CONFIRMED" | "CANCELLED") => void;
    getBusinessAppointments: (businessId: string) => Appointment[];
    getClientAppointments: (clientId: string) => Appointment[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBookings = () => {
    const context = useContext(BookingContext);
    if (!context)
        throw new Error("useBookings must be used within BookingProvider");
    return context;
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("meetbe_appointments");
        if (saved) {
            setAppointments(JSON.parse(saved));
        }
    }, []);

    const save = (apps: Appointment[]) => {
        setAppointments(apps);
        localStorage.setItem("meetbe_appointments", JSON.stringify(apps));
    };

    const addAppointment = (appt: Appointment) => {
        const newApps = [appt, ...appointments];
        save(newApps);
    };

    const updateStatus = (id: string, status: "CONFIRMED" | "CANCELLED") => {
        const newApps = appointments.map((a) =>
            a.id === id ? { ...a, status } : a
        );
        save(newApps);
    };

    const getBusinessAppointments = (businessId: string) => {
        return appointments.filter((a) => a.businessId === businessId);
    };

    const getClientAppointments = (clientId: string) => {
        return appointments.filter((a) => a.clientId === clientId);
    };

    return (
        <BookingContext.Provider
            value={{
                appointments,
                addAppointment,
                updateStatus,
                getBusinessAppointments,
                getClientAppointments,
            }}
        >
            {children}
        </BookingContext.Provider>
    );
};
