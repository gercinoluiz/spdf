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
        
        # Ler o PDF
        pdf_bytes = file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        # Processar hyperlinks em cada página
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Remover links inválidos
            links = page.get_links()
            for link in links:
                if link.get('uri'):
                    uri = link['uri']
                    if not is_valid_url(uri):
                        # Remover link inválido
                        page.delete_link(link)
            
            # Procurar por texto que parece URL e criar links
            text_instances = page.search_for(r'https?://[^\s]+', flags=fitz.TEXT_PRESERVE_WHITESPACE)
            for inst in text_instances:
                url_text = page.get_textbox(inst).strip()
                if is_valid_url(url_text):
                    # Criar novo link
                    link_dict = {
                        "kind": fitz.LINK_URI,
                        "from": inst,
                        "uri": url_text
                    }
                    page.insert_link(link_dict)
        
        # Comprimir o PDF preservando hyperlinks
        compressed_doc = compress_pdf_with_links(doc)
        
        # Salvar em buffer
        output_buffer = io.BytesIO()
        compressed_doc.save(output_buffer)
        output_buffer.seek(0)
        
        doc.close()
        compressed_doc.close()
        
        return send_file(
            output_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='compressed_with_links.pdf'
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

def is_valid_url(url):
    """Verifica se a URL é válida"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)