import { User, UserRole } from "../types";

export const isClient = (user: User | null): boolean =>
    user?.role === UserRole.CLIENT;

export const isBusiness = (user: User | null): boolean =>
    user?.role === UserRole.BUSINESS;

export const isAdmin = (user: User | null): boolean =>
    user?.role === UserRole.ADMIN;
