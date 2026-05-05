import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jfoxsolxjefnqvwysdhd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb3hzb2x4amVmbnF2d3lzZGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTY0MDUsImV4cCI6MjA4ODg5MjQwNX0.ZYbRPOmftlaeNZlUHLJMbjkUcDurzekdb4CSmc21syU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getUserId(): string | null {
  return localStorage.getItem('light_user_id');
}

export function setUserId(id: string) {
  localStorage.setItem('light_user_id', id);
}
