import { DatabaseService } from './database.service';

export const supabase = new DatabaseService().getSupabaseClient();
