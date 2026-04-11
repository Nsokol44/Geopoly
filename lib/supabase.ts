// lib/supabase.ts — CLIENT-SIDE ONLY
// This file is safe to import from Client Components and Server Components alike.
// It does NOT import next/headers.

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use this in 'use client' components
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
