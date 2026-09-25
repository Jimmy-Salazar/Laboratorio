import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AdminAuthContext = createContext(null);

function normalizeIdentification(value) {
  return String(value ?? "").replace(/\D/g, "");
}

async function loadStaffProfile(userId) {
  const { data, error } = await supabase
    .from("staff_profiles")
    .select(
      "user_id, full_name, role, active, identification_number",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (nextSession) => {
    if (!nextSession?.user?.id) {
      setProfile(null);
      return null;
    }

    const nextProfile = await loadStaffProfile(
      nextSession.user.id,
    );

    if (!nextProfile?.active) {
      await supabase.auth.signOut();
      setProfile(null);
      return null;
    }

    if (
      nextProfile.role !== "master" &&
      nextProfile.role !== "admin"
    ) {
      await supabase.auth.signOut();
      setProfile(null);
      return null;
    }

    setProfile(nextProfile);
    return nextProfile;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        setSession(currentSession);

        if (currentSession) {
          await refreshProfile(currentSession);
        }
      } catch (error) {
        console.error("Admin auth boot failed:", error);

        if (mounted) {
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!mounted) {
          return;
        }

        setSession(nextSession);

        if (!nextSession) {
          setProfile(null);
          setLoading(false);
          return;
        }

        try {
          await refreshProfile(nextSession);
        } catch (error) {
          console.error(
            "Could not refresh admin profile:",
            error,
          );

          setProfile(null);
        } finally {
          setLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const login = useCallback(
    async (identification, password) => {
      const cleanIdentification =
        normalizeIdentification(identification);

      if (!/^\d{8,15}$/.test(cleanIdentification)) {
        return {
          ok: false,
          message:
            "Ingresa un numero de identificacion valido.",
        };
      }

      const email =
        `${cleanIdentification}@admin.drchasi.local`;

      const {
        data,
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        return {
          ok: false,
          message: "Credenciales no validas.",
        };
      }

      try {
        const nextProfile = await loadStaffProfile(
          data.session.user.id,
        );

        if (
          !nextProfile?.active ||
          !["master", "admin"].includes(nextProfile.role)
        ) {
          await supabase.auth.signOut();

          return {
            ok: false,
            message: "Credenciales no validas.",
          };
        }

        setSession(data.session);
        setProfile(nextProfile);

        return {
          ok: true,
          profile: nextProfile,
        };
      } catch (profileError) {
        console.error(
          "Could not load staff profile:",
          profileError,
        );

        await supabase.auth.signOut();

        return {
          ok: false,
          message:
            "No fue posible validar el acceso administrativo.",
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      login,
      logout,
      refreshProfile,
    }),
    [
      session,
      profile,
      loading,
      login,
      logout,
      refreshProfile,
    ],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error(
      "useAdminAuth must be used inside AdminAuthProvider.",
    );
  }

  return context;
}