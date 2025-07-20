import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const compress = formData.get('compress') as string; // ✅ Obter parâmetro compress
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Criar FormData para enviar ao Python
    const pythonFormData = new FormData();
    pythonFormData.append('file', file);
    pythonFormData.append('compress', compress || 'true'); // ✅ Passar parâmetro compress

    // Chamar o serviço Python
    const pythonResponse = await fetch('http://localhost:5001/process-hyperlinks', {
      method: 'POST',
      body: pythonFormData,
    });

    if (!pythonResponse.ok) {
      throw new Error(`Python service error: ${pythonResponse.statusText}`);
    }

    // Retornar o PDF processado
    const processedPdf = await pythonResponse.arrayBuffer();
    
    return new NextResponse(processedPdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="processed.pdf"',
      },
    });
  } catch (error) {
    console.error('Error processing hyperlinks:', error);
    return NextResponse.json(
      { error: 'Failed to process hyperlinks' },
      { status: 500 }
    );
  }
}