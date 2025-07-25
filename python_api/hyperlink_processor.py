from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
import io
import re
import requests
from urllib.parse import urlparse

app = Flask(__name__)
# Configurar CORS para permitir requisições do frontend
CORS(app, origins=["http://localhost:3000", "http://localhost:3001"])

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "hyperlink-processor"})

# Nova rota para compressão simples
@app.route('/compress', methods=['POST'])
def compress_pdf():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Ler o PDF
        pdf_bytes = file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        print(f"📥 PDF recebido: {len(pdf_bytes) / 1024 / 1024:.2f} MB")
        
        # Comprimir o PDF
        compressed_doc = compress_pdf_simple(doc)
        
        # Salvar em buffer
        output_buffer = io.BytesIO()
        compressed_doc.save(output_buffer)
        output_buffer.seek(0)
        
        compressed_size = len(output_buffer.getvalue())
        compression_ratio = ((len(pdf_bytes) - compressed_size) / len(pdf_bytes) * 100)
        
        print(f"✅ PDF comprimido: {compressed_size / 1024 / 1024:.2f} MB ({compression_ratio:.1f}% redução)")
        
        doc.close()
        compressed_doc.close()
        
        return send_file(
            output_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='compressed.pdf'
        )
        
    except Exception as e:
        print(f"❌ Erro na compressão: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/process-hyperlinks', methods=['POST'])
def process_hyperlinks():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # ✅ Novo parâmetro para controlar compressão
        should_compress = request.form.get('compress', 'true').lower() == 'true'
        
        # Ler o PDF
        pdf_bytes = file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        print(f"📥 PDF recebido: {len(pdf_bytes) / 1024 / 1024:.2f} MB")
        print(f"🔧 Compressão: {'Ativada' if should_compress else 'Desativada'}")
        
        # Processar hyperlinks em cada página
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Remover links inválidos
            links = page.get_links()
            for link in links:
                if link.get('uri'):
                    uri = link['uri']
                    if not is_valid_url(uri):
                        page.delete_link(link)
            
            # Procurar por texto que parece URL e criar links
            text_instances = page.search_for(r'https?://[^\s]+', flags=fitz.TEXT_PRESERVE_WHITESPACE)
            for inst in text_instances:
                url_text = page.get_textbox(inst).strip()
                if is_valid_url(url_text):
                    link_dict = {
                        "kind": fitz.LINK_URI,
                        "from": inst,
                        "uri": url_text
                    }
                    page.insert_link(link_dict)
        
        # ✅ Decidir se deve comprimir ou apenas processar hyperlinks
        if should_compress:
            processed_doc = compress_pdf_with_links(doc)
        else:
            processed_doc = process_hyperlinks_only(doc)
        
        # Salvar em buffer
        output_buffer = io.BytesIO()
        processed_doc.save(output_buffer)
        output_buffer.seek(0)
        
        final_size = len(output_buffer.getvalue())
        print(f"✅ PDF processado: {final_size / 1024 / 1024:.2f} MB")
        
        doc.close()
        processed_doc.close()
        
        return send_file(
            output_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='processed_with_links.pdf'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def compress_pdf_simple(doc):
    """Comprime PDF de forma simples e eficiente"""
    # Criar novo documento comprimido
    compressed_doc = fitz.open()
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Obter links e anotações
        links = page.get_links()
        annots = []
        for annot in page.annots():
            annots.append(annot)
        
        # Criar nova página
        new_page = compressed_doc.new_page(width=page.rect.width, height=page.rect.height)
        
        # Renderizar página com compressão REAL
        # Usar matriz de escala MENOR para reduzir tamanho
        matrix = fitz.Matrix(0.7, 0.7)  # ✅ Escala 0.7x para REDUZIR tamanho
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        
        # Comprimir como JPEG com qualidade baixa para máxima compressão
        img_data = pix.tobytes("jpeg", jpg_quality=50)  # ✅ Qualidade 50 ao invés de 75
        
        # Inserir imagem comprimida
        img_rect = fitz.Rect(0, 0, page.rect.width, page.rect.height)
        new_page.insert_image(img_rect, stream=img_data)
        
        # Restaurar links
        for link in links:
            new_page.insert_link(link)
        
        # Restaurar anotações básicas
        for annot in annots:
            try:
                # Copiar anotações simples (texto, highlight, etc.)
                if annot.type[1] in ['Text', 'Highlight', 'Underline', 'StrikeOut']:
                    new_annot = new_page.add_text_annot(annot.rect.tl, annot.info.get('content', ''))
                    new_annot.set_info(annot.info)
            except:
                # Ignorar anotações que não podem ser copiadas
                pass
    
    return compressed_doc

def compress_pdf_with_links(doc):
    """Comprime PDF preservando hyperlinks"""
    # Criar novo documento comprimido
    compressed_doc = fitz.open()
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Obter links antes da compressão
        links = page.get_links()
        
        # Criar nova página com compressão
        new_page = compressed_doc.new_page(width=page.rect.width, height=page.rect.height)
        
        # Renderizar página com compressão de imagem
        pix = page.get_pixmap(matrix=fitz.Matrix(1.0, 1.0), alpha=False)
        
        # Comprimir imagem (reduzir qualidade para diminuir tamanho)
        img_data = pix.tobytes("jpeg", jpg_quality=70)
        
        # Inserir imagem comprimida
        img_rect = fitz.Rect(0, 0, page.rect.width, page.rect.height)
        new_page.insert_image(img_rect, stream=img_data)
        
        # Restaurar todos os links
        for link in links:
            new_page.insert_link(link)
        
        # Copiar texto (para pesquisa)
        text_dict = page.get_text("dict")
        # Note: Inserir texto pode ser complexo, por isso mantemos a abordagem de imagem
    
    return compressed_doc

# ✅ Nova função para processar hyperlinks SEM compressão
def process_hyperlinks_only(doc):
    """Processa hyperlinks sem compressão - mantém qualidade original"""
    processed_doc = fitz.open()
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Obter links e anotações
        links = page.get_links()
        annots = []
        for annot in page.annots():
            annots.append(annot)
        
        # Criar nova página mantendo dimensões originais
        new_page = processed_doc.new_page(width=page.rect.width, height=page.rect.height)
        
        # ✅ Copiar conteúdo da página SEM compressão
        new_page.show_pdf_page(page.rect, doc, page_num)
        
        # Restaurar todos os links
        for link in links:
            new_page.insert_link(link)
        
        # Restaurar anotações
        for annot in annots:
            try:
                if annot.type[1] in ['Text', 'Highlight', 'Underline', 'StrikeOut']:
                    new_annot = new_page.add_text_annot(annot.rect.tl, annot.info.get('content', ''))
                    new_annot.set_info(annot.info)
            except:
                pass
    
    return processed_doc

def is_valid_url(url):
    """Verifica se a URL é válida"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

# Add new route for configurable compression
@app.route('/compress-configurable', methods=['POST'])
def compress_pdf_configurable():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Get compression level from form data (1=high, 2=medium, 3=low)
        compression_level = int(request.form.get('compression_level', 2))
        
        # Ler o PDF
        pdf_bytes = file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        print(f"📥 PDF recebido: {len(pdf_bytes) / 1024 / 1024:.2f} MB")
        print(f"🎚️ Nível de compressão: {compression_level}")
        
        # Comprimir o PDF com nível configurável
        compressed_doc = compress_pdf_configurable_quality(doc, compression_level)
        
        # Salvar em buffer
        output_buffer = io.BytesIO()
        compressed_doc.save(output_buffer)
        output_buffer.seek(0)
        
        compressed_size = len(output_buffer.getvalue())
        compression_ratio = ((len(pdf_bytes) - compressed_size) / len(pdf_bytes) * 100)
        
        print(f"✅ PDF comprimido: {compressed_size / 1024 / 1024:.2f} MB ({compression_ratio:.1f}% redução)")
        
        doc.close()
        compressed_doc.close()
        
        return send_file(
            output_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='compressed.pdf'
        )
        
    except Exception as e:
        print(f"❌ Erro na compressão: {str(e)}")
        return jsonify({'error': str(e)}), 500

def compress_pdf_configurable_quality(doc, compression_level):
    """Comprime PDF com qualidade configurável
    
    Args:
        doc: Documento PDF
        compression_level: 1=Baixa compressão (alta qualidade), 2=Média, 3=Alta compressão (baixa qualidade)
    """
    # Configurações MELHORADAS - menos agressivas
    if compression_level == 1:  # Baixa compressão (alta qualidade) - VERDE
        matrix_scale = 1.2  # ✅ AUMENTADO de 1.0 para 1.2 (melhor qualidade)
        jpeg_quality = 95   # ✅ AUMENTADO de 85 para 95 (qualidade quase máxima)
        quality_name = "Baixa compressão (maior qualidade)"
    elif compression_level == 2:  # Média compressão - AMARELO
        matrix_scale = 1.0  # ✅ AUMENTADO de 0.8 para 1.0 (sem redução de escala)
        jpeg_quality = 80   # ✅ AUMENTADO de 65 para 80 (boa qualidade)
        quality_name = "Compressão média"
    else:  # Alta compressão (compression_level == 3) - VERMELHO
        matrix_scale = 0.8  # ✅ AUMENTADO de 0.6 para 0.8 (menos agressivo)
        jpeg_quality = 60   # ✅ AUMENTADO de 40 para 60 (qualidade aceitável)
        quality_name = "Alta compressão (menor qualidade)"
    
    print(f"🎯 Usando: {quality_name} (escala: {matrix_scale}, qualidade: {jpeg_quality})")
    
    # Criar novo documento comprimido
    compressed_doc = fitz.open()
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Obter links e anotações
        links = page.get_links()
        annots = []
        for annot in page.annots():
            annots.append(annot)
        
        # Criar nova página
        new_page = compressed_doc.new_page(width=page.rect.width, height=page.rect.height)
        
        # Renderizar página com compressão configurável
        matrix = fitz.Matrix(matrix_scale, matrix_scale)
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        
        # Comprimir como JPEG com qualidade configurável
        img_data = pix.tobytes("jpeg", jpg_quality=jpeg_quality)
        
        # Inserir imagem comprimida
        img_rect = fitz.Rect(0, 0, page.rect.width, page.rect.height)
        new_page.insert_image(img_rect, stream=img_data)
        
        # Restaurar links
        for link in links:
            new_page.insert_link(link)
        
        # Restaurar anotações básicas
        for annot in annots:
            try:
                if annot.type[1] in ['Text', 'Highlight', 'Underline', 'StrikeOut']:
                    new_annot = new_page.add_text_annot(annot.rect.tl, annot.info.get('content', ''))
                    new_annot.set_info(annot.info)
            except:
                pass
    
    return compressed_doc

def is_valid_url(url):
    """Verifica se a URL é válida"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)