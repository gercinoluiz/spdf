import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { auth } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  console.log("Middleware executando para:", request.nextUrl.pathname);
  
  // Obter o token do cookie
  const token = request.cookies.get("token-spdf")?.value;
  console.log("Token encontrado:", token ? "Sim" : "Não");

  // Lista de rotas públicas que não requerem autenticação
  const publicRoutes = ['/login', '/api/auth/login'];
  
  // Verificar se a rota atual é pública
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || 
    request.nextUrl.pathname.startsWith('/api/auth/')
  );

  // Permitir acesso a arquivos estáticos
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Se for uma rota pública, permitir acesso
  if (isPublicRoute) {
    console.log("Rota pública, permitindo acesso");
    return NextResponse.next();
  }

  // Se não houver token, redirecionar para login
  if (!token) {
    console.log("Token não encontrado, redirecionando para login");
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Validar o token
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );
    
    await jwtVerify(token, secret);
    console.log("Token válido, permitindo acesso");
    return NextResponse.next();
  } catch (error) {
    console.log("Token inválido, redirecionando para login");
    // Token inválido, limpar cookie e redirecionar
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set({
      name: "token-spdf",
      value: "",
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    return response;
  }
}

// Configurar quais rotas o middleware deve verificar
export const config = {
  matcher: [
    '/',
    '/clients/:path*',
    '/new-client/:path*',
    '/api/:path*',
    '/((?!api/auth|_next|favicon.ico|login).*)',
  ],
};

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnLoginPage = req.nextUrl.pathname.startsWith('/login')
  const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth')
  const isPublicFile = req.nextUrl.pathname.startsWith('/_next') || 
                      req.nextUrl.pathname.includes('favicon.ico')

  // Allow access to public files
  if (isPublicFile) {
    return
  }

  // Allow access to auth API routes
  if (isApiAuthRoute) {
    return
  }

  // If on login page and already logged in, redirect to home
  if (isOnLoginPage && isLoggedIn) {
    return Response.redirect(new URL('/', req.url))
  }

  // If not logged in and not on login page, redirect to login
  if (!isLoggedIn && !isOnLoginPage) {
    return Response.redirect(new URL('/login', req.url))
  }

  return
})

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login$).*)',
  ],
}