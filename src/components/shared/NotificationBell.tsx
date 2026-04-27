import React, { useState } from "react";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { useNotifications } from "../../context/NotificationContext";

export const NotificationBell = () => {
    const { unreadCount, notifications, markAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[60]"
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">
                                Notifications
                            </h3>
                            <span className="text-[10px] font-black uppercase text-secondary-600 bg-secondary-50 px-2 py-0.5 rounded-full">
                                {unreadCount} New
                            </span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <button
                                        key={notif.id}
                                        onClick={() => {
                                            markAsRead(notif.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                                            !notif.read ? "bg-secondary-50/30" : ""
                                        }`}
                                    >
                                        <div className="flex gap-3">
                                            <div
                                                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                                    !notif.read
                                                        ? "bg-secondary-600"
                                                        : "bg-transparent"
                                                }`}
                                            ></div>
                                            <div>
                                                <p
                                                    className={`text-sm ${
                                                        !notif.read
                                                            ? "font-bold text-gray-900"
                                                            : "text-gray-600"
                                                    }`}
                                                >
                                                    {notif.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-2 uppercase font-black">
                                                    {format(
                                                        new Date(notif.time),
                                                        "p"
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
