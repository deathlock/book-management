import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { StorageClient } from '@supabase/storage-js';

@Injectable()
export class DatabaseService {
  static supabaseClient: Record<string, SupabaseClient> = {};
  static userTokenMapping: Record<string, string> = {};

  static storageClient;

  constructor(
    private readonly supabaseWithAuth: SupabaseClient<any, any, any>,
    private readonly schemaName: string,
  ) {
    DatabaseService.supabaseClient[schemaName] = supabaseWithAuth;

    DatabaseService.storageClient = new StorageClient(process.env.STORAGE_URL, {
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
    });
  }
}
