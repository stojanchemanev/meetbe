"use client";
import React, {
    useState,
    useEffect,
    useMemo,
    createContext,
    useContext,
} from "react";
import { User, UserRole, EmployeeLink } from "../types";
import { signUp } from "@/app/actions/auth";
import { createClient } from "@/utils/supabase/client";

interface AuthContextType {
    user: User | null;
    employeeLinks: EmployeeLink[];
    isAuthenticated: boolean | null; // null = checking, true/false = known
    login: (
        email: string,
        password: string,
    ) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
    register: (
        name: string,
        email: string,
        password: string,
        role: UserRole,
    ) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    loading: boolean; // true while auth state is unknown
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
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
        null,
    );
    const supabase = useMemo(() => createClient(), []);

    const loading = isAuthenticated === null;

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
                setIsAuthenticated(true); // loading becomes false immediately
                const [profile, links] = await Promise.all([
                    fetchProfile(session.user.id),
                    fetchEmployeeLinks(session.user.id),
                ]);
                setUser(profile);
                setEmployeeLinks(links);
            } else {
                setIsAuthenticated(false);
                setUser(null);
                setEmployeeLinks([]);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) return { success: false, error: error.message };
        // Fetch role so the caller can redirect to the correct dashboard immediately.
        // onAuthStateChange fires concurrently and sets full user state.
        const { data: profile } = await supabase
            .from("users")
            .select("role")
            .eq("id", data.user.id)
            .maybeSingle();
        return { success: true, role: profile?.role as UserRole | undefined };
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

        // If email confirmation is required, no session is created and
        // onAuthStateChange won't fire — explicitly end the loading state.
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            setIsAuthenticated(false);
        }
        return { success: true };
    };

    const refreshUser = async () => {
        const {
            data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) return;
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle();
        if (!error && data) setUser(data as User);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                employeeLinks,
                isAuthenticated,
                login,
                register,
                logout,
                refreshUser,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
