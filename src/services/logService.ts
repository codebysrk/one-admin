import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useAdminStore } from "../store/useAdminStore";

export type LogType = 'ADMIN' | 'USER' | 'SYSTEM';

interface LogOptions {
  type: LogType;
  action: string;
  details: string;
  targetId?: string;
  targetType?: 'USER' | 'ROUTE' | 'TICKET' | 'NOTIFICATION' | 'ADMIN';
  oldValue?: any;
  newValue?: any;
  notes?: string;
}

import * as Device from 'expo-device';
import Constants from 'expo-constants';

export const logActivity = async (options: LogOptions) => {
  const admin = useAdminStore.getState().admin;
  
  try {
    const deviceMeta = {
      model: Device.modelName,
      os: Device.osName,
      osVersion: Device.osVersion,
      appVersion: Constants.expoConfig?.version || '1.0.0',
      isRooted: !Device.isDevice,
    };

    await addDoc(collection(db, 'logs'), {
      ...options,
      userName: admin?.name || admin?.userName || admin?.email || 'System',
      userEmail: admin?.email || 'system@onedelhi.gov.in',
      timestamp: serverTimestamp(),
      deviceId: 'Admin Dashboard',
      deviceMeta,
    });
  } catch (error) {
    if (__DEV__) console.error('Logging failed:', error);
  }
};
