'use client'

import { Header } from '@/components/header'
import dynamic from 'next/dynamic'

const PDFManager = dynamic(() => import('../lib/PDFManager'), {
  ssr: false,
})

export default function Page() {
  return (
    <div>
      <Header />
      <PDFManager />
    </div>
  )
}
