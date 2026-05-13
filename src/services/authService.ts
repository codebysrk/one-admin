import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface AdminProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin';
  status: 'ACTIVE';
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

    const userData = userDoc.data();
    
    if (userData.role !== 'admin') {
      await signOut(auth);
      throw new Error("Access Denied: Only administrators can log in here.");
    }

    if (userData.status !== 'ACTIVE') {
      await signOut(auth);
      throw new Error(`Account status: ${userData.status}. Please contact support.`);
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
