import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return res;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cs) => {
        cs.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  // /dashboard/* requires authenticated admin
  if (path.startsWith('/dashboard')) {
    if (!session) {
      const loginUrl = new URL('/', req.url);
      return NextResponse.redirect(loginUrl);
    }
    // Cek admin role — jika tidak ada, redirect ke login
    const { data: role } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (!role) {
      await supabase.auth.signOut();
      const loginUrl = new URL('/?error=not_admin', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
