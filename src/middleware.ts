import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
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

  // Se houver token, permitir acesso
  // Não precisamos verificar a validade do token aqui, isso pode ser feito nas rotas de API
  return NextResponse.next();
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