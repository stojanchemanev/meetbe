"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import { User, UserRole, EmployeeLink } from "../types";
import { signUp } from "@/app/actions/auth";
import { createClient } from "@/utils/supabase/client";

interface AuthContextType {
    user: User | null;
    employeeLinks: EmployeeLink[];
    login: (
        email: string,
        password: string,
    ) => Promise<{ success: boolean; error?: string }>;
    register: (
        name: string,
        email: string,
        password: string,
        role: UserRole,
    ) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [employeeLinks, setEmployeeLinks] = useState<EmployeeLink[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchProfile = async (authId: string): Promise<User | null> => {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", authId)
                .maybeSingle();

            if (error) return null;
            return (data as User) ?? null;
        };

        const fetchEmployeeLinks = async (
            authId: string,
        ): Promise<EmployeeLink[]> => {
            const { data, error } = await supabase
                .from("employees")
                .select("id, business_id, businesses(name)")
                .eq("user_id", authId);

            if (error || !data) return [];
            return data.map(
                (row: {
                    id: string;
                    business_id: string;
                    businesses: { name: string }[] | null;
                }) => ({
                    id: row.id,
                    business_id: row.business_id,
                    business_name: Array.isArray(row.businesses)
                        ? (row.businesses[0]?.name ?? "")
                        : "",
                }),
            );
        };

        // onAuthStateChange fires after session is rehydrated from cookies —
        // this is the only reliable place to read auth state on the client.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const [profile, links] = await Promise.all([
                    fetchProfile(session.user.id),
                    fetchEmployeeLinks(session.user.id),
                ]);
                setUser(profile);
                setEmployeeLinks(links);
            } else {
                setUser(null);
                setEmployeeLinks([]);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) return { success: false, error: error.message };
        // onAuthStateChange will fire and set the user automatically
        return { success: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        // onAuthStateChange will fire and clear the user automatically
    };

    const register = async (
        name: string,
        email: string,
        password: string,
        role: UserRole,
    ) => {
        const result = await signUp(email, password, name, role);
        if (result.error) return { success: false, error: result.error };

        // signUp finished — profile row is committed, now safe to fetch
        if (result.profile) {
            setUser(result.profile as User);
        }
        return { success: true };
    };

    return (
        <AuthContext.Provider
            value={{ user, employeeLinks, login, register, logout, loading }}
        >
            {children}
        </AuthContext.Provider>
    );
};
