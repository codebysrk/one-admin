import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabase } from "./supabase";
import { logActivity } from "./logService";

export interface CreateUserData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export const createClientUser = async (data: CreateUserData) => {
  const { fullName, email, phone, password } = data;

  const ephemeralClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: authData, error: authError } = await ephemeralClient.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        name: fullName.trim(),
        phone: phone.trim(),
        role: "USER",
      },
    },
  });

  if (authError) {
    throw new Error(authError.message || "User creation failed");
  }

  if (!authData.user) {
    throw new Error("User creation failed. No user returned.");
  }

  if (authData.user.identities && authData.user.identities.length === 0) {
    throw new Error("This email address is already registered.");
  }

  const newUser = authData.user;

  try {
    await supabase.from("users").upsert({
      id: newUser.id,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      gender: "NOT_SPECIFIED",
      role: "USER",
      status: "ACTIVE",
    });
  } catch (upsertErr) {
    console.warn("[userCreationService] Direct upsert warning:", upsertErr);
  }

  try {
    await logActivity({
      type: "ADMIN",
      action: "USER_CREATED",
      details: `Created new client user: ${fullName.trim()} (${email.trim()})`,
      targetId: newUser.id,
      targetType: "USER",
    });
  } catch (_) {}

  return {
    success: true,
    uid: newUser.id,
    id: newUser.id,
    name: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    password: password,
  };
};
