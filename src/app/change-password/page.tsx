'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Save, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/header';

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'A senha deve ter pelo menos 8 caracteres';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'A senha deve conter pelo menos uma letra minúscula';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'A senha deve conter pelo menos uma letra maiúscula';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'A senha deve conter pelo menos um número';
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return 'A senha deve conter pelo menos um caractere especial (@$!%*?&)';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos os campos são obrigatórios.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As novas senhas não coincidem.');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (currentPassword === newPassword) {
      setError('A nova senha deve ser diferente da senha atual.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type'));
      console.log('Response URL:', response.url);

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        console.log('Non-JSON response:', textResponse);
        data = { message: 'Resposta inválida do servidor' };
      }

      console.log('Response data:', data);

      if (response.ok) {
        setSuccess('Senha alterada com sucesso! Redirecionando...');
        setTimeout(async () => {
          // Fazer logout para limpar o token antigo
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
          });
          
          // Redirecionar para login
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message || 'Falha ao alterar a senha.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao alterar a senha.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <Header />

      <div className='p-6 max-w-2xl mx-auto mb-6'>
        {/* Page Title */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 flex items-center space-x-2'>
            <Lock className='h-6 w-6' />
            <span>Alterar Sua Senha</span>
          </h1>
          <p className='text-gray-600 mt-1'>Por favor, digite sua senha atual e escolha uma nova</p>
        </div>

        {/* Change Password Card */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Lock className='h-5 w-5' />
              <span>Alteração de Senha</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='current-password'>Senha Atual</Label>
                <div className='relative'>
                  <Input
                    id='current-password'
                    name='current-password'
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder='Digite sua senha atual'
                    className='w-full pr-10'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='new-password'>Nova Senha</Label>
                  <div className='relative'>
                    <Input
                      id='new-password'
                      name='new-password'
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder='Digite sua nova senha'
                      className='w-full pr-10'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='confirm-password'>Confirmar Nova Senha</Label>
                  <div className='relative'>
                    <Input
                      id='confirm-password'
                      name='confirm-password'
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder='Confirme sua nova senha'
                      className='w-full pr-10'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Password Requirements */}
              <div className='text-xs text-gray-600 bg-gray-50 p-3 rounded-md'>
                <p className='font-medium mb-2'>Requisitos da senha:</p>
                <ul className='list-disc list-inside space-y-1'>
                  <li>Pelo menos 8 caracteres</li>
                  <li>Contém letras maiúsculas e minúsculas</li>
                  <li>Contém pelo menos um número</li>
                  <li>Contém pelo menos um caractere especial (@$!%*?&)</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className='flex justify-end space-x-4 pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type='submit'
                  disabled={loading}
                  className='bg-black hover:bg-gray-800 text-white'
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Alterando Senha...
                    </>
                  ) : (
                    <>
                      <Save className='mr-2 h-4 w-4' />
                      Alterar Senha
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Messages */}
        {error && (
          <Card className='mb-6 border-red-200 bg-red-50'>
            <CardContent className='pt-6'>
              <p className='text-red-600 text-sm'>{error}</p>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className='mb-6 border-green-200 bg-green-50'>
            <CardContent className='pt-6'>
              <p className='text-green-600 text-sm'>{success}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordPage;