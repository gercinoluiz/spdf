'use client'

import { Header } from '@/components/header'
import dynamic from 'next/dynamic'
import { useUserStore } from '@/store/useUserStore'

const PDFManager = dynamic(() => import('../components/PDFManager'), {
  ssr: false,
})

export default function Page() {
  const { user } = useUserStore()

  return (
    <div>
      <Header />
      {/* Renderizar o componente PDFManager */}
      <PDFManager />
    </div>
  )
}
