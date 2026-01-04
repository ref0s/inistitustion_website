import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AdminCredentials = { username: string; password: string };

type AdminAuthContextValue = {
  credentials: AdminCredentials | null;
  authHeader: string | null;
  setCredentials: (creds: AdminCredentials | null) => void;
  logout: () => void;
};

const STORAGE_KEY = "adminCredentials";

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

const getStoredCredentials = (): AdminCredentials | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminCredentials) : null;
  } catch {
    return null;
  }
};

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [credentials, setCredentialsState] = useState<AdminCredentials | null>(() =>
    getStoredCredentials()
  );

  const authHeader = useMemo(() => {
    if (!credentials) return null;
    const token = btoa(`${credentials.username}:${credentials.password}`);
    return `Basic ${token}`;
  }, [credentials]);

  const setCredentials = (creds: AdminCredentials | null) => setCredentialsState(creds);
  const logout = () => setCredentialsState(null);

  useEffect(() => {
    if (credentials) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [credentials]);

  const value = useMemo(
    () => ({
      credentials,
      authHeader,
      setCredentials,
      logout,
    }),
    [credentials, authHeader]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
};
