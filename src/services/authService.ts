import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type AdminPermission = 'MANAGE_ROUTES' | 'MANAGE_TICKETS' | 'MANAGE_LOGS' | 'MANAGE_USERS' | 'MANAGE_ADMINS' | 'FULL_ACCESS';

export interface AdminProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin';
  status: 'ACTIVE';
  permissions: AdminPermission[];
  createdAt: number;
}

export const loginAdmin = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error("User profile not found.");
    }

    const profile = userDoc.data() as Record<string, unknown>;
    const userData = { uid: user.uid, ...profile };
    
    if (profile.role !== 'admin') {
      await signOut(auth);
      throw new Error("Access Denied: Only administrators can log in here.");
    }

    if (profile.status !== 'ACTIVE') {
      await signOut(auth);
      throw new Error(`Account status: ${String(profile.status)}. Please contact support.`);
    }

    return {
      success: true,
      user,
      userData: userData as AdminProfile
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

export const logoutAdmin = async () => {
  await signOut(auth);
};
