
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://knwoonmpsadzwbulfwkf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_o0fCIc9VnA6CAA4QE-vV1w_E3jAOmum';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Todo {
  id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}
