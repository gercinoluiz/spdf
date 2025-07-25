import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { Footer } from '@/components/footer'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: 'SPdf',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster richColors position='top-right' />
        </Providers>
      </body>
    </html>
  )
}
