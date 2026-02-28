# Aparatus: Plataforma SaaS de Agendamento para Barbearias

## Resumo Executivo

**Aparatus** é uma plataforma Software as a Service (SaaS) completa para gerenciamento de agendamentos em barbearias. O sistema permite que proprietários e gestores de estabelecimentos configurem horários de funcionamento, gerenciem serviços oferecidos, consultem métricas de receita e desempenho através de um dashboard intuitivo, enquanto oferece aos clientes uma interface moderna para visualizar barbearias, consultar serviços disponíveis e realizar agendamentos online com pagamento integrado via Stripe.

A plataforma foi desenvolvida com foco em escalabilidade, segurança de dados e experiência do usuário, utilizando tecnologias modernas em desenvolvimento web.

---

## Visão Geral

### Problema Resolvido

Barbearias tradicionais enfrentam desafios operacionais significativos: ausência de sistema centralizado para gerenciar agendamentos, dificuldade em controlar disponibilidade de horários, perda de receita potencial por falta de presença digital, e incapacidade de oferecer aos clientes a conveniência de agendar online. Consequentemente, muitos estabelecimentos dependem de processos manuais, como anotações em papel ou mensagens diretas, resultando em erros, conflitos de horário e experiência do cliente prejudicada.

### Público-Alvo

- **Proprietários de barbearias**: Gestão completa da operação com acesso a painéis de controle e métricas.
- **Gerentes/Funcionários**: Acesso ao dashboard para visualizar agendamentos e gerenciar disponibilidade.
- **Clientes finais**: Navegação mobile-first para buscar barbearias, consultar serviços e realizar agendamentos com segurança.

### Contexto de Uso

A plataforma é acessível via navegador (responsiva para desktop e dispositivos móveis) e funciona como um marketplace de agendamentos. Proprietários oferecem seus serviços, definem horários de funcionamento, e clientes descobrem estabelecimentos para fazer agendamentos com processamento de pagamento automático.

---

## Arquitetura do Sistema

### Tipo de Aplicação

**Full Stack Monolítico com Separação de Responsabilidades**: Aplicação Next.js que integra frontend (React/TypeScript) e backend (API Routes e Server Actions) em um único repositório, mantendo clara separação entre camadas de apresentação, lógica de negócio e acesso a dados.

### Padrão Arquitetural

A arquitetura segue o padrão **Server-Driven Components** e **Server Actions** do Next.js 16, complementado por:

- **Server Actions**: Mutações de dados e operações sensíveis executadas no servidor (arquivos `actions/`)
- **API Routes**: Endpoints HTTP para integrações externas (Stripe webhooks, chat com IA)
- **React Query (TanStack Query)**: Gerenciamento de estado assíncrono no cliente
- **Autenticação Stateless**: JWT tokens via Better-Auth para autorização sem sessões tradicionais

### Separação de Camadas

```
├── app/                      # Camada de Apresentação (Next.js App Router)
│   ├── (páginas públicas)    # Interfaces para usuários finais
│   ├── barbershops/          # Browsing e agendamentos
│   ├── dashboard/            # Interface administrativo restrito
│   └── api/                  # Endpoints HTTP
├── components/               # Componentes React reutilizáveis
├── actions/                  # Server Actions (lógica de mutação)
├── data/                     # Funções de acesso a dados (queries)
├── lib/                      # Utilitários, helpers e configurações
├── hooks/                    # Custom React Hooks
├── prisma/                   # Schema e migrations do ORM
├── generated/                # Tipos Prisma auto-gerados
└── public/                   # Ativos estáticos
```

### Modelagem de Diretórios

- **app/**: Estrutura baseada no App Router do Next.js 16 com rotas baseadas em arquivos
- **components/**: Componentes isolados sem lógica de negócio, divididos entre gerais (`components/`) e dashboard (`components/dashboard/`)
- **actions/**: Server Actions que encapsulam mutações de dados com validação e tratamento de erros
- **data/**: Funções de consulta (queries) reutilizáveis separadas por domínio (barbershops, dashboard, bookings)
- **lib/**: Instâncias de cliente (Prisma), utilitários (validação de horários), e configurações
- **hooks/**: Custom hooks para operações de dados (React Query) e estado da UI

---

## Tecnologias Utilizadas

### Backend

- **Next.js 16**: Framework React com suporte a Server Components e Server Actions para renderização híbrida
- **Prisma ORM 7.1.0**: ORM tipo-seguro para PostgreSQL com migrations automáticas
- **Better-Auth 1.4.6**: Sistema de autenticação moderno com suporte a JWT e credenciais
- **next-safe-action 8.0.11**: Wrapper para Server Actions com validação Zod integrada
- **bcrypt 6.0.0**: Hash criptográfico de senhas com salt
- **Stripe 18.4.0**: Processamento de pagamentos e gerenciamento de transações

### Frontend

- **React 19.2.1**: Library para construção de interfaces reativas
- **TypeScript**: Tipagem estática para maior segurança de código
- **Shadcn/ui**: Componentes sem dependência acessíveis baseados em Radix UI
- **TanStack Query 5.90.12**: Gerenciamento de cache e sincronização de estado assíncrono
- **React Hook Form 7.71.1**: Gerenciamento eficiente de formulários com validação
- **Zod**: Validação de schemas em tempo de execução
- **Recharts 3.7.0**: Biblioteca de gráficos para dashboards
- **Sonner 2.0.7**: Notificações toast não-intrusivas
- **Lucide React 0.561.0**: Ícones SVG de alta qualidade
- **Tailwind CSS**: Framework CSS utilitário para estilização rápida e consistente
- **date-fns 4.1.0**: Manipulação e formatação de datas

### Banco de Dados

- **PostgreSQL**: Sistema relacional robusto com suporte a tipos avançados
- **Prisma Adapter PG 7.1.0**: Adaptador nativo para driver PostgreSQL com otimização de performance

### Autenticação

- **Better-Auth**: Framework de autenticação que fornece:
  - Credenciais (email/senha)
  - JWT tokens com expiração configurável
  - Gerenciamento de sessões
  - Suporte a múltiplas contas por usuário
  - Verificação de email

### Ferramentas Auxiliares

- **AI SDK (Google, OpenAI, React)**: Integração de modelos de linguagem para chat assistente
- **Stripe.js**: Biblioteca cliente para processar pagamentos de forma segura
- **ESLint**: Linting e padronização de código
- **PostCSS**: Processamento CSS com suporte a Tailwind

### Justificativa Técnica das Escolhas

1. **Next.js 16**: Suporte nativo a Server Components permite separação clara entre lógica servidor e cliente, reduzindo JavaScript no navegador e melhorando performance. Server Actions simplificam mutações sem necessidade de rotas API explícitas.

2. **Prisma ORM**: Abstração de banco de dados type-safe elimina SQL manual propenso a erros, oferece migrations automáticas e geração de tipos TypeScript em tempo de build.

3. **Better-Auth**: Alternativa moderna a NextAuth com menor overhead, melhor suporte a JWT, e API mais simples para autenticação customizada.

4. **TanStack Query**: Solução padrão-ouro para sincronização de estado servidor-cliente em React, com caching sophisticado e refetch automático.

5. **Tailwind CSS**: Framework utilitário reduz tempo de desenvolvimento, garante consistência visual, e permite build otimizado com apenas classes utilizadas.

6. **PostgreSQL**: Banco relacional maduro com suporte a tipos JSON, arrays, e constraints complexas necessários para modelo de dados estruturado da aplicação.

---

## Funcionalidades

### Funcionalidades Principais

#### Para Clientes

- **Descoberta de Barbearias**: Navegação por catálogo com filtros, visualização de details e serviços
- **Agendamento Online**: Seleção de data, horário, e confirmação com pagamento Stripe
- **Histórico de Agendamentos**: Visualização de agendamentos passados e futuros
- **Cancelamento de Agendamentos**: Possibilidade de cancelar reservas com política flexível
- **Chat Assistente**: Integração com IA (Google Gemini/OpenAI) para consultas sobre serviços

#### Para Gestores/Proprietários

- **Dashboard Administrativo**: Visualização de métricas em tempo real (receita, agendamentos, clientes)
- **Configuração de Horários**: Definição de horários de funcionamento por dia da semana com suporte a intervalos de almoço
- **Gerenciamento de Serviços**: Criação e configuração de serviços com preços e descrições
- **Visualização de Agendamentos**: Lista completa de agendamentos com detalhes
- **Métricas e Análises**: Gráficos de receita mensal/diária, serviços populares, contagem de clientes

### Regras de Negócio Implementadas

1. **Validação de Horários**: Clientes só conseguem agendar dentro dos horários configurados; horários de almoço são respeitados automaticamente
2. **Prevenção de Overbooking**: Cada horário pode ter apenas um agendamento por serviço
3. **Bloqueio de Agendamentos Passados**: Impossível agendar para data/hora no passado
4. **Processamento de Pagamento**: Agendamentos confirmados apenas após sucesso no Stripe
5. **Controle de Acesso Baseado em Função**: ADMIN vs EMPLOYEE com permissões diferenciadas
6. **Isolamento de Dados**: Usuários só veem dados da barbearia associada

### Diferenciais do Sistema

- **Integração com IA**: Chat assistente powered by Google Gemini/OpenAI para melhor experiência do cliente
- **Suporte a Intervalos de Almoço**: Configuração granular de disponibilidade incluindo pausas durante o dia
- **Pagamento Online Integrado**: Processamento seguro via Stripe sem necessidade de terceiros
- **Responsividade Completa**: Interface otimizada para mobile, tablet e desktop
- **Validação em Tempo Real**: Horários indisponíveis são refletidos instantaneamente na UI

---

## Modelagem de Dados

### Principais Entidades

#### Barbershop
Representa um estabelecimento de barbearia.
- `id`: Identificador único (UUID)
- `name`: Nome do estabelecimento
- `address`: Localização
- `description`: Descrição de serviços
- `imageUrl`: URL da imagem de capa
- `phones`: Array de contatos telefônicos

#### BarbershopService
Serviços oferecidos por uma barbearia.
- `id`: Identificador único (UUID)
- `name`: Nome do serviço (ex: "Corte de Cabelo")
- `description`: Descrição detalhada
- `imageUrl`: Imagem do serviço
- `priceInCents`: Preço em centavos (inteiro, evita problemas com ponto flutuante)
- `barbershopId`: Referência a Barbershop

#### User
Usuários da plataforma (clientes e funcionários).
- `id`: Identificador único (UUID)
- `name`: Nome completo
- `email`: Email único para autenticação
- `password`: Hash bcrypt (nulável para social login)
- `emailVerified`: Flag de verificação
- `role`: ADMIN ou EMPLOYEE
- `barbershopId`: Nulável, associa funcionário a estabelecimento
- `image`: Avatar do usuário

#### Booking
Agendamentos realizados.
- `id`: Identificador único (UUID)
- `userId`: Cliente que fez a reserva
- `barbershopId`: Barbearia onde será atendido
- `serviceId`: Serviço escolhido
- `date`: Data e hora do agendamento
- `cancelledAt`: Timestamp de cancelamento (nulável)
- `stripeChargeId`: ID da transação Stripe para reconciliação
- `createdAt`, `updatedAt`: Metadados de auditoria

#### BusinessHours
Horários de funcionamento configuráveis.
- `id`: Identificador único (UUID)
- `barbershopId`: Barbearia associada
- `dayOfWeek`: 0-6 (Sunday-Saturday)
- `openingTime`: Horário de abertura (HH:MM)
- `closingTime`: Horário de fechamento (HH:MM)
- `isClosed`: Flag para dias fechados
- `lunchStart`, `lunchEnd`: Intervalo de almoço (opcional)
- Constraint unico: `[barbershopId, dayOfWeek]` garante uma entrada por dia/barbearia

#### Session, Account, Verification
Tabelas suplementares gerenciadas por Better-Auth para sessões e autenticação social.

### Relacionamentos

```
Barbershop (1) ──┬─→ (N) BarbershopService
                 ├─→ (N) Booking
                 └─→ (N) BusinessHours

User (1) ────┬──→ (N) Session
             ├──→ (N) Account
             └──→ (N) Booking

Booking ──→ User, Barbershop, BarbershopService

BarbershopService ──→ Barbershop
```

### Decisões de Modelagem

1. **UUID para IDs**: Segurança e distribuição de dados facilitam replicação/migração
2. **priceInCents**: Armazena valores monetários como inteiros para evitar problemas de ponto flutuante
3. **Timestamps Timestamptz**: PostgreSQL `TIMESTAMPTZ()` garante precisão temporal com timezone awareness
4. **Foreign Keys Cascade**: Deletar barbearia remove automaticamente serviços e agendamentos associados (integridade referencial)
5. **Índices Estratégicos**: `@@index([barbershopId])`, `@@index([userId])` otimizam queries frequentes por proprietário/usuário
6. **BusinessHours Separada**: Modelo específico para horários permite flexibilidade futura (ex: exceções, feriados)

---

## Fluxo de Funcionamento

### Autenticação

1. **Registro**: Usuário fornece email e senha
   - Validação estrutural (Zod)
   - Hash bcrypt da senha com salt
   - Email de verificação enviado (Better-Auth)
   - Sessão JWT criada

2. **Login**: Credenciais validadas contra hash armazenado
   - JWT token gerado com `expiresAt`
   - Token armazenado em cookie HTTP-only para segurança
   - Refresh token permite renovação sem re-autenticação

3. **Autenticação em Operações**: 
   - `protectedActionClient` do `next-safe-action` verifica JWT em cada Server Action
   - Contexto do usuário (`ctx.user`) disponível em toda a aplicação

### Controle de Permissões

- **Role-Based Access Control (RBAC)**:
  - `ADMIN`: Acesso completo ao dashboard, gerenciamento de serviços e horários
  - `EMPLOYEE`: Acesso limitado a visualização de agendamentos

- **Isolamento por Barbershop**:
  - Middleware valida que usuário ADMIN/EMPLOYEE pertence à barbearia sendo acessada
  - Clientes veem apenas dados públicos de barbearias

### Processo Principal: Agendamento

1. **Cliente Navega**:
   - Acessa `GET /barbershops/[id]` para visualizar serviços
   - Clica em "Reservar" em um serviço

2. **Seleção de Data/Hora**:
   - Cliente seleciona data no calendário
   - `getDateAvailableTimeSlots` executa:
     - Fetch de `BusinessHours` para o dia selecionado
     - Filtra slots dentro do horário de funcionamento (exclui intervalos de almoço)
     - Recebe bookings já realizados para o dia
     - Retorna apenas horários disponíveis

3. **Validação no Servidor**:
   - `createBooking` action recebe `serviceId` e `date`
   - `checkTimeAvailability` valida:
     - Barbearia está aberta no horário
     - Não está em intervalo de almoço
     - Horário não é no passado

4. **Processamento de Pagamento**:
   - `createBookingCheckoutSession` cria sessão Stripe
   - Cliente redirecionado para checkout Stripe
   - Stripe webhook (`POST /api/stripe/webhook`) processa confirmação de pagamento

5. **Finalização**:
   - Booking criado no banco com `stripeChargeId` para reconciliação
   - Cliente recebe confirmação de agendamento

---

## Segurança

### Controle de Acesso

1. **Autenticação Obrigatória**: 
   - `protectedActionClient` rejeita requisições não autenticadas
   - Middleware valida tokens JWT em todas as rotas `/dashboard`

2. **Autorização Granular**:
   - Verificação de propriedade: usuário só acessa dados de sua barbershop
   - Validação de role em operações sensíveis (ex: atualizar horários requer ADMIN)

3. **Isolamento de Dados**:
   - Queries de banco filtram por `user.barbershopId` automaticamente
   - Impossível acessar dados de outro estabelecimento via API

### Validação de Dados

1. **Client-Side**:
   - React Hook Form com validação em tempo real
   - Schemas Zod para estrutura de dados

2. **Server-Side Obrigatória**:
   - Toda entrada validada com `inputSchema` antes de processamento
   - Zod garante type-safety em time de execução
   - Retorno de `returnValidationErrors` em caso de falha

3. **Exemplos**:
   ```typescript
   const inputSchema = z.object({
       serviceId: z.string().uuid(),
       date: z.string().or(z.date()).transform((val) => new Date(val)),
   });
   ```

### Proteção Contra Falhas Comuns

1. **SQL Injection**: Prisma ORM parametriza todas as queries automaticamente
2. **CSRF**: Next.js middleware e SameSite cookies por padrão
3. **XSS**: React escapa automaticamente conteúdo renderizado; Trusted HTML via `dangerouslySetInnerHTML` evitado
4. **Senhas Expostas**: Bcrypt com salt adequado; senhas nunca retornadas em APIs
5. **Rate Limiting**: Implementado em webhooks Stripe (verificação de timestamp)
6. **Secrets**: Variáveis sensíveis em `.env.local` não versionadas (`.gitignore`)

---

## Como Executar o Projeto

### Pré-requisitos

- **Node.js**: Versão 18.17 ou superior (recomendado 20+)
- **npm**: Versão 9 ou superior (ou yarn/pnpm)
- **PostgreSQL**: Versão 14 ou superior localmente ou hospedado (ex: Vercel Postgres, Railway)
- **Contas Externas**:
  - Stripe (desenvolvedor): Para processamento de pagamentos
  - Google Cloud (Gemini API) ou OpenAI: Para chat assistente

### Instalação

1. **Clonar Repositório**:
   ```bash
   git clone <repository-url>
   cd aparatus
   ```

2. **Instalar Dependências**:
   ```bash
   npm install
   ```

3. **Gerar Tipos Prisma**:
   ```bash
   npx prisma generate
   ```

### Configuração de Variáveis de Ambiente

Criar arquivo `.env.local` na raiz do projeto:

```env
# Database
DATABASE_URL=postgresql://usuario:senha@localhost:5432/aparatus

# Better-Auth
BETTER_AUTH_SECRET=seu_secret_aleatorio_de_32_caracteres
BETTER_AUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# AI (escolher um ou ambos)
GOOGLE_GENERATIVE_AI_API_KEY=seu_gemini_api_key
# OU
OPENAI_API_KEY=seu_openai_key

# URLs (para produção)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Migração do Banco

1. **Criar e Aplicar Migrações**:
   ```bash
   npx prisma migrate dev --name init
   ```
   Isso cria tabelas baseadas no schema.prisma

2. **Usar Migrate Reset (apenas desenvolvimento)**:
   ```bash
   npx prisma migrate reset --force
   ```
   Apaga todo banco e reaplica todas as migrations (destruidor!)

### Seed (Dados Iniciais)

1. **Executar Script de Seed**:
   ```bash
   npx prisma db seed
   ```
   Popula banco com barbershops, serviços e usuários de teste

2. **Credenciais de Teste**:
   - Email: `admin@barbershop.com`
   - Senha: (configurada no seed script)

### Comandos de Desenvolvimento

- **Dev Server**: `npm run dev`
  - Inicia server Next.js em `http://localhost:3000`
  - Hot reload ativado

- **Build**: `npm run build`
  - Compila aplicação para produção
  - Verifica erros de TypeScript

- **Start**: `npm start`
  - Inicia servidor otimizado (requer build anterior)

- **Lint**: `npm run lint`
  - Valida qualidade de código via ESLint
  - `npm run lint -- --fix` para auto-correções

- **Prisma Studio**: `npx prisma studio`
  - Interface visual para inspeção/edição de dados em `localhost:5555`

---

## Possíveis Melhorias Futuras

### Escalabilidade

1. **Banco de Dados**:
   - Implementar read replicas para consultas de alto volume
   - Usar connection pooling (PgBouncer) para gerenciar conexões eficientemente
   - Sharding por `barbershopId` para crescimento horizontal

2. **Cache**:
   - Redis para cacheing de serviços frequentemente acessados
   - Invalidação inteligente de cache em mudanças

3. **Arquitetura**:
   - Separar backend em API-only e frontend em SPA remota
   - Usar serverless functions (Next.js Edge Runtime) para operações leves

### Performance

1. **Frontend**:
   - Code splitting automático de rotas
   - Lazy loading de componentes pesados
   - Image optimization via `next/image`

2. **Backend**:
   - Database query profiling para identificar N+1 queries
   - Índices adicionais baseados em padrões de acesso
   - Pagination para operações batch

3. **Infraestrutura**:
   - CDN para assets estáticos (Cloudflare, Vercel Edge)
   - Compression (gzip/brotli) em responses
   - HTTP/2 push para assets críticos

### Funcionalidades Adicionais

1. **Notificações**:
   - SMS/WhatsApp para lembretes de agendamento
   - Email com confirmação e detalhes da reserva
   - Push notifications em aplicativo mobile

2. **Integração**:
   - Google Calendar sync para exportar agendamentos
   - WhatsApp Business API para atendimento
   - Integração com sistemas de CRM

3. **Análises**:
   - Previsão de demanda via machine learning
   - Insights de comportamento do cliente
   - Relatórios customizáveis por período

4. **Aplicativo Mobile**:
   - React Native ou Flutter para iOS/Android
   - Notificações push nativas
   - Pagamento offline com sincronização

5. **Marketplace**:
   - Sistema de avaliações e comentários
   - Promocodes e cupons desconto
   - Programa de referência para clientes

---

## Documentação Adicional

- **Prisma**: https://www.prisma.io/docs/
- **Next.js**: https://nextjs.org/docs
- **Better-Auth**: https://better-auth.com
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **TanStack Query**: https://tanstack.com/query/latest

---

## Autor

Projeto desenvolvido como plataforma SaaS para gerenciamento de agendamentos em barbearias.

Versão: 0.1.0
Última atualização: Fevereiro de 2026
