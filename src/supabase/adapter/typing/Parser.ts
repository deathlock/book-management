import { DatabaseInfo } from '../info/DatabaseInfo';
import { SupabaseClient } from '@supabase/supabase-js';

export interface Parser {
  parse: (
    connection: SupabaseClient,
    dbObj: SupabaseDBObj,
  ) => Promise<DatabaseInfo>;
}

export type SupabaseDBObj = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};
