import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://tiuzvutjuazntxmisozk.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpdXp2dXRqdWF6bnR4bWlzb3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwOTE5OTYsImV4cCI6MjEwNTY2Nzk5Nn0.ltFzapKVbtRsjmkIZG1kcymtwacBsHYzXJROF-3DSBk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
