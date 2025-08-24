import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const prisma = new PrismaClient();

// Helper function to get current user from JWT
async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token-spdf')?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    const { payload } = await jwtVerify(token, secret);
    
    return {
      id: payload.id as number,
      login: payload.login as string,
      role: payload.role as string,
      clientId: payload.clientId as number,
    };
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user from JWT token
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Senha atual e nova senha são obrigatórias' },
        { status: 400 }
      );
    }

    // Find user by ID from JWT token
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { message: 'Senha atual está incorreta' },
        { status: 400 }
      );
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    
    if (isSamePassword) {
      return NextResponse.json(
        { message: 'A nova senha deve ser diferente da senha atual' },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and set firstLogin to false
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        firstLogin: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: 'Senha alterada com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}