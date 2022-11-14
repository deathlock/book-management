import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseInfo } from '../info/DatabaseInfo';
import { parse } from '../parser';
import { SupabaseDBObj } from '../typing/Parser';
import { Database } from './Database';
import { Resource } from './Resource';

export class Adapter {
  public static Database: any = Database;

  public static Resource: any = Resource;

  public static async init(
    connection: SupabaseClient,
    dbObj: SupabaseDBObj,
  ): Promise<DatabaseInfo> {
    return parse(connection, dbObj);
  }
}
