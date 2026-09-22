import { supabase } from "./supabase";

export type AdminPermission = 'MANAGE_ROUTES' | 'MANAGE_TICKETS' | 'MANAGE_LOGS' | 'MANAGE_USERS' | 'MANAGE_ADMINS' | 'FULL_ACCESS';

export interface AdminProfile {
  uid: string;
  id?: string;
  email: string;
  name: string;
  phone: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE';
  permissions: AdminPermission[];
  createdAt: number;
}

export const loginAdmin = async (email: string, password: string) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Login failed");
    }

    const user = authData.user;
    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr || !profile) {
      await supabase.auth.signOut();
      throw new Error("User profile not found.");
    }

    if (profile.role !== 'ADMIN' && profile.role !== 'SUPER_ADMIN') {
      await supabase.auth.signOut();
      throw new Error("Access Denied: Only administrators can log in here.");
    }

    if (profile.status !== 'ACTIVE') {
      await supabase.auth.signOut();
      throw new Error(`Account status: ${String(profile.status)}. Please contact support.`);
    }

    const userData: AdminProfile = {
      uid: user.id,
      id: user.id,
      email: user.email || '',
      name: profile.name || 'Admin',
      phone: profile.phone || '',
      role: profile.role,
      status: profile.status,
      permissions: ['FULL_ACCESS'],
      createdAt: new Date(profile.created_at).getTime(),
    };

    return {
      success: true,
      user,
      userData,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const logoutAdmin = async () => {
  await supabase.auth.signOut();
};
