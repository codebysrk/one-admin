import { supabase } from './supabase';

export interface ResetResult {
  ticketsDeleted: number;
  devicesDeleted: number;
  logsDeleted: number;
  notificationsDeleted: number;
  deletedUsersPurged: number;
  usersDeleted: number;
  adminEmail: string;
}

export const resetDatabaseExceptRoutes = async (
  permanentEmail = 'maishahrukhh@gmail.com'
): Promise<ResetResult> => {
  const normEmail = permanentEmail.trim().toLowerCase();

  try {
    // 1. Tickets
    const { count: ticketsCount } = await supabase
      .from('tickets')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Devices
    const { count: devicesCount } = await supabase
      .from('devices')
      .delete({ count: 'exact' })
      .neq('id', '__dummy__');

    // 3. Activity Logs
    const { count: logsCount } = await supabase
      .from('activity_logs')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    // 4. Notifications (if table exists)
    let notificationsCount = 0;
    try {
      const { count } = await supabase
        .from('notifications')
        .delete({ count: 'exact' })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      notificationsCount = count || 0;
    } catch (_) {}

    // 5. Delete non-admin users
    const { count: usersCount } = await supabase
      .from('users')
      .delete({ count: 'exact' })
      .neq('email', normEmail);

    return {
      ticketsDeleted: ticketsCount || 0,
      devicesDeleted: devicesCount || 0,
      logsDeleted: logsCount || 0,
      notificationsDeleted: notificationsCount || 0,
      deletedUsersPurged: 0,
      usersDeleted: usersCount || 0,
      adminEmail: normEmail,
    };
  } catch (error) {
    console.warn('[ResetService] Failed to reset database:', error);
    throw error;
  }
};
