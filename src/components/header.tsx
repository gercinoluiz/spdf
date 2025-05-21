import Image from 'next/image'
import logo from '../../assets/logo.png'

export const Header = () => {
  return (
    <header className='flex items-center justify-center p-4 '>
      <Image src={logo} alt='logo' className='w-28 h-28' />
      <h1 className='text-2xl font-bold'> Manipulador de PDF </h1>
      <div className='flex items-center space-x-4'></div>
    </header>
  )
}