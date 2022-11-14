import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DatabaseService {
  private supabaseClient;

  constructor() {
    const supabaseUrl = 'https://ednkybslusemsqkvkryr.supabase.co'; //process.env.SUPABASE_URL;
    const supabaseKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbmt5YnNsdXNlbXNxa3ZrcnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjcyMTA3NTUsImV4cCI6MTk4Mjc4Njc1NX0.DX72LvOfBP5oDcIAu6ZvYgO61z22nV3F-nr1ivJ5I88'; //process.env.SUPABASE_KEY;

    this.supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  getSupabaseClient(): SupabaseClient {
    return this.supabaseClient;
  }
}
