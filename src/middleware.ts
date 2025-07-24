import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  // Permitir acesso a arquivos estáticos
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('favicon.ico') ||
    request.nextUrl.pathname.startsWith('/api/auth/')
  ) {
    return NextResponse.next();
  }

  // Permitir acesso à página de login
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  // Obter o token do cookie
  const token = request.cookies.get("token-spdf")?.value;

  // Se não houver token, redirecionar para login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Validar o token
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );
    
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (error) {
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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};