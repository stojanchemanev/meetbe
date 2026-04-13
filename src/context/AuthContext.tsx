"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import { User, UserRole } from "../types";
import { signUp, signIn, signOut, getCurrentUser } from "@/app/actions/auth";

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

    useEffect(() => {
        const checkUser = async () => {
            const { user: currentUser } = await getCurrentUser();
            setUser(currentUser as User | null);
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = async (email: string, password: string, role: UserRole) => {
        const result = await signIn(email, password);
        if (result.error) {
            return { success: false, error: result.error };
        }
        // Fetch the updated user profile
        const { user: currentUser } = await getCurrentUser();
        setUser(currentUser as User | null);
        return { success: true };
    };

    const register = async (
        name: string,
        email: string,
        password: string,
        role: UserRole,
    ) => {
        const result = await signUp(email, password, name, role);
        if (result.error) {
            return { success: false, error: result.error };
        }
        // Fetch the updated user profile
        const { user: currentUser } = await getCurrentUser();
        setUser(currentUser as User | null);
        return { success: true };
    };

    const logout = async () => {
        await signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, login, register, logout, loading }}
        >
            {children}
        </AuthContext.Provider>
    );
};
