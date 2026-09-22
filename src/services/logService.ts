import { supabase } from "./supabase";
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

export const logActivity = async (options: LogOptions) => {
  const admin = useAdminStore.getState().admin;
  
  try {
    await supabase.from('activity_logs').insert({
      user_id: admin?.uid || admin?.id || null,
      user_name: admin?.name || admin?.userName || admin?.email || 'Admin',
      user_email: admin?.email || 'admin@onedelhi.gov.in',
      action: options.action,
      details: options.details,
      type: options.type === 'SYSTEM' ? 'USER' : options.type,
      target_id: options.targetId || null,
      target_type: options.targetType || null,
      notes: options.notes || null,
    });
  } catch (error) {
    if (__DEV__) console.error('Logging failed:', error);
  }
};
