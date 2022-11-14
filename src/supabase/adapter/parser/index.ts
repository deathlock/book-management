import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseDBObj } from '../typing/Parser';
import { pgParser } from './pg';

export function parse(connection: SupabaseClient, dbObj: SupabaseDBObj) {
  return pgParser.parse(connection, dbObj);
}
