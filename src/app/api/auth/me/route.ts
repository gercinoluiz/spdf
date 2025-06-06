import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose"; // Instale com: npm install jose

export async function GET() {
  try {
    // Obter o token do cookie
    const cookieStore = cookies();
    const token = cookieStore.get("token-spdf")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verificar e decodificar o token usando jose
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );
    
    const { payload } = await jwtVerify(token, secret);
    
    // Retornar informações do usuário
    return NextResponse.json({
      id: payload.id,
      name: payload.name,
      login: payload.login
    });
  } catch (error) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}