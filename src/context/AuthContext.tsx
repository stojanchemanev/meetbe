"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import { User, UserRole } from "../types";
import { signUp, signIn, signOut } from "@/app/actions/auth";
import { createClient } from "@/utils/supabase/client";

interface AuthContextType {
    user: User | null;
    login: (
        email: string,
        password: string,
        role: UserRole,
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
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchProfile = async (authId: string): Promise<User | null> => {
        // Get the auth user's email first
        const {
            data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser?.email) return null;

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", authUser.email)
            .single();

        if (error?.code === "PGRST116") return null;
        return (data as User) ?? null;
    };

    useEffect(() => {
        // onAuthStateChange fires after session is rehydrated from cookies —
        // this is the only reliable place to read auth state on the client.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const profile = await fetchProfile(session.user.id);
                setUser(profile);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string, _role: UserRole) => {
        const result = await signIn(email, password);
        if (result.error) return { success: false, error: result.error };
        // onAuthStateChange will fire and set the user automatically
        return { success: true };
    };

    const logout = async () => {
        await signOut();
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
            value={{ user, login, register, logout, loading }}
        >
            {children}
        </AuthContext.Provider>
    );
};
