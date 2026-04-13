import { useAuth } from "@/src/context/AuthContext";
import { UserRole } from "@/src/types";

export const useCurrentUser = () => {
  const { user } = useAuth();
  return user;
};

export const useIsClient = () => {
  const user = useCurrentUser();
  return user?.role === UserRole.CLIENT;
};

export const useIsBusiness = () => {
  const user = useCurrentUser();
  return user?.role === UserRole.BUSINESS;
};

export const useIsAdmin = () => {
  const user = useCurrentUser();
  return user?.role === UserRole.ADMIN;
};

export const useRequireAuth = (requiredRole?: UserRole) => {
  const { user, loading } = useAuth();

  if (loading) {
    return { authenticated: false, loading: true };
  }

  if (!user) {
    return { authenticated: false, loading: false };
  }

  if (requiredRole && user.role !== requiredRole) {
    return { authenticated: false, loading: false };
  }

  return { authenticated: true, loading: false, user };
};
