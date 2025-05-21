'use client'
import {
  UploadCloud,
  FilePlus,
  Download,
  Trash2,
  Shrink,
  RotateCw,
  RotateCcw,
} from 'lucide-react'

import logo from '../../assets/logo.png'

import { useState } from 'react'
import { PDFDocument, degrees } from 'pdf-lib'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { DndContext, closestCenter } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Image from 'next/image'

// Configurar worker do PDF.js
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`

// Thumbnail de página com suporte a arrastar
function SortableThumbnail({
  id,
  previewUrl,
  onDelete,
  rotation = 0,
  isSelected,
  onSelect,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  // Estado para controlar se o mouse está sobre a imagem
  const [isHovering, setIsHovering] = useState(false)

  // Estilo base do contêiner
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
  }

  // Estilo do contêiner interno que contém a imagem e a borda
  const innerContainerStyle = {
    transform: `rotate(${rotation}deg)`,
    transition: 'transform 0.3s ease',
    border: isSelected ? '2px solid blue' : 'none',
    borderRadius: '4px',
    padding: isSelected ? '2px' : '0',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', // Para posicionar a área de arrasto
  }

  // Estilo para a área de arrasto no centro
  const dragHandleStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '30px',
    height: '30px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'move',
    zIndex: 5,
    opacity: isHovering ? 1 : 0,
    transition: 'opacity 0.2s ease',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='relative'
      onClick={() => onSelect(id)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Botão de Excluir */}
      <button
        className='absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow hover:bg-red-600 z-10'
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onDelete(id)
        }}
        type='button'
      >
        ×
      </button>

      {/* Contêiner interno que gira junto com a imagem */}
      <div style={innerContainerStyle}>
        {/* Imagem da página */}
        <img
          src={previewUrl}
          alt='PDF page preview'
          className='rounded w-full'
          draggable={false} // Impede o comportamento padrão de drag de imagens
        />

        {/* Área de arrasto no centro - só aparece ao passar o mouse */}
        <div style={dragHandleStyle} {...attributes} {...listeners}>
          {/* Ícone de arrasto */}
          <svg width='16' height='16' viewBox='0 0 24 24' fill='white'>
            <path d='M7 19v-2h2v2H7zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm-8-4v-2h2v2H7zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2zm-8-4V9h2v2H7zm4 0V9h2v2h-2zm4 0V9h2v2h-2zM7 7V5h2v2H7zm4 0V5h2v2h-2zm4 0V5h2v2h-2z' />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function PDFManager() {
  const [files, setFiles] = useState([])
  const [pages, setPages] = useState([])
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null)
  const [mergedFileName, setMergedFileName] = useState('merged')

  const [mergedPdfSize, setMergedPdfSize] = useState(null) // tamanho do PDF final (em bytes)
  const [compressedPdfSize, setCompressedPdfSize] = useState(null) // tamanho do PDF comprimido (opcional)

  const [compressing, setCompressing] = useState(false)

  const [compressedBlob, setCompressedBlob] = useState(null)
  const [compressedSizeMB, setCompressedSizeMB] = useState(null)
  const [originalSizeMB, setOriginalSizeMB] = useState(null)

  const [selectedPageId, setSelectedPageId] = useState(null)
  const [pageRotations, setPageRotations] = useState({})

  const handleSelectPage = (pageId) => {
    // Se clicar na mesma página, deseleciona
    if (selectedPageId === pageId) {
      setSelectedPageId(null)
    } else {
      setSelectedPageId(pageId)
    }
  }

  const rotateSelectedPage = (direction) => {
    if (!selectedPageId) return

    setPageRotations((prev) => {
      const currentRotation = prev[selectedPageId] || 0
      // Adiciona ou subtrai 90 graus, mantendo entre 0 e 270
      const newRotation =
        (currentRotation + (direction === 'right' ? 90 : -90) + 360) % 360
      return { ...prev, [selectedPageId]: newRotation }
    })
  }

  const [loadingPdfs, setLoadingPdfs] = useState(false)

  const handleFileChange = async (e) => {
    const newFiles = Array.from(e.target.files)
    if (!newFiles.length) return

    // Importante: defina o estado como true imediatamente
    setLoadingPdfs(true)
    console.log('Iniciando carregamento de PDFs...') // Log para debug

    try {
      setFiles((prev) => [...prev, ...newFiles])

      const newPages = []

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i]
        console.log(
          `Processando arquivo ${i + 1}/${newFiles.length}: ${file.name}`,
        )

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await getDocument({ data: arrayBuffer }).promise

        for (let j = 0; j < pdf.numPages; j++) {
          const page = await pdf.getPage(j + 1)
          const viewport = page.getViewport({ scale: 1 })

          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.width = viewport.width
          canvas.height = viewport.height

          // Renderizar a página no canvas
          await page.render({ canvasContext: context, viewport }).promise

          // Transformar o canvas em uma imagem base64
          const previewUrl = canvas.toDataURL()

          // Limpar o canvas da memória
          canvas.width = 0
          canvas.height = 0

          const pageId = `page-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`
          newPages.push({
            id: pageId,
            file,
            fileIndex: i,
            pageIndex: j,
            previewUrl,
          })
        }

        // Atualizar o nome do arquivo mesclado
        if (!mergedFileName || mergedFileName === 'merged') {
          const nameWithoutExt = newFiles[0].name.replace(/\.pdf$/i, '')
          setMergedFileName(`${nameWithoutExt}_${new Date().toLocaleString()}`)
        }
      }

      setPages((prev) => [...prev, ...newPages])
      console.log('PDFs carregados com sucesso!')
    } catch (error) {
      console.error('Erro ao carregar PDFs:', error)
      alert('Ocorreu um erro ao carregar os PDFs. Por favor, tente novamente.')
    } finally {
      // Importante: certifique-se de que este código seja executado
      console.log('Finalizando carregamento de PDFs...')
      setLoadingPdfs(false)
    }
  }

  const handleDeletePage = (idToDelete) => {
    console.log('Deleting page with ID:', idToDelete)
    setPages((currentPages) =>
      currentPages.filter((page) => page.id !== idToDelete),
    )
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      const oldIndex = pages.findIndex((p) => p.id === active.id)
      const newIndex = pages.findIndex((p) => p.id === over.id)
      setPages((items) => arrayMove(items, oldIndex, newIndex))
    }
  }

  const mergePDFs = async () => {
    const mergedPdf = await PDFDocument.create()

    for (const pageData of pages) {
      const arrayBuffer = await pageData.file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const copiedPage = await mergedPdf.copyPages(pdf, [pageData.pageIndex])
      mergedPdf.addPage(copiedPage[0])
    }

    const mergedPdfBytes = await mergedPdf.save()
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' })

    setMergedPdfSize(blob.size) // <<<< salva o tamanho!

    const url = URL.createObjectURL(blob)
    setMergedPdfUrl(url)
  }

  const handleMergePDFs = async () => {
    if (!pages.length) return

    try {
      const mergedPdf = await PDFDocument.create()
      for (const pageData of pages) {
        const arrayBuffer = await pageData.file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const copiedPage = await mergedPdf.copyPages(pdf, [pageData.pageIndex])

        // Aplicar rotação se existir
        const rotation = pageRotations[pageData.id] || 0
        if (rotation !== 0) {
          // Converter graus para a constante de rotação do pdf-lib
          let pdfRotation
          switch (rotation) {
            case 90:
              pdfRotation = degrees(90)
              break
            case 180:
              pdfRotation = degrees(180)
              break
            case 270:
              pdfRotation = degrees(270)
              break
            default:
              pdfRotation = degrees(0)
          }

          copiedPage[0].setRotation(pdfRotation)
        }

        mergedPdf.addPage(copiedPage[0])
      }

      const mergedPdfBytes = await mergedPdf.save()
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' })

      setMergedPdfUrl(URL.createObjectURL(blob))
      setOriginalSizeMB((blob.size / (1024 * 1024)).toFixed(2))
      setCompressedBlob(null)
      setCompressedSizeMB(null)
    } catch (error) {
      console.error('Erro ao mesclar PDFs:', error)
    }
  }

  const handleUploadAndCompress = async () => {
    if (!pages.length) {
      alert('Nenhuma página selecionada!')
      return
    }

    setCompressing(true)

    try {
      // Step 1: Create a merged PDF WITHOUT rotations first
      const mergedPdf = await PDFDocument.create()
      for (const pageData of pages) {
        const arrayBuffer = await pageData.file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const copiedPage = await mergedPdf.copyPages(pdf, [pageData.pageIndex])
        mergedPdf.addPage(copiedPage[0])
      }

      const mergedPdfBytes = await mergedPdf.save()
      const mergedBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' })

      // Calculate original size
      const originalSize = mergedBlob.size
      setOriginalSizeMB((originalSize / (1024 * 1024)).toFixed(2))

      // Step 2: Send for compression WITHOUT rotations
      const formData = new FormData()
      formData.append('file', mergedBlob, 'merged.pdf')
      formData.append('pageOrder', JSON.stringify(pages.map((p) => p.id)))
      formData.append('rotations', JSON.stringify(pageRotations))
      // Also send rotation data to apply after compression
      const rotationData = JSON.stringify(pageRotations)
      formData.append('rotations', rotationData)

      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Erro ao comprimir PDF: ${response.statusText}`)
      }

      const compressedBlob = await response.blob()
      setCompressedBlob(compressedBlob)
      setCompressedSizeMB((compressedBlob.size / (1024 * 1024)).toFixed(2))

      console.log('✅ PDF mesclado e comprimido com sucesso!')
    } catch (err) {
      console.error('❌ Falha ao mesclar e comprimir:', err)
      alert(
        'Erro ao mesclar e comprimir o PDF. Verifique o console para mais detalhes.',
      )
    } finally {
      setCompressing(false)
    }
  }

  return (
    <Card className='max-w-5xl mx-auto mt-10 p-6 space-y-6'>
      <CardContent className='space-y-6'>
 

        {/* Lista de páginas */}
        <div className='space-y-4'>
          <div>
            <div className='flex flex-row flex-wrap items-center justify-center gap-8'>
              {/* Botão de carregar arquivos */}
              <div className='flex flex-col items-center justify-center text-gray-400'>
                <label
                  htmlFor='file-upload'
                  className='flex flex-col items-center cursor-pointer space-y-2'
                >
                  {loadingPdfs ? (
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
                  ) : (
                    <UploadCloud
                      size={48}
                      className='text-blue-500 hover:text-blue-600 transition'
                    />
                  )}
                  <span className='text-blue-600 font-medium'>
                    {loadingPdfs
                      ? 'Carregando PDFs...'
                      : 'Adicionar arquivos PDF'}
                  </span>
                </label>
                <Input
                  id='file-upload'
                  type='file'
                  multiple
                  accept='application/pdf'
                  className='hidden'
                  onChange={handleFileChange}
                  disabled={loadingPdfs}
                />
              </div>

              {/* Botões de rotação - ADICIONADOS AQUI */}
              {selectedPageId && (
                <>
                  <div className='flex flex-col items-center justify-center text-gray-400'>
                    <button
                      onClick={() => rotateSelectedPage('left')}
                      className='flex flex-col items-center space-y-2 cursor-pointer'
                      type='button'
                    >
                      <RotateCcw
                        size={48}
                        className='text-indigo-500 hover:text-indigo-600 transition'
                      />
                      <span className='text-indigo-600 font-medium'>
                        Girar Esquerda
                      </span>
                    </button>
                  </div>

                  <div className='flex flex-col items-center justify-center text-gray-400'>
                    <button
                      onClick={() => rotateSelectedPage('right')}
                      className='flex flex-col items-center space-y-2 cursor-pointer'
                      type='button'
                    >
                      <RotateCw
                        size={48}
                        className='text-indigo-500 hover:text-indigo-600 transition'
                      />
                      <span className='text-indigo-600 font-medium'>
                        Girar Direita
                      </span>
                    </button>
                  </div>
                </>
              )}

              {/* Botão de MESCLAR PDFs */}
              <div className='flex flex-col items-center justify-center text-gray-400'>
                <button
                  onClick={handleMergePDFs}
                  disabled={!pages.length}
                  className='flex flex-col items-center space-y-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                  type='button'
                >
                  <FilePlus
                    size={48}
                    className={`${
                      pages.length
                        ? 'text-green-500 hover:text-green-600'
                        : 'text-gray-300'
                    } transition`}
                  />
                  <span
                    className={`${
                      pages.length ? 'text-green-600' : 'text-gray-400'
                    } font-medium`}
                  >
                    Mesclar PDFs
                  </span>
                </button>
              </div>

              {/* Botão de MESCLAR + COMPRIMIR PDFs */}
              <div className='flex flex-col items-center justify-center text-gray-400'>
                <button
                  onClick={handleUploadAndCompress}
                  disabled={!files.length || compressing}
                  className='flex flex-col items-center space-y-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                  type='button'
                >
                  {compressing ? (
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500'></div>
                  ) : (
                    <Shrink
                      size={48}
                      className={`${
                        files.length
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-300'
                      } transition`}
                    />
                  )}
                  <span
                    className={`${
                      files.length ? 'text-yellow-600' : 'text-gray-400'
                    } font-medium`}
                  >
                    {compressing ? 'Comprimindo...' : 'Mesclar e Comprimir'}
                  </span>
                </button>
              </div>

              {/* Botão de Baixar PDF Mesclado */}
              {mergedPdfUrl && !compressedBlob && (
                <div className='flex flex-col items-center justify-center text-gray-400'>
                  <a
                    href={mergedPdfUrl}
                    download='pdf_mesclado.pdf'
                    className='flex flex-col items-center space-y-2 cursor-pointer'
                  >
                    <Download
                      size={48}
                      className='text-purple-500 hover:text-purple-600 transition'
                    />
                    <span className='text-purple-600 font-medium'>
                      Baixar PDF Mesclado
                    </span>
                  </a>
                </div>
              )}

              {/* Botão de Baixar PDF Comprimido */}
              {compressedBlob && (
                <div className='flex flex-col items-center justify-center text-gray-400'>
                  <button
                    onClick={() => {
                      const url = URL.createObjectURL(compressedBlob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'pdf_comprimido.pdf'
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                    }}
                    className='flex flex-col items-center space-y-2 cursor-pointer'
                  >
                    <Download
                      size={48}
                      className='text-green-500 hover:text-green-600 transition'
                    />
                    <span className='text-green-600 font-medium'>
                      Baixar PDF Comprimido
                    </span>
                  </button>
                </div>
              )}

              {/* Botão de Deletar todas as páginas */}
              <div className='flex flex-col items-center justify-center text-gray-400'>
                <button
                  onClick={() => {
                    // Limpar todos os estados relacionados aos PDFs
                    setPages([])
                    setFiles([])
                    setMergedPdfUrl(null)
                    setMergedFileName('merged')
                    setMergedPdfSize(null)
                    setCompressedPdfSize(null)
                    setCompressedBlob(null)
                    setCompressedSizeMB(null)
                    setOriginalSizeMB(null)
                    setSelectedPageId(null)
                    setPageRotations({})

                    // Se houver URLs de objetos criados, revogá-los para liberar memória
                    if (mergedPdfUrl) {
                      URL.revokeObjectURL(mergedPdfUrl)
                    }
                  }}
                  disabled={!pages.length}
                  className='flex flex-col items-center space-y-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                  type='button'
                >
                  <Trash2
                    size={48}
                    className={`${
                      pages.length
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-gray-300'
                    } transition`}
                  />
                  <span
                    className={`${
                      pages.length ? 'text-red-600' : 'text-gray-400'
                    } font-medium`}
                  >
                    Deletar Tudo
                  </span>
                </button>
              </div>

              {/* Informações sobre tamanho */}
              {originalSizeMB && (
                <div className='text-center mt-4 text-gray-600'>
                  <p>
                    <strong>Tamanho original:</strong> {originalSizeMB} MB
                  </p>

                  {compressedSizeMB && (
                    <>
                      <p className='mt-2'>
                        <strong>Tamanho após compressão:</strong>{' '}
                        {compressedSizeMB} MB
                      </p>
                      <p className='mt-2'>
                        <strong>Redução:</strong>{' '}
                        {(
                          (1 - compressedSizeMB / originalSizeMB) *
                          100
                        ).toFixed(2)}
                        %
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <h2 className='text-lg mt-6 font-medium'>
              Páginas adicionadas ({pages.length})
            </h2>

            <div className='max-h-[500px] mt-6 overflow-y-auto border rounded-md p-4 custom-scrollbar'>
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={pages.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-12'>
                    {pages.map((page) => (
                      <SortableThumbnail
                        key={page.id}
                        id={page.id}
                        previewUrl={page.previewUrl}
                        onDelete={handleDeletePage}
                        rotation={pageRotations[page.id] || 0}
                        isSelected={selectedPageId === page.id}
                        onSelect={handleSelectPage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
