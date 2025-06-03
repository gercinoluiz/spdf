import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { PDFDocument, degrees } from 'pdf-lib'
/**
 * Handles the POST request for PDF compression and optional rotation.
 * 
 * @param req - The incoming HTTP request containing form data with PDF file, optional rotations, and page order
 * @returns A NextResponse with either the compressed PDF or an error message
 * 
 * @throws {Error} If file processing fails or Ghostscript compression encounters issues
 */export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File // Receives only one merged file
    const rotationsJson = formData.get('rotations') as string
    const pageOrderJson = formData.get('pageOrder') as string
    const pageOrder: string[] = pageOrderJson ? JSON.parse(pageOrderJson) : []

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' }, // No file sent
        { status: 400 },
      )
    }

    const tempFolder = path.join(process.cwd(), 'public')
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder)
    }

    // Save the received PDF temporarily
    const arrayBuffer = await file.arrayBuffer()
    const tempInputPath = path.join(tempFolder, `input_${Date.now()}.pdf`)
    fs.writeFileSync(tempInputPath, Buffer.from(arrayBuffer))

    console.log('📥 PDF recebido salvo:', tempInputPath) // PDF received saved

    const tempCompressedPath = path.join(
      tempFolder,
      `compressed_${Date.now()}.pdf`,
    )

    // Compress the PDF
    await runGhostscript(tempInputPath, tempCompressedPath)

    let finalPdfBuffer

    // If we have rotation data, apply it after compression
    if (rotationsJson) {
      try {
        const rotations = JSON.parse(rotationsJson)
        const tempRotatedPath = path.join(
          tempFolder,
          `rotated_${Date.now()}.pdf`,
        )

        // Apply rotations to the compressed PDF
        const compressedBuffer = fs.readFileSync(tempCompressedPath)
        const pdfDoc = await PDFDocument.load(compressedBuffer)

        // Apply rotations to each page
        const pages = pdfDoc.getPages()

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i]
          const pageId = pageOrder[i] // <- now the rotation matches the correct order
          const rotation = rotations[pageId] || 0

          if (rotation !== 0) {
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

            page.setRotation(pdfRotation)
          }
        }

        // Save the PDF with applied rotations
        const rotatedPdfBytes = await pdfDoc.save()
        fs.writeFileSync(tempRotatedPath, Buffer.from(rotatedPdfBytes))

        finalPdfBuffer = fs.readFileSync(tempRotatedPath)

        // Clean up additional temporary file
        fs.unlinkSync(tempRotatedPath)
      } catch (rotationError) {
        console.error('Erro ao aplicar rotações:', rotationError) // Error applying rotations
        // In case of rotation errors, use the compressed PDF only
        finalPdfBuffer = fs.readFileSync(tempCompressedPath)
      }
    } else {
      finalPdfBuffer = fs.readFileSync(tempCompressedPath)
    }

    console.log('📦 Processamento finalizado!') // Processing finished

    // Clean up temporary files
    fs.unlinkSync(tempInputPath)
    fs.unlinkSync(tempCompressedPath)

    return new Response(finalPdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    console.error('Erro durante processamento:', error) // Error during processing
    return NextResponse.json(
      { error: 'Falha ao processar PDF' }, // Failed to process PDF
      { status: 500 },
    )
  }
}
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File // Receives only one merged file
    const rotationsJson = formData.get('rotations') as string
    const pageOrderJson = formData.get('pageOrder') as string
    const pageOrder: string[] = pageOrderJson ? JSON.parse(pageOrderJson) : []

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' }, // No file sent
        { status: 400 },
      )
    }

    const tempFolder = path.join(process.cwd(), 'public')
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder)
    }

    // Save the received PDF temporarily
    const arrayBuffer = await file.arrayBuffer()
    const tempInputPath = path.join(tempFolder, `input_${Date.now()}.pdf`)
    fs.writeFileSync(tempInputPath, Buffer.from(arrayBuffer))

    console.log('📥 PDF recebido salvo:', tempInputPath) // PDF received saved

    const tempCompressedPath = path.join(
      tempFolder,
      `compressed_${Date.now()}.pdf`,
    )

    // Compress the PDF
    await runGhostscript(tempInputPath, tempCompressedPath)

    let finalPdfBuffer

    // If we have rotation data, apply it after compression
    if (rotationsJson) {
      try {
        const rotations = JSON.parse(rotationsJson)
        const tempRotatedPath = path.join(
          tempFolder,
          `rotated_${Date.now()}.pdf`,
        )

        // Apply rotations to the compressed PDF
        const compressedBuffer = fs.readFileSync(tempCompressedPath)
        const pdfDoc = await PDFDocument.load(compressedBuffer)

        // Apply rotations to each page
        const pages = pdfDoc.getPages()

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i]
          const pageId = pageOrder[i] // <- now the rotation matches the correct order
          const rotation = rotations[pageId] || 0

          if (rotation !== 0) {
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

            page.setRotation(pdfRotation)
          }
        }

        // Save the PDF with applied rotations
        const rotatedPdfBytes = await pdfDoc.save()
        fs.writeFileSync(tempRotatedPath, Buffer.from(rotatedPdfBytes))

        finalPdfBuffer = fs.readFileSync(tempRotatedPath)

        // Clean up additional temporary file
        fs.unlinkSync(tempRotatedPath)
      } catch (rotationError) {
        console.error('Erro ao aplicar rotações:', rotationError) // Error applying rotations
        // In case of rotation errors, use the compressed PDF only
        finalPdfBuffer = fs.readFileSync(tempCompressedPath)
      }
    } else {
      finalPdfBuffer = fs.readFileSync(tempCompressedPath)
    }

    console.log('📦 Processamento finalizado!') // Processing finished

    // Clean up temporary files
    fs.unlinkSync(tempInputPath)
    fs.unlinkSync(tempCompressedPath)

    return new Response(finalPdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    console.error('Erro durante processamento:', error) // Error during processing
    return NextResponse.json(
      { error: 'Falha ao processar PDF' }, // Failed to process PDF
      { status: 500 },
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File // Recebe apenas um arquivo já mesclado
    const rotationsJson = formData.get('rotations') as string
    const pageOrderJson = formData.get('pageOrder') as string
    const pageOrder: string[] = pageOrderJson ? JSON.parse(pageOrderJson) : []

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 },
      )
    }

    const tempFolder = path.join(process.cwd(), 'public')
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder)
    }

    // Salva o PDF recebido temporariamente
    const arrayBuffer = await file.arrayBuffer()
    const tempInputPath = path.join(tempFolder, `input_${Date.now()}.pdf`)
    fs.writeFileSync(tempInputPath, Buffer.from(arrayBuffer))

    console.log('📥 PDF recebido salvo:', tempInputPath)

    const tempCompressedPath = path.join(
      tempFolder,
      `compressed_${Date.now()}.pdf`,
    )

    // Comprime o PDF
    await runGhostscript(tempInputPath, tempCompressedPath)

    let finalPdfBuffer

    // Se temos dados de rotação, aplicamos após a compressão
    if (rotationsJson) {
      try {
        const rotations = JSON.parse(rotationsJson)
        const tempRotatedPath = path.join(
          tempFolder,
          `rotated_${Date.now()}.pdf`,
        )

        // Aplicar rotações ao PDF comprimido
        const compressedBuffer = fs.readFileSync(tempCompressedPath)
        const pdfDoc = await PDFDocument.load(compressedBuffer)

        // Aplicar rotações a cada página
        const pages = pdfDoc.getPages()

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i]
          const pageId = pageOrder[i] // <- agora a rotação corresponde à ordem correta
          const rotation = rotations[pageId] || 0

          if (rotation !== 0) {
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

            page.setRotation(pdfRotation)
          }
        }

        // Salvar o PDF com rotações aplicadas
        const rotatedPdfBytes = await pdfDoc.save()
        fs.writeFileSync(tempRotatedPath, Buffer.from(rotatedPdfBytes))

        finalPdfBuffer = fs.readFileSync(tempRotatedPath)

        // Limpar arquivo temporário adicional
        fs.unlinkSync(tempRotatedPath)
      } catch (rotationError) {
        console.error('Erro ao aplicar rotações:', rotationError)
        // Em caso de erro nas rotações, usar o PDF apenas comprimido
        finalPdfBuffer = fs.readFileSync(tempCompressedPath)
      }
    } else {
      finalPdfBuffer = fs.readFileSync(tempCompressedPath)
    }

    console.log('📦 Processamento finalizado!')

    // Limpa os temporários
    fs.unlinkSync(tempInputPath)
    fs.unlinkSync(tempCompressedPath)

    return new Response(finalPdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    console.error('Erro durante processamento:', error)
    return NextResponse.json(
      { error: 'Falha ao processar PDF' },
      { status: 500 },
    )
  }
}

function runGhostscript(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const gs = spawn('gs', [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/screen',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dDetectDuplicateImages=true',
      '-dOptimize=true',
      '-dPrinted=false',
      '-dPDFFitPage',
      `-sOutputFile=${outputPath}`,
      inputPath,
    ])

    gs.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`GhostScript finalizado com código ${code}`))
    })
  })
}
