FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema necessárias para PyMuPDF
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY python_api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação Python
COPY python_api/ .

# Expor porta
EXPOSE 5000

# Comando para executar a aplicação
CMD ["python", "hyperlink_processor.py"]