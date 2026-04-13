"use client";

import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types";
import { useRouter, usePathname, redirect } from "next/navigation";

const ProtectedRoute: React.FC<{
    children: React.ReactNode;
    role?: UserRole;
}> = ({ children, role }) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;
        if (!user) {
            const from = pathname || "/";
            router.replace(`/login?from=${encodeURIComponent(from)}`);
            return;
        }
        if (role && user.role !== role) {
            const target =
                user.role === UserRole.BUSINESS ? "/dashboard" : "/browse";
            redirect(target);
        }
    }, [loading, user, role, router, pathname]);

    if (loading) return null;
    if (!user) return null;
    if (role && user.role !== role) return null;

    return <>{children}</>;
};

export default ProtectedRoute;
