import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DatabaseService {
  static supabaseClient: SupabaseClient;

  constructor(private readonly supabaseWithAuth: SupabaseClient) {
    DatabaseService.supabaseClient = supabaseWithAuth;
  }
}
