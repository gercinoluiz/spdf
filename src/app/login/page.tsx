'use client'

import { LoginForm } from '../../components/login-form'
import imageLoginPage from '../../../assets/loginImage.json'

import Lottie from 'lottie-react'

export default function LoginPage() {
  return (
    <div className='min-h-screen flex  max-h-80'>
      {/* Left side - Image */}
      <div className='hidden lg:flex lg:w-3/7 relative justify-center items-center flex-col'>
        <Lottie 
          animationData={imageLoginPage} 
          loop={true}
          style={{ width: '70%', height: '70%', marginTop:'-10%' }}
        />
        <h1 className='text-4xl font-bold text-gray-800'>
          São Paulo PDF
        </h1>

      </div>

      {/* Right side - Login Form */}
      <div className='flex-1 flex items-center justify-center p-8 bg-background'>
        <div className='w-full max-w-md'>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
