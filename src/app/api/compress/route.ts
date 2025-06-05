import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { PDFDocument, degrees } from 'pdf-lib'

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
    if (!fs.existsSync(inputPath)) {
      reject(new Error(`Arquivo de entrada não encontrado: ${inputPath}`))
      return
    }

    const inputStats = fs.statSync(inputPath)
    console.log(`📊 Arquivo original: ${(inputStats.size / 1024 / 1024).toFixed(2)} MB`)

    // Estratégia adaptativa baseada no tamanho do arquivo
    let strategy = 'balanced'
    if (inputStats.size > 50 * 1024 * 1024) {
      strategy = 'large'
    } else if (inputStats.size < 5 * 1024 * 1024) {
      strategy = 'small'
    }

    // Configurações específicas para cada estratégia
    let gsArgs = []
    
    switch (strategy) {
      case 'large':
        // Para arquivos grandes: foco em downsampling de imagens
        gsArgs = [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          '-dPDFSETTINGS=/ebook',
          '-dNOPAUSE', '-dQUIET', '-dBATCH', '-dSAFER',
          
          // Otimização de imagens mais agressiva
          '-dDownsampleColorImages=true',
          '-dColorImageResolution=150',
          '-dDownsampleGrayImages=true',
          '-dGrayImageResolution=150',
          
          // Permitir que o Ghostscript escolha o melhor filtro
          '-dAutoFilterColorImages=true',
          '-dAutoFilterGrayImages=true',
          
          // Otimizações gerais
          '-dOptimize=true',
          '-dCompressFonts=true',
          '-dEmbedAllFonts=true',
          '-dSubsetFonts=true',
          
          `-sOutputFile=${outputPath}`,
          inputPath
        ]
        break;
        
      case 'small':
        // Para arquivos pequenos: compressão mais agressiva
        gsArgs = [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          '-dPDFSETTINGS=/screen',
          '-dNOPAUSE', '-dQUIET', '-dBATCH', '-dSAFER',
          
          // Compressão mais agressiva para arquivos pequenos
          '-dDownsampleColorImages=true',
          '-dColorImageResolution=96',
          '-dDownsampleGrayImages=true',
          '-dGrayImageResolution=96',
          
          // Compressão JPEG com qualidade mais baixa
          '-dAutoFilterColorImages=false',
          '-dAutoFilterGrayImages=false',
          '-dColorImageFilter=/DCTEncode',
          '-dGrayImageFilter=/DCTEncode',
          '-dColorImageDict=<</QFactor 0.5>>',
          '-dGrayImageDict=<</QFactor 0.5>>',
          
          '-dOptimize=true',
          
          `-sOutputFile=${outputPath}`,
          inputPath
        ]
        break;
        
      default: // 'balanced'
        // Configuração equilibrada para a maioria dos arquivos
        gsArgs = [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          '-dPDFSETTINGS=/ebook',
          '-dNOPAUSE', '-dQUIET', '-dBATCH', '-dSAFER',
          
          // Downsampling moderado
          '-dDownsampleColorImages=true',
          '-dColorImageResolution=150',
          '-dDownsampleGrayImages=true',
          '-dGrayImageResolution=150',
          
          // Deixar o Ghostscript decidir o melhor filtro
          '-dAutoFilterColorImages=true',
          '-dAutoFilterGrayImages=true',
          
          // Otimizações gerais
          '-dOptimize=true',
          '-dDetectDuplicateImages=true',
          
          `-sOutputFile=${outputPath}`,
          inputPath
        ]
    }

    console.log(`🔧 Executando Ghostscript com estratégia: ${strategy}`)

    const gs = spawn('gs', gsArgs)

    let stderrOutput = ''
    gs.stderr?.on('data', (data) => {
      stderrOutput += data.toString()
    })

    gs.on('exit', (code) => {
      console.log(`📤 Ghostscript finalizado com código: ${code}`)
      
      if (stderrOutput && stderrOutput.trim()) {
        console.log('Ghostscript stderr:', stderrOutput)
      }

      if (code === 0) {
        if (fs.existsSync(outputPath)) {
          const outputStats = fs.statSync(outputPath)
          
          // Verificar se o arquivo realmente foi comprimido
          if (outputStats.size >= inputStats.size) {
            console.log(`⚠️ Primeira estratégia não comprimiu. Tentando alternativa...`)
            
            // Tentar estratégia alternativa
            return runGhostscriptAlternative(inputPath, outputPath)
              .then(resolve)
              .catch(err => {
                console.log(`⚠️ Alternativa falhou, usando original: ${err.message}`)
                fs.copyFileSync(inputPath, outputPath)
                resolve();
              });
          } else {
            const compressionRatio = ((inputStats.size - outputStats.size) / inputStats.size * 100).toFixed(1)
            console.log(`✅ Compressão concluída: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB (${compressionRatio}% redução)`)
            resolve()
          }
        } else {
          reject(new Error('Arquivo de saída não foi criado'))
        }
      } else {
        reject(new Error(`GhostScript finalizado com código ${code}`))
      }
    })

    gs.on('error', (error) => {
      reject(new Error(`Erro ao executar GhostScript: ${error.message}`))
    })

    setTimeout(() => {
      gs.kill('SIGTERM')
      reject(new Error('Timeout na compressão do PDF'))
    }, 180000) // 3 minutos para arquivos grandes
  })
}

// Estratégia alternativa que tenta uma abordagem diferente
function runGhostscriptAlternative(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Abordagem minimalista que geralmente funciona bem para PDFs problemáticos
    const gsArgs = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dNOPAUSE', '-dQUIET', '-dBATCH', '-dSAFER',
      
      // Apenas otimização básica sem recompressão de imagens
      '-dOptimize=true',
      '-dCompressFonts=true',
      '-dEmbedAllFonts=true',
      '-dSubsetFonts=true',
      
      // Sem downsampling ou recompressão de imagens
      '-dDownsampleColorImages=false',
      '-dDownsampleGrayImages=false',
      '-dAutoFilterColorImages=false',
      '-dAutoFilterGrayImages=false',
      
      // Preservar estrutura do documento
      '-dPreserveAnnots=true',
      '-dPreserveMarkedContent=true',
      
      `-sOutputFile=${outputPath}`,
      inputPath
    ]

    console.log('🔄 Tentando estratégia alternativa (sem recompressão de imagens)...')

    const gs = spawn('gs', gsArgs)
    
    gs.on('exit', (code) => {
      if (code === 0) {
        const inputStats = fs.statSync(inputPath)
        const outputStats = fs.statSync(outputPath)
        
        if (outputStats.size < inputStats.size) {
          const ratio = ((inputStats.size - outputStats.size) / inputStats.size * 100).toFixed(1)
          console.log(`✅ Compressão alternativa concluída: ${ratio}% redução`)
          resolve()
        } else {
          reject(new Error('Compressão alternativa não reduziu o tamanho'))
        }
      } else {
        reject(new Error(`Código ${code}`))
      }
    })
    
    gs.on('error', reject)
    
    setTimeout(() => {
      gs.kill('SIGTERM')
      reject(new Error('Timeout na compressão alternativa'))
    }, 120000) // 2 minutos
  })
}
