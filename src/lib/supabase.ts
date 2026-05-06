import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jfoxsolxjefnqvwysdhd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb3hzb2x4amVmbnF2d3lzZGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTY0MDUsImV4cCI6MjA4ODg5MjQwNX0.ZYbRPOmftlaeNZlUHLJMbjkUcDurzekdb4CSmc21syU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getUserId(): string | null {
  // Try localStorage first, then cookie as fallback
  const fromLS = localStorage.getItem('light_user_id');
  if (fromLS) return fromLS;

  const fromCookie = getCookie('light_user_id');
  if (fromCookie) {
    // Restore to localStorage
    localStorage.setItem('light_user_id', fromCookie);
    return fromCookie;
  }

  return null;
}

export function setUserId(id: string) {
  localStorage.setItem('light_user_id', id);
  setCookie('light_user_id', id, 365); // persist for 1 year
}
