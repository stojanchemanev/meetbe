"use client";
import React from "react";
import Link from "next/link";
import { Calendar, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types";
import { NotificationBell } from "../shared/NotificationBell";

export const Navbar = () => {
    const { user, logout } = useAuth();
    return (
        <nav className="border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link
                    href="/"
                    className="flex items-center gap-2 font-bold text-2xl text-red-600"
                >
                    <Calendar className="w-8 h-8" />
                    <span className="tracking-tight">Meetbe</span>
                </Link>
                <div className="flex items-center gap-2 md:gap-4">
                    <Link
                        href="/pricing"
                        className="text-sm font-semibold text-gray-600 hover:text-red-600 hidden sm:inline"
                    >
                        Pricing
                    </Link>
                    <Link
                        href="/browse"
                        className="text-sm font-semibold text-gray-600 hover:text-red-600"
                    >
                        Browse
                    </Link>
                    {user ? (
                        <>
                            <NotificationBell />
                            <Link
                                href={
                                    user.role === UserRole.BUSINESS
                                        ? "/dashboard/business"
                                        : "/dashboard/client"
                                }
                                className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
                            >
                                Dashboard
                            </Link>
                            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-full border border-gray-200">
                                <div className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md shadow-red-200">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <button
                                    onClick={logout}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-red-600"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};
