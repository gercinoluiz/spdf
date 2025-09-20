/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */

'use client'
import {
  Download,
  FilePlus,
  RotateCcw,
  RotateCw,
  Shrink,
  Trash2,
  UploadCloud,
} from 'lucide-react'

/**
 * Represents a sortable thumbnail component for PDF page previews.
 *
 * @param {Object} props - The component properties
 * @param {string} props.id - Unique identifier for the thumbnail
 * @param {string} props.previewUrl - URL of the page preview image
 * @param {Function} props.onDelete - Callback function for deleting the thumbnail
 * @param {number} [props.rotation=0] - Rotation angle of the thumbnail
 * @param {boolean} props.isSelected - Indicates if the thumbnail is currently selected
 * @param {Function} props.onSelect - Callback function for selecting the thumbnail
 *
 * @returns {React.ReactElement} A draggable and interactive PDF page thumbnail
 */

// import logo from '../../assets/logo.png'

import { degrees, PDFDocument } from 'pdf-lib'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf'
import { useState, useEffect } from 'react'

import { Card, CardContent } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'

import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import ActionButton from '@/components/actionButton'
import Spin from '@/components/spin'
import { closestCenter, DndContext } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Image from 'next/image'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
    border: isSelected ? '2px solid #374151' : 'none', // Alterado de blue para gray-700
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
        <Image
          src={previewUrl}
          alt='PDF page preview'
          className='rounded w-full'
          draggable={false}
          width={500} // Add an appropriate width
          height={700} // Add an appropriate height
          style={{ width: '100%', height: 'auto' }} // Make it responsive
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

  const [compressionLevel, setCompressionLevel] = useState([2]) // ✅ Já está correto - Médio como padrão

  const [mergedPdfSize, setMergedPdfSize] = useState(null) // tamanho do PDF final (em bytes)

  const [compressedPdfSize, setCompressedPdfSize] = useState(null) // tamanho do PDF comprimido (opcional)

  const [compressing, setCompressing] = useState(false)

  const [compressedBlob, setCompressedBlob] = useState(null)
  const [compressedSizeMB, setCompressedSizeMB] = useState(null)
  const [originalSizeMB, setOriginalSizeMB] = useState(null)

  const [selectedPageId, setSelectedPageId] = useState(null)
  const [pageRotations, setPageRotations] = useState({})

  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  const [isMerging, setIsMerging] = useState(false)

  const [showProgressBar, setShowProgressBar] = useState(false)

  // Novo estado para controlar o modal de download
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [downloadType, setDownloadType] = useState('') // 'merged' ou 'compressed'

  // Função para fechar o modal e limpar dados
  const closeDownloadModal = () => {
    setShowDownloadModal(false)
    setDownloadType('')
    
    // Limpar dados para forçar nova operação
    if (mergedPdfUrl) {
      URL.revokeObjectURL(mergedPdfUrl)
    }
    setMergedPdfUrl(null)
    setCompressedBlob(null)
    setCompressedSizeMB(null)
    setOriginalSizeMB(null)
    setMergedPdfSize(null)
    setCompressedPdfSize(null)
  }

  useEffect(() => {
    // Function to handle keydown events
    const handleKeyDown = (event) => {
      // Check if Delete key is pressed and a page is selected
      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        selectedPageId
      ) {
        handleDeletePage(selectedPageId)
      }
    }

    // Add event listener when component mounts
    window.addEventListener('keydown', handleKeyDown)

    // Clean up event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedPageId]) // Re-run effect when selectedPageId changes

  const getCompressionDescription = (level) => {
    switch (level) {
      case 1:
        return {
          name: 'Baixa Compressão',
          description: 'Maior tamanho, maior qualidade',
          color: 'text-gray-600', // Alterado de text-green-600
        }
      case 2:
        return {
          name: 'Compressão Média',
          description: 'Equilíbrio entre tamanho e qualidade',
          color: 'text-gray-700', // Alterado de text-yellow-600
        }
      case 3:
        return {
          name: 'Alta Compressão',
          description: 'Menor tamanho, menor qualidade',
          color: 'text-gray-800', // Alterado de text-red-600
        }
      default:
        return {
          name: 'Compressão Média',
          description: 'Equilíbrio entre tamanho e qualidade',
          color: 'text-gray-700', // Alterado de text-yellow-600
        }
    }
  }

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

    // // Incrementar uso após rotação
    // incrementUsage()
  }

  const [loadingPdfs, setLoadingPdfs] = useState(false)

  // Adicione esta função após as importações
  const incrementUsage = async () => {
    try {
      await fetch('/api/usage/increment', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Erro ao incrementar uso:', error)
    }
  }

  const handleFileChange = async (e) => {
    const newFiles = Array.from(e.target.files)
    if (!newFiles.length) return

    setLoadingPdfs(true)
    setIsLoading(true)
    setShowProgressBar(false) // Não mostrar barra de progresso para upload

    // // Incrementar uso após carregar arquivos
    // incrementUsage();

    try {
      setFiles((prev) => [...prev, ...newFiles])

      const newPages = []

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i]
        console.log(
          `Processando arquivo ${i + 1}/${newFiles.length}: ${file.name}`,
        )

        // Check if file is PDF or image
        if (file.type === 'application/pdf') {
          // Process PDF file
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
              isImage: false,
            })
          }
        } else if (file.type.startsWith('image/')) {
          // Process image file
          const pageId = `page-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`

          // Create preview URL directly from the image file
          const previewUrl = URL.createObjectURL(file)

          newPages.push({
            id: pageId,
            file,
            fileIndex: i,
            pageIndex: 0,
            previewUrl,
            isImage: true,
          })
        }

        // Atualizar o nome do arquivo mesclado
        if (!mergedFileName || mergedFileName === 'merged') {
          const nameWithoutExt = newFiles[0].name.replace(
            /\.(pdf|jpe?g|png|gif|webp)$/i,
            '',
          )
          setMergedFileName(`${nameWithoutExt}_${new Date().toLocaleString()}`)
        }
      }

      setPages((prev) => [...prev, ...newPages])
      console.log('Arquivos carregados com sucesso!')
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error)
      alert(
        'Ocorreu um erro ao carregar os arquivos. Por favor, tente novamente.',
      )
    } finally {
      setLoadingPdfs(false)
      setIsLoading(false)
    }
  }

  const handleDeletePage = (idToDelete) => {
    console.log('Deleting page with ID:', idToDelete)
    setPages((currentPages) =>
      currentPages.filter((page) => page.id !== idToDelete),
    )

    // // Incrementar uso após deletar página
    // incrementUsage()
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
      if (pageData.isImage) {
        // Handle image file
        const imageBytes = await fetch(pageData.previewUrl).then((res) =>
          res.arrayBuffer(),
        )

        // Create a new page with A4 dimensions
        // A4 size in points: 595 × 842 (portrait)
        const a4Page = mergedPdf.addPage([595, 842])

        let image

        if (pageData.file.type === 'image/jpeg') {
          image = await mergedPdf.embedJpg(imageBytes)
        } else if (pageData.file.type === 'image/png') {
          image = await mergedPdf.embedPng(imageBytes)
        } else {
          // For other image types, convert to PNG first
          const img = new Image()
          await new Promise((resolve) => {
            img.onload = resolve
            img.src = pageData.previewUrl
          })

          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)

          const pngData = await fetch(canvas.toDataURL('image/png')).then(
            (res) => res.arrayBuffer(),
          )

          image = await mergedPdf.embedPng(pngData)
        }

        // Calculate dimensions to fit image within A4 while maintaining aspect ratio
        const { width: imgWidth, height: imgHeight } = image
        const pageWidth = a4Page.getWidth()
        const pageHeight = a4Page.getHeight()

        // Calculate scaling factors
        const widthScale = pageWidth / imgWidth
        const heightScale = pageHeight / imgHeight

        // Use the smaller scaling factor to ensure the image fits
        const scale = Math.min(widthScale, heightScale) * 0.9 // 90% of the page to add margins

        // Calculate dimensions after scaling
        const scaledWidth = imgWidth * scale
        const scaledHeight = imgHeight * scale

        // Calculate position to center the image
        const x = (pageWidth - scaledWidth) / 2
        const y = (pageHeight - scaledHeight) / 2

        // Draw the image on the page
        a4Page.drawImage(image, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        })

        // Apply rotation if needed
              const rotation = pageRotations[pageData.id] || 0
              console.log('🔍 DEBUG - Imagem:', pageData.id, 'Rotação CSS:', rotation)
              if (rotation !== 0) {
                let pdfRotation
                // ✅ MAPEAMENTO COMPLETAMENTE INVERTIDO
                switch (rotation) {
                  case 90:  // direita no CSS
                    pdfRotation = degrees(90)   // direita no PDF
                    break
                  case 180: // baixo no CSS  
                    pdfRotation = degrees(180) // baixo no PDF
                    break
                  case 270: // esquerda no CSS
                    pdfRotation = degrees(270) // esquerda no PDF
                    break
                  default:
                    pdfRotation = degrees(0)
                }
                console.log('🔍 DEBUG - Aplicando rotação PDF (imagem):', pdfRotation)
                a4Page.setRotation(pdfRotation)
              }
      } else {
        // Handle PDF file
        const arrayBuffer = await pageData.file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const copiedPage = await mergedPdf.copyPages(pdf, [pageData.pageIndex])

        // Apply rotation if needed
          const rotation = pageRotations[pageData.id] || 0
          console.log('🔍 DEBUG - Página (handleMergePDFs):', pageData.id, 'Rotação CSS:', rotation)
          if (rotation !== 0) {
            let pdfRotation
            // ✅ MAPEAMENTO COMPLETAMENTE INVERTIDO
            switch (rotation) {
              case 90:  // direita no CSS
                pdfRotation = degrees(90)   // direita no PDF
                break
              case 180: // baixo no CSS  
                pdfRotation = degrees(180) // baixo no PDF
                break
              case 270: // esquerda no CSS
                pdfRotation = degrees(270) // esquerda no PDF
                break
              default:
                pdfRotation = degrees(0)
            }
            console.log('🔍 DEBUG - Aplicando rotação PDF (handleMergePDFs):', pdfRotation)
            copiedPage[0].setRotation(pdfRotation)
          }

        mergedPdf.addPage(copiedPage[0])
      }
    }

    const mergedPdfBytes = await mergedPdf.save()

    // Process hyperlinks through Python API WITHOUT compression
      const processedPdfBytes = await processHyperlinks(mergedPdfBytes, false, compressionLevel[0])

    const blob = new Blob([processedPdfBytes], { type: 'application/pdf' })
    setMergedPdfSize(blob.size)

    const url = URL.createObjectURL(blob)
    setMergedPdfUrl(url)

    return processedPdfBytes
  }

  const handleMergePDFs = async () => {
    if (!pages.length) return

    // ✅ Adicionar esta linha
    incrementUsage()

    setIsMerging(true)
    setIsLoading(true)
    setShowProgressBar(true) // Mostrar barra de progresso para mesclagem
    setProgress(0)
    setProgressMessage('Iniciando mesclagem de PDFs..')

    try {
      const mergedPdf = await PDFDocument.create()

      setProgress(10)
      setProgressMessage('Preparando documento...')

      // Processar cada página com atualização de progresso
      for (let i = 0; i < pages.length; i++) {
        const pageData = pages[i]

        // Calcular progresso atual (distribuir 80% do progresso entre as páginas)
        const pageProgress = 10 + (i / pages.length) * 80
        setProgress(pageProgress)
        setProgressMessage(`Processando página ${i + 1} de ${pages.length}...`)

        if (pageData.isImage) {
          // Handle image file
          const imageBytes = await fetch(pageData.previewUrl).then((res) =>
            res.arrayBuffer(),
          )

          // Create a new page with A4 dimensions
          // A4 size in points: 595 × 842 (portrait)
          const a4Page = mergedPdf.addPage([595, 842])

          let image

          if (pageData.file.type === 'image/jpeg') {
            image = await mergedPdf.embedJpg(imageBytes)
          } else if (pageData.file.type === 'image/png') {
            image = await mergedPdf.embedPng(imageBytes)
          } else {
            // For other image types, convert to PNG first
            const img = new Image()
            await new Promise((resolve) => {
              img.onload = resolve
              img.src = pageData.previewUrl
            })

            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0)

            const pngData = await fetch(canvas.toDataURL('image/png')).then(
              (res) => res.arrayBuffer(),
            )

            image = await mergedPdf.embedPng(pngData)
          }

          // Calculate dimensions to fit image within A4 while maintaining aspect ratio
          const { width: imgWidth, height: imgHeight } = image
          const pageWidth = a4Page.getWidth()
          const pageHeight = a4Page.getHeight()

          // Calculate scaling factors
          const widthScale = pageWidth / imgWidth
          const heightScale = pageHeight / imgHeight

          // Use the smaller scaling factor to ensure the image fits
          const scale = Math.min(widthScale, heightScale) * 0.9 // 90% of the page to add margins

          // Calculate dimensions after scaling
          const scaledWidth = imgWidth * scale
          const scaledHeight = imgHeight * scale

          // Calculate position to center the image
          const x = (pageWidth - scaledWidth) / 2
          const y = (pageHeight - scaledHeight) / 2

          // Draw the image on the page
          a4Page.drawImage(image, {
            x,
            y,
            width: scaledWidth,
            height: scaledHeight,
          })

          // Apply rotation if needed
          const rotation = pageRotations[pageData.id] || 0
          if (rotation !== 0) {
            let pdfRotation
            // ✅ MAPEAMENTO COMPLETAMENTE INVERTIDO
            switch (rotation) {
              case 90:  // direita no CSS
                pdfRotation = degrees(90)   // direita no PDF
                break
              case 180: // baixo no CSS  
                pdfRotation = degrees(180) // baixo no PDF
                break
              case 270: // esquerda no CSS
                pdfRotation = degrees(270) // esquerda no PDF
                break
              default:
                pdfRotation = degrees(0)
            }
            a4Page.setRotation(pdfRotation)
          }
        } else {
          // Handle PDF file
          const arrayBuffer = await pageData.file.arrayBuffer()
          const pdf = await PDFDocument.load(arrayBuffer)
          const copiedPage = await mergedPdf.copyPages(pdf, [
            pageData.pageIndex,
          ])

          // Apply rotation if needed
          const rotation = pageRotations[pageData.id] || 0
          console.log('🔍 DEBUG - Página:', pageData.id, 'Rotação CSS:', rotation)
          if (rotation !== 0) {
            let pdfRotation
            // ✅ MAPEAMENTO COMPLETAMENTE INVERTIDO
            switch (rotation) {
              case 90:  // direita no CSS
                pdfRotation = degrees(90)   // direita no PDF
                break
              case 180: // baixo no CSS  
                pdfRotation = degrees(180) // baixo no PDF
                break
              case 270: // esquerda no CSS
                pdfRotation = degrees(270) // esquerda no PDF
                break
              default:
                pdfRotation = degrees(0)
            }
            console.log('🔍 DEBUG - Aplicando rotação PDF corrigida:', pdfRotation)
            copiedPage[0].setRotation(pdfRotation)
          }

          mergedPdf.addPage(copiedPage[0])
        }
      }

      setProgress(85)
      setProgressMessage('Processando hyperlinks...')

      const mergedPdfBytes = await mergedPdf.save()

      // Process hyperlinks WITHOUT compression
      const processedPdfBytes = await processHyperlinks(mergedPdfBytes, false, compressionLevel[0])

      setProgress(95)
      setProgressMessage('Finalizando documento...')

      const blob = new Blob([processedPdfBytes], { type: 'application/pdf' })

      setMergedPdfUrl(URL.createObjectURL(blob))
      setOriginalSizeMB((blob.size / (1024 * 1024)).toFixed(2))
      setCompressedBlob(null)
      setCompressedSizeMB(null)

      setProgress(100)
      setProgressMessage('Mesclagem concluída com hyperlinks processados!')

      // Aguardar um momento para mostrar 100% antes de esconder a barra
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      // Abrir modal de download
      setDownloadType('merged')
      setShowDownloadModal(true)
    } catch (error) {
      console.error('Erro ao mesclar arquivos:', error)
      alert(
        'Ocorreu um erro ao mesclar os arquivos. Por favor, tente novamente.',
      )
    } finally {
      setIsMerging(false)
      setIsLoading(false)
      setShowProgressBar(false) // Esconder barra de progresso ao finalizar
    }
  }

  const handleUploadAndCompress = async () => {
    if (!pages.length) {
      alert('Nenhuma página selecionada!')
      return
    }

    setCompressing(true)

    // Incrementar contador de uso
    incrementUsage()

    try {
      // Step 1: Create a merged PDF with both PDFs and images
      const mergedPdf = await PDFDocument.create()

      for (const pageData of pages) {
        if (pageData.isImage) {
          // Handle image file
          const imageBytes = await fetch(pageData.previewUrl).then((res) =>
            res.arrayBuffer(),
          )

          // Create a new page with appropriate dimensions
          let image
          let imagePage

          if (pageData.file.type === 'image/jpeg') {
            image = await mergedPdf.embedJpg(imageBytes)
          } else if (pageData.file.type === 'image/png') {
            image = await mergedPdf.embedPng(imageBytes)
          } else {
            // For other image types, convert to PNG first
            const img = new Image()
            await new Promise((resolve) => {
              img.onload = resolve
              img.src = pageData.previewUrl
            })

            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0)

            const pngData = await fetch(canvas.toDataURL('image/png')).then(
              (res) => res.arrayBuffer(),
            )

            image = await mergedPdf.embedPng(pngData)
          }

          // Create a page with the image dimensions
          const { width, height } = image
          imagePage = mergedPdf.addPage([width, height])

          // ✅ APLICAR ROTAÇÃO PARA IMAGENS
          const rotation = pageRotations[pageData.id] || 0
          console.log('🔍 DEBUG - Imagem (handleUploadAndCompress):', pageData.id, 'Rotação CSS:', rotation)
          if (rotation !== 0) {
            let pdfRotation
            // ✅ MAPEAMENTO COMPLETAMENTE INVERTIDO
            switch (rotation) {
              case 90:  // direita no CSS
                pdfRotation = degrees(90)   // direita no PDF
                break
              case 180: // baixo no CSS  
                pdfRotation = degrees(180) // baixo no PDF
                break
              case 270: // esquerda no CSS
                pdfRotation = degrees(270) // esquerda no PDF
                break
              default:
                pdfRotation = degrees(0)
            }
            console.log('🔍 DEBUG - Aplicando rotação PDF (imagem handleUploadAndCompress):', pdfRotation)
            imagePage.setRotation(pdfRotation)
          }

          // Draw the image on the page
          imagePage.drawImage(image, {
            x: 0,
            y: 0,
            width: width,
            height: height,
          })
        } else {
          // Handle PDF file
          const arrayBuffer = await pageData.file.arrayBuffer()
          const pdf = await PDFDocument.load(arrayBuffer)
          const copiedPage = await mergedPdf.copyPages(pdf, [
            pageData.pageIndex,
          ])

          // ✅ APLICAR ROTAÇÃO PARA PDFs
          const rotation = pageRotations[pageData.id] || 0
          console.log('🔍 DEBUG - PDF (handleUploadAndCompress):', pageData.id, 'Rotação CSS:', rotation)
          if (rotation !== 0) {
            let pdfRotation
            // ✅ MAPEAMENTO COMPLETAMENTE INVERTIDO
            switch (rotation) {
              case 90:  // direita no CSS
                pdfRotation = degrees(90)   // direita no PDF
                break
              case 180: // baixo no CSS  
                pdfRotation = degrees(180) // baixo no PDF
                break
              case 270: // esquerda no CSS
                pdfRotation = degrees(270) // esquerda no PDF
                break
              default:
                pdfRotation = degrees(0)
            }
            console.log('🔍 DEBUG - Aplicando rotação PDF corrigida (handleUploadAndCompress):', pdfRotation)
            copiedPage[0].setRotation(pdfRotation)
          }

          mergedPdf.addPage(copiedPage[0])
        }
      }

      const mergedPdfBytes = await mergedPdf.save()

      // NEW: Process hyperlinks first
      const processedPdfBytes = await processHyperlinks(mergedPdfBytes, true, compressionLevel[0])
      const processedBlob = new Blob([processedPdfBytes], {
        type: 'application/pdf',
      })

      // Calculate original size
      const originalSize = processedBlob.size
      const originalSizeMBValue = (originalSize / (1024 * 1024)).toFixed(2)
      setOriginalSizeMB(originalSizeMBValue)
      console.log('🔍 Original size set:', originalSizeMBValue, 'MB') // Add this debug line

      // Step 2: Send processed PDF for compression
      const formData = new FormData()
      formData.append('file', processedBlob, 'merged.pdf')
      formData.append('pageOrder', JSON.stringify(pages.map((p) => p.id)))
      formData.append('rotations', JSON.stringify(pageRotations))

      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Erro ao comprimir: ${response.statusText}`)
      }

      const compressedArrayBuffer = await response.arrayBuffer()
      const compressedBlob = new Blob([compressedArrayBuffer], {
        type: 'application/pdf',
      })

      // Calculate compressed size
      const compressedSize = compressedBlob.size
      const compressedSizeMBValue = (compressedSize / (1024 * 1024)).toFixed(2)
      setCompressedSizeMB(compressedSizeMBValue)
      console.log('🔍 Compressed size set:', compressedSizeMBValue, 'MB') // Add this debug line
      setCompressedBlob(compressedBlob)

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

  const convertPagesToImages = async (format: 'jpg' | 'png') => {
    if (!pages.length) {
      alert('No pages to convert!')
      return
    }

    try {
      setCompressing(true)
      setIsLoading(true)
      setShowProgressBar(true) // Mostrar barra de progresso para conversão
      setProgress(0)
      setProgressMessage(`Iniciando conversão para ${format.toUpperCase()}...`)

      // Incrementar contador de uso
      incrementUsage()

      setProgress(5)
      setProgressMessage('Carregando bibliotecas...')

      // Dynamically import JSZip
      const JSZipModule = await import('jszip')
      const JSZip = JSZipModule.default
      const zip = new JSZip()

      setProgress(10)
      setProgressMessage('Configurando parâmetros...')

      // Set image quality and mime type based on format
      const quality = format === 'jpg' ? 0.9 : 1.0
      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
      const fileExtension = format === 'jpg' ? 'jpg' : 'png'

      // Process each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]

        // Calcular progresso atual (distribuir 80% do progresso entre as páginas)
        const pageProgress = 10 + (i / pages.length) * 80
        setProgress(pageProgress)
        setProgressMessage(
          `Convertendo página ${i + 1} de ${
            pages.length
          } para ${format.toUpperCase()}...`,
        )

        let imageData

        if (page.isImage) {
          // For image pages, use the existing preview but apply rotation
          const img = new Image()
          await new Promise((resolve) => {
            img.onload = resolve
            img.src = page.previewUrl
          })

          // Create a canvas with the same dimensions
          const canvas = document.createElement('canvas')

          // Determine if we need to swap dimensions for 90/270 degree rotations
          const rotation = pageRotations[page.id] || 0
          const swapDimensions = rotation === 90 || rotation === 270

          canvas.width = swapDimensions ? img.height : img.width
          canvas.height = swapDimensions ? img.width : img.height

          const ctx = canvas.getContext('2d')
          ctx.save()

          // Apply rotation around the center
          ctx.translate(canvas.width / 2, canvas.height / 2)
          ctx.rotate((rotation * Math.PI) / 180)
          ctx.translate(-img.width / 2, -img.height / 2)

          // Draw the image
          ctx.drawImage(img, 0, 0)
          ctx.restore()

          // Get the image data
          imageData = canvas.toDataURL(mimeType, quality)
        } else {
          // For PDF pages, re-render at high resolution
          const arrayBuffer = await page.file.arrayBuffer()
          const pdf = await getDocument({ data: arrayBuffer }).promise
          const pdfPage = await pdf.getPage(page.pageIndex + 1)

          // Use a higher scale for better quality
          const scale = 2.0
          const viewport = pdfPage.getViewport({ scale })

          // Create a canvas with the right dimensions
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = viewport.width
          canvas.height = viewport.height

          // Render the PDF page to the canvas
          await pdfPage.render({
            canvasContext: ctx,
            viewport,
          }).promise

          // Apply rotation if needed
          if (pageRotations[page.id]) {
            const rotation = pageRotations[page.id]

            // Create a new canvas for the rotated image
            const rotatedCanvas = document.createElement('canvas')
            const rotatedCtx = rotatedCanvas.getContext('2d')

            // Swap dimensions for 90/270 degree rotations
            const swapDimensions = rotation === 90 || rotation === 270
            rotatedCanvas.width = swapDimensions ? canvas.height : canvas.width
            rotatedCanvas.height = swapDimensions ? canvas.width : canvas.height

            // Rotate around center
            rotatedCtx.translate(
              rotatedCanvas.width / 2,
              rotatedCanvas.height / 2,
            )
            rotatedCtx.rotate((rotation * Math.PI) / 180)
            rotatedCtx.drawImage(
              canvas,
              -canvas.width / 2,
              -canvas.height / 2,
              canvas.width,
              canvas.height,
            )

            // Use the rotated canvas
            imageData = rotatedCanvas.toDataURL(mimeType, quality)
          } else {
            // Use the original canvas
            imageData = canvas.toDataURL(mimeType, quality)
          }
        }

        // Convert base64 to binary
        const binary = atob(imageData.split(',')[1])
        const array = new Uint8Array(binary.length)
        for (let j = 0; j < binary.length; j++) {
          array[j] = binary.charCodeAt(j)
        }

        zip.file(
          `page-${String(i + 1).padStart(2, '0')}.${fileExtension}`,
          array,
          { binary: true },
        )
      }

      setProgress(90)
      setProgressMessage('Gerando arquivo ZIP...')

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipUrl = URL.createObjectURL(zipBlob)

      setProgress(95)
      setProgressMessage('Preparando download...')

      // Create download link
      const a = document.createElement('a')
      a.href = zipUrl
      a.download = `pdf_pages_as_${fileExtension}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Clean up
      URL.revokeObjectURL(zipUrl)

      setProgress(100)
      setProgressMessage(`Conversão para ${format.toUpperCase()} concluída!`)

      // Aguardar um momento para mostrar 100% antes de esconder a barra
      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log(
        `✅ Successfully converted ${
          pages.length
        } pages to ${format.toUpperCase()}`,
      )
    } catch (error) {
      console.error(`Error converting pages to ${format}:`, error)
      alert(
        `An error occurred while converting pages to ${format}. Please check the console for details.`,
      )
    } finally {
      setCompressing(false)
      setIsLoading(false)
      setShowProgressBar(false) // Esconder barra de progresso ao finalizar
    }
  }

  // Adicione esta nova função após a função handleUploadAndCompress
  const handleMergeAndCompress = async () => {
    if (!pages.length) {
      alert('Nenhuma página selecionada!')
      return
    }

    setCompressing(true)
    setIsLoading(true)
    setShowProgressBar(true)
    setProgress(0)
    setProgressMessage('Iniciando mesclagem e compressão...')

    // Incrementar contador de uso
    incrementUsage()

    try {
      // Step 1: Create a merged PDF with both PDFs and images
      setProgress(5)
      setProgressMessage('Mesclando páginas...')
      const mergedPdf = await PDFDocument.create()

      for (let i = 0; i < pages.length; i++) {
        const pageData = pages[i]

        // Update progress for merging (0-40%)
        const mergeProgress = 5 + (i / pages.length) * 35
        setProgress(mergeProgress)
        setProgressMessage(`Mesclando página ${i + 1} de ${pages.length}...`)

        if (pageData.isImage) {
          // Handle image file
          const imageBytes = await fetch(pageData.previewUrl).then((res) =>
            res.arrayBuffer(),
          )

          let image
          if (pageData.file.type === 'image/jpeg') {
            image = await mergedPdf.embedJpg(imageBytes)
          } else if (pageData.file.type === 'image/png') {
            image = await mergedPdf.embedPng(imageBytes)
          } else {
            // For other image types, convert to PNG first
            const img = new Image()
            await new Promise((resolve) => {
              img.onload = resolve
              img.src = pageData.previewUrl
            })

            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0)

            const pngData = await fetch(canvas.toDataURL('image/png')).then(
              (res) => res.arrayBuffer(),
            )

            image = await mergedPdf.embedPng(pngData)
          }

          // Create a page with the image dimensions
          const { width, height } = image
          const imagePage = mergedPdf.addPage([width, height])

          // ✅ APLICAR ROTAÇÃO PARA IMAGENS
          const rotation = pageRotations[pageData.id] || 0
          console.log('🔍 DEBUG - Imagem (handleMergeAndCompress):', pageData.id, 'Rotação CSS:', rotation)
          if (rotation !== 0) {
            let pdfRotation
            // ✅ MAPEAMENTO COMPLETAMENTE INVERTIDO
            switch (rotation) {
              case 90:  // direita no CSS
                pdfRotation = degrees(90)   // direita no PDF
                break
              case 180: // baixo no CSS  
                pdfRotation = degrees(180) // baixo no PDF
                break
              case 270: // esquerda no CSS
                pdfRotation = degrees(270) // esquerda no PDF
                break
              default:
                pdfRotation = degrees(0)
            }
            console.log('🔍 DEBUG - Aplicando rotação PDF (imagem handleMergeAndCompress):', pdfRotation)
            imagePage.setRotation(pdfRotation)
          }

          // Draw the image on the page
          imagePage.drawImage(image, {
            x: 0,
            y: 0,
            width: width,
            height: height,
          })
        } else {
          // Handle PDF file
          const arrayBuffer = await pageData.file.arrayBuffer()
          const pdf = await PDFDocument.load(arrayBuffer)
          const copiedPage = await mergedPdf.copyPages(pdf, [
            pageData.pageIndex,
          ])

          // ✅ APLICAR ROTAÇÃO PARA PDFs
          const rotation = pageRotations[pageData.id] || 0
          console.log('🔍 DEBUG - PDF (handleMergeAndCompress):', pageData.id, 'Rotação CSS:', rotation)
          if (rotation !== 0) {
            let pdfRotation
            // ✅ MAPEAMENTO COMPLETAMENTE INVERTIDO
            switch (rotation) {
              case 90:  // direita no CSS
                pdfRotation = degrees(90)   // direita no PDF
                break
              case 180: // baixo no CSS  
                pdfRotation = degrees(180) // baixo no PDF
                break
              case 270: // esquerda no CSS
                pdfRotation = degrees(270) // esquerda no PDF
                break
              default:
                pdfRotation = degrees(0)
            }
            console.log('🔍 DEBUG - Aplicando rotação PDF corrigida (handleMergeAndCompress):', pdfRotation)
            copiedPage[0].setRotation(pdfRotation)
          }

          mergedPdf.addPage(copiedPage[0])
        }
      }

      const mergedPdfBytes = await mergedPdf.save()

      // Calculate original size
      const originalSize = mergedPdfBytes.length
      const originalSizeMBValue = originalSize / (1024 * 1024)
      setOriginalSizeMB(originalSizeMBValue)
      console.log('🔍 Original size set:', originalSizeMBValue.toFixed(2), 'MB')

      setProgress(50)
      setProgressMessage('Enviando para compressão Python...')

      // Step 2: Send merged PDF to Python API for compression
      const formData = new FormData()
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
      formData.append('file', blob, 'merged.pdf')
      formData.append('compress', 'true')
      formData.append('compression_level', compressionLevel[0].toString())

      // Use hyperlinks API that handles compression
      const response = await fetch('/api/hyperlinks', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na compressão')
      }

      setProgress(90)
      setProgressMessage('Finalizando compressão...')
      const compressedArrayBuffer = await response.arrayBuffer()
      const compressedBlob = new Blob([compressedArrayBuffer], {
        type: 'application/pdf',
      })

      // Calculate compressed size
      const compressedSize = compressedBlob.size
      const compressedSizeMBValue = compressedSize / (1024 * 1024)
      setCompressedSizeMB(compressedSizeMBValue)
      console.log('🔍 Compressed size set:', compressedSizeMBValue.toFixed(2), 'MB')
      setCompressedBlob(compressedBlob)

      setProgress(100)
      setProgressMessage('Mesclagem e compressão concluídas!')

      // Wait a moment to show 100% before hiding progress bar
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      // Abrir modal de download
      setDownloadType('compressed')
      setShowDownloadModal(true)

      console.log('✅ PDF mesclado e comprimido com sucesso!')
    } catch (err) {
      console.error('❌ Falha ao mesclar e comprimir:', err)
      alert(`Erro ao mesclar e comprimir o PDF: ${err.message}`)
    } finally {
      setCompressing(false)
      setIsLoading(false)
      setShowProgressBar(false)
    }
  }

  // Modify the compressPdfClientSide function to use the state
  // Add hyperlink processing function
  const processHyperlinks = async (pdfBytes, shouldCompress = false, compressionLevel = 2) => {
    try {
      const formData = new FormData()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      formData.append('file', blob, 'document.pdf')
      formData.append('compress', shouldCompress.toString())
      formData.append('compression_level', compressionLevel.toString())
      formData.append('rotations', JSON.stringify(pageRotations))

      const response = await fetch('/api/hyperlinks', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        console.warn('Hyperlink processing failed, using original PDF')
        return pdfBytes
      }

      return await response.arrayBuffer()
    } catch (error) {
      console.warn('Hyperlink processing error, using original PDF:', error)
      return pdfBytes
    }
  }

  const compressPdfClientSide = async () => {
    if (pages.length === 0) {
      alert('Nenhuma página para comprimir')
      return
    }

    // Incrementar contador de uso
    incrementUsage()

    setCompressing(true)
    setIsLoading(true)
    setShowProgressBar(true)
    setProgress(0)
    setProgressMessage('Preparando compressão...')

    try {
      // Criar PDF temporário para calcular tamanho original
      const tempPdf = await PDFDocument.create()

      for (let i = 0; i < pages.length; i++) {
        const pageData = pages[i]
        setProgress(10 + (i / pages.length) * 30)
        setProgressMessage(
          `Calculando tamanho original... (${i + 1}/${pages.length})`,
        )

        if (pageData.isImage) {
          const imageBytes = await fetch(pageData.previewUrl).then((res) =>
            res.arrayBuffer(),
          )
          let image
          if (pageData.file.type === 'image/jpeg') {
            image = await tempPdf.embedJpg(imageBytes)
          } else if (pageData.file.type === 'image/png') {
            image = await tempPdf.embedPng(imageBytes)
          } else {
            const img = new Image()
            await new Promise((resolve) => {
              img.onload = resolve
              img.src = pageData.previewUrl
            })
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0)
            const pngData = await fetch(canvas.toDataURL('image/png')).then(
              (res) => res.arrayBuffer(),
            )
            image = await tempPdf.embedPng(pngData)
          }
          const { width, height } = image
          const imagePage = tempPdf.addPage([width, height])
          imagePage.drawImage(image, {
            x: 0,
            y: 0,
            width: width,
            height: height,
          })
        } else {
          const arrayBuffer = await pageData.file.arrayBuffer()
          const pdf = await PDFDocument.load(arrayBuffer)
          const copiedPage = await tempPdf.copyPages(pdf, [pageData.pageIndex])
          tempPdf.addPage(copiedPage[0])
        }
      }

      const tempPdfBytes = await tempPdf.save()
      const originalSizeBytes = tempPdfBytes.length
      const originalSizeMB = originalSizeBytes / (1024 * 1024)
      setOriginalSizeMB(parseFloat(originalSizeMB.toFixed(2)))

      console.log(
        'Tamanho original calculado:',
        originalSizeMB.toFixed(2),
        'MB',
      )

      // Criar FormData para enviar para a API Python
      const formData = new FormData()
      const blob = new Blob([tempPdfBytes], { type: 'application/pdf' })
      formData.append('file', blob, 'document.pdf')
      formData.append('compression_level', compressionLevel[0].toString()) // ADICIONAR ESTA LINHA

      setProgress(50)
      setProgressMessage('Comprimindo PDF...')

      // Enviar para a API de hyperlinks (que já faz compressão)
      const response = await fetch(
        '/api/hyperlinks',
        {
          method: 'POST',
          body: formData,
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na compressão')
      }

      const compressedArrayBuffer = await response.arrayBuffer()
      const compressedBlob = new Blob([compressedArrayBuffer], {
        type: 'application/pdf',
      })

      const compressedSizeBytes = compressedBlob.size
      const compressedSizeMB = compressedSizeBytes / (1024 * 1024)

      setCompressedBlob(compressedBlob)
      setCompressedSizeMB(compressedSizeMB.toFixed(2))

      console.log('Compressão concluída:', compressedSizeMB.toFixed(2), 'MB')
      setProgress(100)
      setProgressMessage('Compressão concluída!')

      // Aguardar um momento para mostrar 100% antes de esconder a barra
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      // Abrir modal de download
      setDownloadType('compressed')
      setShowDownloadModal(true)
    } catch (error) {
      console.error('Erro na compressão:', error)
      alert(`Erro ao comprimir PDF: ${error.message}`)
    } finally {
      setCompressing(false)
      setIsLoading(false)
      setShowProgressBar(false)
    }
  }

  return (
    <Card className='max-w-7xl mx-auto p-6  my-8'>
      <div className='w-full flex justify-between'>
        <h2 className='text-lg font-medium mb-4'>
          Páginas adicionadas ({pages.length})
        </h2>
      </div>

      <CardContent className='space-y-6'>
        <div className='flex gap-6'>
          {/* Área principal das páginas - Esquerda */}

          <div className='flex-1'>
            <div className='max-h-[600px] overflow-y-auto border rounded-md p-4 custom-scrollbar'>
              {isLoading ? (
                <div
                  className='w-full flex justify-center items-center'
                  style={{ minHeight: '300px' }}
                >
                  <Spin
                    progress={progress}
                    progressMessage={progressMessage}
                    showProgress={showProgressBar}
                  />
                </div>
              ) : (
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={pages.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className='flex justify-center items-center'>
                      {loadingPdfs || compressing || isMerging ? (
                        <div className='max-w-75 max-h-75'>
                          <Spin />
                        </div>
                      ) : (
                        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
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
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* Sidebar com botões - Direita */}
          <div className='w-80 space-y-4'>
            {/* Botão de upload */}
            <div className='flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50'>
              <label
                htmlFor='file-upload'
                className='flex flex-col items-center cursor-pointer space-y-2'
              >
                <UploadCloud
                  size={32}
                  className='text-gray-600 hover:text-gray-700 transition' // Alterado de text-blue-500 hover:text-blue-600
                />
                <span className='text-gray-700 font-medium text-sm text-center'> {/* Alterado de text-blue-600 */}
                  {loadingPdfs
                    ? 'Carregando arquivos...'
                    : 'Adicionar PDFs ou imagens'}
                </span>
              </label>
              <Input
                id='file-upload'
                type='file'
                multiple
                accept='application/pdf,image/jpeg,image/png,image/gif,image/webp'
                className='hidden'
                onChange={handleFileChange}
                disabled={loadingPdfs}
              />
            </div>

            {/* Slider de Compressão - Compacto */}
            {pages.length > 0 && (
              <div className='p-3 border rounded-lg bg-gray-50'>
                <Label className='text-sm font-medium'>
                  Nível de Compressão
                </Label>
                <div className='mt-2'>
                  <Slider
                    value={compressionLevel}
                    onValueChange={setCompressionLevel}
                    max={3}
                    min={1}
                    step={1}
                    className='w-full'
                  />
                </div>
                <TooltipProvider>
                  <div className='flex justify-between text-xs text-gray-500 mt-1'>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className='cursor-help hover:text-gray-700'>
                          Baixa
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Baixa compressão = Alta qualidade (arquivo maior)</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className='cursor-help hover:text-gray-700'>
                          Média
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Compressão média = Qualidade equilibrada</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className='cursor-help hover:text-gray-700'>
                          Alta
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Alta compressão = Baixa qualidade (arquivo menor)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
                <div className='text-center mt-2'>
                  <div
                    className={`text-sm font-medium ${
                      getCompressionDescription(compressionLevel[0]).color
                    }`}
                  >
                    {getCompressionDescription(compressionLevel[0]).name}
                  </div>
                </div>
              </div>
            )}

            {/* Botões de ação em grid 2x2 */}
            <div className='grid grid-cols-2 gap-3'>
              <ActionButton
                icon={<FilePlus size={24} />}
                label='Mesclar'
                onClick={handleMergePDFs}
                disabled={!pages.length || isMerging}
                color='gray' // Alterado de 'green'
                size='medium'
              />
              <ActionButton
                icon={<FilePlus size={24} />}
                label='Mesclar e Comprimir'
                onClick={handleMergeAndCompress}
                disabled={!pages.length || compressing || isMerging}
                color='gray' // Alterado de 'purple'
                size='medium'
              />
              <ActionButton
                icon={<Shrink size={24} />}
                label='Comprimir'
                onClick={compressPdfClientSide}
                disabled={!pages.length || compressing || isMerging}
                color='gray' // Alterado de 'yellow'
                size='medium'
              />
              <ActionButton
                icon={<Trash2 size={24} />}
                label='Deletar Tudo'
                onClick={() => {
                  // Limpar todos os estados relacionados aos PDFs
                  // Revogar URLs de objetos para liberar memória
                  pages.forEach((page) => {
                    if (page.isImage) {
                      URL.revokeObjectURL(page.previewUrl)
                    }
                  })

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

                  if (mergedPdfUrl) {
                    URL.revokeObjectURL(mergedPdfUrl)
                  }
                }}
                disabled={!pages.length}
                color='gray'
                size='medium'
              />
            </div>

            {/* Botões de rotação (quando página selecionada) */}
            {selectedPageId && (
              <div className='grid grid-cols-2 gap-3'>
                <ActionButton
                  icon={<RotateCcw size={24} />}
                  label='Girar ←'
                  onClick={() => rotateSelectedPage('left')}
                  color='gray' // Alterado de 'indigo'
                  size='medium'
                />
                <ActionButton
                  icon={<RotateCw size={24} />}
                  label='Girar →'
                  onClick={() => rotateSelectedPage('right')}
                  color='gray' // Alterado de 'indigo'
                  size='medium'
                />
              </div>
            )}

            {/* Botões de exportação */}
            <div className='grid grid-cols-2 gap-3'>
              <ActionButton
                icon={
                  <div className='relative'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='24'
                      height='24'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                      <circle cx='8.5' cy='8.5' r='1.5' />
                      <polyline points='21 15 16 10 5 21' />
                    </svg>
                    <div className='absolute bottom-0 right-0 bg-gray-600 text-white text-xs font-bold px-1 rounded'> {/* Alterado de bg-orange-500 */}
                      JPG
                    </div>
                  </div>
                }
                label='Exportar JPG'
                onClick={() => convertPagesToImages('jpg')}
                disabled={!pages.length || compressing}
                color='gray' // Alterado de 'orange'
                size='medium'
              />
              <ActionButton
                icon={
                  <div className='relative'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='24'
                      height='24'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                      <circle cx='8.5' cy='8.5' r='1.5' />
                      <polyline points='21 15 16 10 5 21' />
                    </svg>
                    <div className='absolute bottom-0 right-0 bg-gray-600 text-white text-xs font-bold px-1 rounded'>
                      PNG
                    </div>
                  </div>
                }
                label='Exportar PNG'
                onClick={() => convertPagesToImages('png')}
                disabled={!pages.length || compressing}
                color='gray' // Alterado de 'blue'
                
                size='medium'
              />
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Modal de Download */}
      <Dialog open={showDownloadModal} onOpenChange={closeDownloadModal}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-center">
              <Download className="h-5 w-5" />
              <span>
                {downloadType === 'merged' ? 'PDF Mesclado Pronto!' : 'PDF Comprimido Pronto!'}
              </span>
            </DialogTitle>
            <DialogDescription className="text-center">
              {downloadType === 'merged' 
                ? 'Seu PDF foi mesclado com sucesso!' 
                : 'Seu PDF foi comprimido com sucesso!'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Informações de compressão */}
          {originalSizeMB && originalSizeMB > 0 && (
            <div className='text-center text-sm p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border'> {/* Alterado de from-blue-50 to-green-50 */}
              <div className="space-y-2">
                <p className="text-gray-700">
                  <strong>Tamanho Original:</strong>{' '}
                  <span className="text-gray-800 font-semibold"> {/* Alterado de text-blue-600 */}
                    {typeof originalSizeMB === 'number'
                      ? originalSizeMB.toFixed(2)
                      : parseFloat(originalSizeMB).toFixed(2)}{' '}
                    MB
                  </span>
                </p>
                {compressedSizeMB && compressedSizeMB > 0 && (
                  <>
                    <p className="text-gray-700">
                      <strong>Tamanho Final:</strong>{' '}
                      <span className="text-gray-900 font-semibold"> {/* Alterado de text-green-600 */}
                        {typeof compressedSizeMB === 'number'
                          ? compressedSizeMB.toFixed(2)
                          : parseFloat(compressedSizeMB).toFixed(2)}{' '}
                        MB
                      </span>
                    </p>
                    <div className=' p-3 rounded-lg'>
                      <p className='text-gray-800 font-bold text-lg'> {/* Alterado de text-green-800 */}
                        🎉 Redução de {(
                          (1 -
                            (typeof compressedSizeMB === 'number'
                              ? compressedSizeMB
                              : parseFloat(compressedSizeMB)) /
                              (typeof originalSizeMB === 'number'
                                ? originalSizeMB
                                : parseFloat(originalSizeMB))) *
                          100
                        ).toFixed(2)}%
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {/* Botão de download para PDF mesclado */}
            {mergedPdfUrl && downloadType === 'merged' && (
              <a
                href={mergedPdfUrl}
                download='pdf_mesclado.pdf'
                className='w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-4 px-6 rounded-lg flex items-center justify-between transition-all duration-200 shadow-lg hover:shadow-xl' // Alterado de bg-purple-600 hover:bg-purple-700
              >
                <span className="text-lg">Baixar PDF Mesclado</span>
                <Download size={24} />
              </a>
            )}
            
            {/* Botão de download para PDF comprimido */}
            {compressedBlob && downloadType === 'compressed' && (
              <button
                onClick={() => {
                  const url = URL.createObjectURL(compressedBlob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'pdf_comprimido.pdf'
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                }}
                className='w-full bg-black hover:bg-gray-800 text-white font-medium py-4 px-6 rounded-lg flex items-center justify-between transition-all duration-200 shadow-lg hover:shadow-xl' // Alterado de bg-green-600 hover:bg-green-700
              >
                <span className="text-lg">Baixar PDF Comprimido</span>
                <Download size={24} />
              </button>
            )}
            
     
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
