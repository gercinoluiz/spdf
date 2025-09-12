'use client'

import { Suspense } from 'react'
import { LoginForm } from '../../components/login-form'
import imageLoginPage from '../../../assets/loginImage.json'

import logo from '../../../assets/logo.png'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className='min-h-screen flex  max-h-80'>
      {/* Left side - Image */}
      <div className='hidden lg:flex lg:w-3/7 relative justify-center items-center flex-col'>
      <Image src={logo} alt='logo' className='' />


      </div>

      {/* Right side - Login Form */}
      <div className='flex-1 flex items-center justify-center p-8 bg-background'>
        <div className='w-full max-w-md'>
          <Suspense fallback={<div className="flex items-center justify-center p-8">Carregando...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
