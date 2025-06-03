'use client'

import Lottie from "lottie-react"
import animationData from "../../assets/404Animation.json"
import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
      <div className="w-full max-w-md">
        <Lottie animationData={animationData} loop={true} />
      </div>
      <h1 className="text-3xl font-bold text-[#123ead] mt-4">
        Página não encontrada
      </h1>
      <p className="text-gray-600 mt-2">
        A página que você está tentando acessar não existe ou foi movida.
      </p>
      <Link href="/" className="mt-6 inline-block text-white bg-gray-500 px-6 py-2 rounded hover:bg-[#123ead] transition">
        Voltar para a página inicial
      </Link>
    </main>
  )
}
