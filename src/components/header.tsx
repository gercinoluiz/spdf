import Image from 'next/image'
import logo from '../../assets/logo.png'

export const Header = () => {
  return (
    <header className='flex items-center justify-center p-4 '>
      <Image src={logo} alt='logo' className='w-50 h-30' />
      
      <div className='flex items-center space-x-4'></div>
    </header>
  )
}