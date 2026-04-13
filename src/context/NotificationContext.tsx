"use client";
import React, { useState, createContext, useContext } from "react";

export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: "booking" | "system" | "billing";
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    addNotification: (
        title: string,
        message: string,
        type: Notification["type"]
    ) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
    undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: "1",
            title: "Welcome to Bookly",
            message: "Start by configuring your business profile in settings.",
            time: new Date().toISOString(),
            read: false,
            type: "system",
        },
    ]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const addNotification = (
        title: string,
        message: string,
        type: Notification["type"]
    ) => {
        const newNotif: Notification = {
            id: Math.random().toString(36).substr(2, 9),
            title,
            message,
            time: new Date().toISOString(),
            read: false,
            type,
        };
        setNotifications((prev) => [newNotif, ...prev]);

        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body: message });
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                markAsRead,
                markAllAsRead,
                addNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context)
        throw new Error(
            "useNotifications must be used within NotificationProvider"
        );
    return context;
};
