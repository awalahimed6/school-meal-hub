import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export type UserRole = "admin" | "staff" | "student";

export const signUp = async (email: string, password: string, fullName: string) => {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName,
      },
    },
  });
  
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    // 1. Try user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (!roleError && roleData?.role) {
      return roleData.role as UserRole;
    }

    // 2. Fallback: check staff table
    const { data: staffData } = await supabase
      .from("staff")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (staffData) return "staff";

    // 3. Fallback: check students table
    const { data: studentData } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (studentData) return "student";

    // 4. Fallback: check auth user metadata
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.user_metadata?.role) {
      return authData.user.user_metadata.role as UserRole;
    }
  } catch (err) {
    console.error("Error fetching user role:", err);
  }

  return null;
};

export const checkUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", role)
      .maybeSingle();
    
    if (data) return true;

    const currentRole = await getUserRole(userId);
    return currentRole === role;
  } catch {
    return false;
  }
};
