import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum di-set');
}

export function createSupabaseServer() {
  const store = cookies();
  return createServerClient(url!, anonKey!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (cs) => {
        try {
          cs.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // di-call dari Server Component yang bukan action — skip
        }
      },
    },
  });
}
