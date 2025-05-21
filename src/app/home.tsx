/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @next/next/no-img-element */

'use client'

import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
// Configura o worker do PDF.js corretamente via CDN
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

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

function SortableThumbnail({ id, previewUrl }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className='cursor-move'
    >
      <Image
        src={previewUrl}
        alt='PDF page preview'
        className='rounded border w-full'
      />
    </div>
  )
}

export default function Home() {
  const [files, setFiles] = useState([])
  const [pages, setPages] = useState([])
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null)
  const handleFileChange = async (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles((prev) => [...prev, ...newFiles])

    const newPages = []

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i]
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await getDocument({ data: arrayBuffer }).promise
      for (let j = 0; j < pdf.numPages; j++) {
        const page = await pdf.getPage(j + 1)
        const viewport = page.getViewport({ scale: 1 })

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({ canvasContext: context, viewport }).promise

        const previewUrl = canvas.toDataURL()
        newPages.push({
          id: `${file.name}-page-${j}`,
          file,
          fileIndex: i,
          pageIndex: j,
          previewUrl,
        })
      }
    }

    setPages((prev) => [...prev, ...newPages])
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
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
    const url = URL.createObjectURL(blob)
    setMergedPdfUrl(url)
  }

  return (
    <Card className='max-w-5xl mx-auto mt-10 p-6 space-y-6'>
      <CardContent className='space-y-4'>
        <h1 className='text-2xl font-bold'>📄 Organizador de PDFs</h1>

        <div className='space-y-2'>
          <Label htmlFor='file-upload'>Selecione arquivos PDF</Label>
          <Input
            id='file-upload'
            type='file'
            multiple
            accept='application/pdf'
            onChange={handleFileChange}
          />
        </div>

        {pages.length > 0 && (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pages.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {pages.map((page) => (
                  <SortableThumbnail
                    key={page.id}
                    id={page.id}
                    previewUrl={page.previewUrl}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <Button onClick={mergePDFs} disabled={!pages.length} className='w-full'>
          Mesclar PDFs na ordem atual
        </Button>

        {mergedPdfUrl && (
          <a
            href={mergedPdfUrl}
            download='merged.pdf'
            className='block text-center mt-4 text-blue-600 underline'
          >
            📥 Baixar PDF Final
          </a>
        )}
      </CardContent>
    </Card>
  )
}
