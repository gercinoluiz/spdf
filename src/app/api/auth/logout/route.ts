import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Limpar o cookie de autenticação
  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0, // Expirar imediatamente
  });

  return response;
}