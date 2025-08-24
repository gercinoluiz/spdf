import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';

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

// Helper function to create new JWT token
async function createJWTToken(user: any) {
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key'
  );

  const token = await new SignJWT({
    id: user.id,
    login: user.login,
    name: user.name,
    email: user.email,
    role: user.role,
    clientId: user.clientId,
    firstLogin: user.firstLogin,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  return token;
}

export async function PUT(request: NextRequest) {
  try {
    // Get current user from JWT token
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { name, email, currentPassword, newPassword } = await request.json();

    // Validate required fields
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { message: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Por favor, insira um email válido' },
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

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email: email.trim() },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { message: 'Este email já está sendo usado por outro usuário' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      name: name.trim(),
      email: email.trim(),
      updatedAt: new Date(),
    };

    // Handle password change if provided
    if (newPassword) {
      // Validate current password if changing password
      if (!currentPassword) {
        return NextResponse.json(
          { message: 'Senha atual é obrigatória para alterar a senha' },
          { status: 400 }
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

      // Validate new password length
      if (newPassword.length < 6) {
        return NextResponse.json(
          { message: 'Nova senha deve ter pelo menos 6 caracteres' },
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
      updateData.password = hashedNewPassword;
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Create new JWT token with updated information
    const newToken = await createJWTToken(updatedUser);

    // Create response
    const response = NextResponse.json(
      { 
        message: 'Perfil atualizado com sucesso',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          clientId: updatedUser.clientId,
        }
      },
      { status: 200 }
    );

    // Set new token in cookie
    response.cookies.set('token-spdf', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint to retrieve current user profile
export async function GET(request: NextRequest) {
  try {
    // Get current user from JWT token
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Find user by ID from JWT token
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        login: true,
        role: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}