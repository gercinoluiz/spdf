# SPDF - Sistema de Processamento de Documentos Fiscais

## Configuração do Ambiente com Docker

### Pré-requisitos
- Docker e Docker Compose instalados
- Node.js e npm instalados
- Arquivo `.env` configurado

### Comandos Docker

#### 1. Subir o banco de dados PostgreSQL
```bash
docker-compose up -d
```

#### 2. Verificar se o container está rodando
```bash
docker-compose ps
```

#### 3. Verificar logs do banco de dados
```bash
docker-compose logs -f postgres
```

#### 4. Parar o banco de dados
```bash
docker-compose down
```

#### 5. Parar e remover volumes (reset completo)
```bash
docker-compose down -v
```

### Comandos da Aplicação

#### 1. Instalar dependências
```bash
npm install
```

#### 2. Executar migrações do Prisma
```bash
npx prisma migrate deploy
```

#### 3. Executar seed do banco de dados
```bash
npm run seed
```

#### 4. Rodar a aplicação em desenvolvimento
```bash
npm run dev
```

#### 5. Abrir Prisma Studio (gerenciador visual do banco)
```bash
npx prisma studio
```

### Sequência Completa de Inicialização

```bash
# 1. Subir o banco
docker-compose up -d

# 2. Instalar dependências (se necessário)
npm install

# 3. Executar migrações
npx prisma migrate deploy

# 4. Executar seed
npm run seed

# 5. Rodar a aplicação
npm run dev
```

### Informações de Acesso

#### Banco PostgreSQL
- **Host**: localhost
- **Porta**: 5432
- **Database**: nextjs_db
- **Usuário**: nextjs_user
- **Senha**: your_password_here

#### Aplicação
- **URL**: http://localhost:3000

#### Prisma Studio
- **URL**: http://localhost:5555

### Usuário de Teste Criado no Seed
- **Nome**: Gercino Luiz da Silva Neto
- **Login**: p017579
- **Role**: admin
- **Senha**: 1234

### Comandos Úteis

#### Resetar banco de dados completamente
```bash
docker-compose down -v
docker-compose up -d
npx prisma migrate deploy
npm run seed
```

#### Verificar status dos containers
```bash
docker-compose ps
```

#### Acessar o container do PostgreSQL
```bash
docker-compose exec postgres psql -U nextjs_user -d nextjs_db
```

#### Backup do banco de dados
```bash
docker-compose exec postgres pg_dump -U nextjs_user nextjs_db > backup.sql
```

#### Restaurar backup
```bash
docker-compose exec -T postgres psql -U nextjs_user -d nextjs_db < backup.sql
```

## Estrutura do Projeto

### Tecnologias Utilizadas
- **Frontend**: Next.js 14 com TypeScript
- **Backend**: Next.js API Routes
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma
- **Autenticação**: JWT
- **Estilização**: Tailwind CSS
- **Gerenciamento de Estado**: Zustand

### Arquitetura
- **Autenticação**: Sistema baseado em roles (admin, manager, user)
- **Autorização**: Middleware para controle de acesso
- **Banco de Dados**: Estrutura multi-tenant com clientes
- **API**: RESTful com Next.js API Routes

### Roles e Permissões
- **Admin**: Acesso total ao sistema
- **Manager**: Gerencia apenas seu cliente
- **User**: Acesso limitado aos próprios dados

## Desenvolvimento

### Scripts Disponíveis
```bash
npm run dev          # Rodar em desenvolvimento
npm run build        # Build para produção
npm run start        # Rodar build de produção
npm run lint         # Executar linter
npm run seed         # Executar seed do banco
```

### Estrutura de Pastas
