import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { Resend } from 'resend'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 },
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 },
      )
    }

    // Buscar usuário pelo email (case insensitive)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email.toLowerCase().trim(),
          mode: 'insensitive',
        },
      },
    })

    // Por segurança, sempre retornar sucesso mesmo se o usuário não existir
    if (!user) {
      return NextResponse.json({
        message:
          'Se o email existir em nosso sistema, você receberá instruções para redefinir sua senha.',
      })
    }

    // Gerar token único
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Salvar token na tabela PasswordResetToken (não na tabela User)
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    })

    // URL de reset
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

    // Template HTML com gradiente azul (sem logo)
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperação de Senha - SPDF</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%); min-height: 100vh;">
          <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(30, 58, 138, 0.3); margin: 20px 0;">
            
            <!-- Header com Gradiente Azul -->
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 25%, #60a5fa 50%, #93c5fd 75%, #dbeafe 100%); padding: 60px 30px; text-align: center; position: relative;">
              
              <!-- Título Principal -->
              <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                🔐 Recuperação de Senha
              </h1>
              <p style="color: rgba(255,255,255,0.95); margin: 20px 0 0 0; font-size: 20px; font-weight: 500;">
                SPDF
              </p>
              
              <!-- Decoração -->
              <div style="position: absolute; top: 20px; right: 20px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.6;"></div>
              <div style="position: absolute; bottom: 20px; left: 20px; width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.4;"></div>
            </div>
            
            <!-- Content -->
            <div style="padding: 50px 40px;">
              <!-- Saudação -->
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px 30px; border-radius: 12px; margin-bottom: 20px;">
                  <p style="font-size: 20px; margin: 0; color: #1e40af; font-weight: 600;">
                    Olá, <strong style="color: #1d4ed8;">${user.name}!</strong> 👋
                  </p>
                </div>
              </div>
              
              <p style="font-size: 16px; margin-bottom: 30px; color: #374151; line-height: 1.7; text-align: center;">
                Recebemos uma solicitação para redefinir a senha da sua conta no <strong style="color: #1e40af;">SPDF</strong>. 
                <br>Se você não fez esta solicitação, pode ignorar este email com segurança.
              </p>
              
              <!-- CTA Button com gradiente azul -->
              <div style="text-align: center; margin: 45px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%); 
                          color: white; 
                          padding: 18px 40px; 
                          text-decoration: none; 
                          border-radius: 12px; 
                          font-weight: 700; 
                          font-size: 16px; 
                          display: inline-block;
                          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
                          transition: all 0.3s ease;
                          text-transform: uppercase;
                          letter-spacing: 0.5px;">
                  🚀 Redefinir Minha Senha
                </a>
              </div>
              
              <!-- Security Info com tema azul -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 5px solid #3b82f6; padding: 25px; margin: 40px 0; border-radius: 0 12px 12px 0; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);">
                <p style="font-size: 16px; color: #1e40af; margin: 0 0 15px 0; font-weight: 700;">
                  🛡️ Informações de Segurança
                </p>
                <ul style="font-size: 14px; color: #374151; margin: 0; padding-left: 20px; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">Este link expira em <strong style="color: #1e40af;">1 hora</strong> por motivos de segurança</li>
                  <li style="margin-bottom: 8px;">Use apenas se você solicitou a redefinição</li>
                  <li>Nunca compartilhe este link com outras pessoas</li>
                </ul>
              </div>
              
              <!-- Alternative Link -->
              <div style="background: #f8fafc; border: 2px dashed #cbd5e1; padding: 25px; border-radius: 12px; margin: 30px 0;">
                <p style="font-size: 14px; color: #1e40af; margin: 0 0 15px 0; font-weight: 600; text-align: center;">
                  🔗 Link Alternativo
                </p>
                <p style="font-size: 11px; color: #64748b; margin: 0; word-break: break-all; font-family: 'Courier New', monospace; background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                  ${resetUrl}
                </p>
              </div>
              
              <!-- Footer -->
              <div style="text-align: center; margin-top: 50px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
                <p style="font-size: 12px; color: #6b7280; margin: 0; line-height: 1.5;">
                  Este email foi enviado automaticamente pelo <strong style="color: #1e40af;">SPDF</strong>.<br>
                  Se você não solicitou esta redefinição, pode ignorar este email com segurança.
                </p>
                
                <p style="font-size: 10px; color: #9ca3af; margin: 15px 0 0 0;">
                  © 2024 SPDF - Todos os direitos reservados
                </p>
              </div>
            </div>
          </div>
          
          <!-- Background decorativo -->
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 11px; color: rgba(255,255,255,0.7); margin: 0;">
              Email seguro e criptografado 🔒
            </p>
          </div>
        </body>
      </html>
    `

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: 'SPDF <onboarding@resend.dev>',
      to: [user.email!],
      subject: '🔐 Recuperação de Senha - SPDF',
      html: htmlTemplate,
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      return NextResponse.json(
        { error: 'Erro ao enviar email de recuperação' },
        { status: 500 },
      )
    }

    console.log('Email enviado com sucesso:', data)

    return NextResponse.json({
      message:
        'Se o email existir em nosso sistema, você receberá instruções para redefinir sua senha.',
    })
  } catch (error) {
    console.error('Erro no processo de recuperação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}
