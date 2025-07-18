# Projeto SPDF - Sistema de Gerenciamento de Clientes e Usuários
Este documento descreve as regras de negócio e a arquitetura do sistema SPDF, um sistema de gerenciamento de clientes, planos e usuários com controle de acesso baseado em roles.

## Visão Geral do Sistema
O SPDF é um sistema web desenvolvido em Next.js que gerencia clientes, seus planos de serviço, usuários associados e configurações. O sistema implementa um controle  de acesso baseado em três tipos de usuários (roles) diferentes (user, manager e admin).


## Estrutura do Banco de Dados
O sistema utiliza PostgreSQL com Prisma ORM e possui os seguintes modelos principais:

### Client (Cliente)
- Campos principais : id, name, contractNumber, status, email, phone, address, city, zipCode, responsible, observations
- Relacionamentos :
  - Possui um plano (Plan) obrigatório
  - Pode ter múltiplos usuários (User)
  - Possui uma configuração (Configuration)
  - Mantém histórico de planos (PlanHistory)
  - Registra uso do sistema (Usage)
### User (Usuário)
- Campos principais : id, name, login, email, role, status, usage, lastAccess
- Roles disponíveis : "user", "manager", "admin"
- Relacionamento : Obrigatoriamente associado a um cliente (clientId)
### Plan (Plano)
- Campos principais : id, name, description, limit, price
- Relacionamentos : Pode ter múltiplos clientes
### Configuration (Configuração)
- Campos principais : notifications, reports, apiAccess, automaticBackup, contractDate, expirationDate
- Relacionamento : Um para um com cliente
### PlanHistory (Histórico de Planos)
- Finalidade : Registra mudanças de planos dos clientes
- Campos : previousPlanId, reason, changedBy
### Usage (Uso)
- Finalidade : Registra o uso do sistema por cliente
- Campos : value, date
## Regras de Negócio por Role
### 1. Administrador (admin)
Permissões completas no sistema:

- Acesso à lista completa de clientes ( /clients )
- Criação e edição de clientes
- Visualização de detalhes de qualquer cliente
- Gerenciamento de usuários de qualquer cliente
- Acesso a todas as funcionalidades do sistema
### 2. Gerente (manager)
Acesso restrito ao seu cliente:

- Redirecionamento automático : Ao acessar /clients , é redirecionado para /clients/[seu-clientId]
- Visualização apenas dos dados do seu cliente associado
- Gerenciamento de usuários apenas do seu cliente
- Restrições : Não pode editar dados do cliente (botão "Editar Cliente" oculto)
- Não pode acessar lista geral de clientes
### 3. Usuário Comum (user)
Acesso mínimo:

- Redirecionamento automático : Ao tentar acessar /clients , é redirecionado para / (página inicial)
- Não possui acesso a funcionalidades de gerenciamento de clientes
- Acesso limitado conforme necessidades específicas do negócio
## Sistema de Autenticação
### Fluxo de Login
1. Validação no Active Directory : Sistema mock implementado para desenvolvimento
2. Verificação no banco : Usuário deve existir na tabela User
3. Geração de JWT : Token contém id, name, login, role e clientId
4. Armazenamento : Token salvo em cookie httpOnly
### Middleware de Autorização
- Rotas públicas : /login , /api/auth/login
- Rotas protegidas : Todas as demais rotas requerem token válido
- Validação : JWT verificado em cada requisição
- Redirecionamento : Usuários não autenticados são redirecionados para /login
## Regras de Acesso por Página
### /clients (Lista de Clientes)
- Admin : Acesso completo, visualiza todos os clientes
- Manager : Redirecionado para /clients/[clientId]
- User : Redirecionado para /
### /clients/[id] (Detalhes do Cliente)
- Admin : Acesso a qualquer cliente, pode editar
- Manager : Acesso apenas ao seu cliente (clientId), não pode editar
- User : Sem acesso (redirecionado)
### /new-client (Novo Cliente)
- Admin : Acesso completo
- Manager/User : Sem acesso
## Funcionalidades por Role
### Gerenciamento de Usuários
- Admin : Pode adicionar/editar usuários de qualquer cliente
- Manager : Pode gerenciar usuários apenas do seu cliente
- User : Sem acesso a gerenciamento
### Relatórios e Exportação
- Admin : Acesso completo a relatórios e exportação
- Manager : Relatórios limitados ao seu cliente
- User : Conforme necessidades específicas
### Configurações
- Admin : Pode alterar configurações de qualquer cliente
- Manager : Visualização das configurações do seu cliente
- User : Sem acesso
## Validações e Segurança
### Validação de Dados
- IDs : Todos os IDs são inteiros (Int) com autoincrement
- Campos únicos : contractNumber (Cliente), login (Usuário), name (Plano)
- Campos obrigatórios : name, contractNumber, planId (Cliente); name, login, clientId (Usuário)
### Segurança
- JWT : Tokens com expiração de 24 horas
- Cookies : httpOnly, secure em produção
- Middleware : Verificação de autenticação em todas as rotas protegidas
- Autorização : Verificação de role em componentes e APIs
## Fluxo de Dados
### Autenticação
1. Login → Validação AD → Verificação BD → Geração JWT → Armazenamento Cookie
2. Requisições → Middleware → Verificação JWT → Autorização por Role
### Gerenciamento de Clientes
1. Admin acessa /clients → Lista todos os clientes
2. Manager acessa /clients → Redirecionado para seu cliente
3. Seleção de cliente → Verificação de permissão → Exibição de dados
### Controle de Uso
- Registro automático de uso por cliente
- Limites baseados no plano contratado
- Alertas quando próximo ao limite
## Considerações Técnicas
### Frontend (Next.js)
- Store : Zustand para gerenciamento de estado do usuário
- Persistência : localStorage para dados do usuário
- Componentes : Controle condicional baseado em role
- Redirecionamento : useRouter para navegação baseada em permissões
### Backend (API Routes)
- Prisma : ORM para interação com PostgreSQL
- JWT : jose library para geração e verificação de tokens
- Middleware : Verificação automática de autenticação
- APIs : Endpoints protegidos com verificação de role
Este sistema garante que cada usuário tenha acesso apenas às funcionalidades e dados apropriados ao seu nível de permissão, mantendo a segurança e integridade dos dados dos clientes