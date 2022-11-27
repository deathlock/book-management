import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { StorageClient } from '@supabase/storage-js';

@Injectable()
export class DatabaseService {
  static supabaseClient: SupabaseClient;
  static storageClient;

  constructor(private readonly supabaseWithAuth: SupabaseClient) {
    DatabaseService.supabaseClient = supabaseWithAuth;
    DatabaseService.storageClient = new StorageClient(process.env.STORAGE_URL, {
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
    });
  }
}
