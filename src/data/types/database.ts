export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type Database = any; // ✅ Reemplaza por tipos generados (supabase gen types typescript)
