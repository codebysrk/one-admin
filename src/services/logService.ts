import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useAdminStore } from "../store/useAdminStore";

export type LogType = 'ADMIN' | 'USER' | 'SYSTEM';

interface LogOptions {
  type: LogType;
  action: string;
  details: string;
  targetId?: string;
  targetType?: 'USER' | 'ROUTE' | 'TICKET' | 'NOTIFICATION';
  oldValue?: any;
  newValue?: any;
  notes?: string;
}

export const logActivity = async (options: LogOptions) => {
  const admin = useAdminStore.getState().admin;
  
  try {
    await addDoc(collection(db, 'logs'), {
      ...options,
      userName: admin?.name || admin?.userName || admin?.email || 'System',
      userEmail: admin?.email || 'system@onedelhi.gov.in',
      timestamp: serverTimestamp(),
      deviceId: 'Admin Dashboard',
    });
  } catch (error) {
    console.error('Logging failed:', error);
  }
};
