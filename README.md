# 💈 BarberShop Management — Web Panel

[![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Angular Material](https://img.shields.io/badge/Angular_Material-19-757575?style=flat&logo=material-design&logoColor=white)](https://material.angular.io/)
[![SSR](https://img.shields.io/badge/SSR-Angular_Universal-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.io/guide/ssr)
[![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow)](https://github.com)

> Painel web administrativo para o sistema de gestão de barbearias.
> Consome a [API REST em Java / Spring Boot](https://github.com/Marcos-Gabriell/api-barbearia) *(repositório separado, privado)*.

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Stack Técnica](#stack-técnica)
- [Arquitetura Frontend](#arquitetura-frontend)
- [Páginas e Rotas](#páginas-e-rotas)
- [Segurança JWT](#segurança-jwt)
- [Sistema de Temas](#sistema-de-temas)
- [Como Executar](#como-executar)
- [Status do Projeto](#status-do-projeto)
- [Roadmap](#roadmap)

---

## Sobre o Projeto

Interface administrativa completa para gestão de barbearias — autenticação, usuários, catálogo de serviços, agenda, agendamentos e perfil. Desenvolvido com Angular 19 usando Standalone Components, SSR e integração direta com a API REST do backend.

---

## Stack Técnica

| Tecnologia | Versão | Uso |
|---|---|---|
| Angular | 19.2 | Framework principal |
| TypeScript | 5.7 | Linguagem |
| Angular Router | 19.2 | Roteamento lazy loading |
| Angular Forms | 19.2 | Reactive Forms |
| Angular Material | 19.2 | Componentes UI base |
| Angular CDK | 19.2 | Utilitários de layout |
| Angular SSR | 19.2 | Server-Side Rendering |
| Lucide Angular | 0.562 | Ícones |
| RxJS | 7.8 | Reatividade e operadores |
| Express | 4.x | Servidor SSR |

---

## Arquitetura Frontend

```
src/app/
│
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts          # Bloqueia rotas sem autenticação
│   │   └── role.guard.ts          # Bloqueia rotas por role (DEV, ADMIN, STAFF)
│   ├── interceptors/
│   │   ├── auth.interceptor.ts    # Injeta Bearer token em todas as requests
│   │   └── user-headers.interceptor.ts  # Injeta X-User-Id e X-User-Role
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── catalog.model.ts
│   │   ├── AppointmentStatus.model.ts
│   │   └── PageResponse.model.ts
│   ├── services/
│   │   ├── auth/
│   │   │   ├── auth.service.ts        # Login, logout, refresh, decode JWT
│   │   │   └── token.service.ts       # Leitura/escrita de tokens no localStorage
│   │   ├── users/
│   │   │   ├── user.service.ts        # CRUD de usuários
│   │   │   ├── user-profile.service.ts # Perfil próprio e troca de senha
│   │   │   └── current-user.service.ts # Estado do usuário logado
│   │   ├── catalog/
│   │   │   └── catalog.service.ts
│   │   ├── appointments/
│   │   │   └── appointments.service.ts
│   │   ├── availability/
│   │   │   ├── availability.service.ts
│   │   │   └── my-availability.service.ts
│   │   └── theme/
│   │       └── theme.service.ts       # Dark/Light mode
│   └── ui/
│       ├── toast.service.ts
│       ├── toast-container/
│       └── cancel-appointment-dialog.component.ts
│
├── components/
│   └── sidebar/                   # Navegação lateral
│
└── pages/
    ├── login/
    ├── recover-password/
    ├── auth/setup-account/        # Ativação via convite
    ├── dashboard/
    ├── users/
    ├── catalog/
    ├── availability/
    ├── appointments/
    │   └── cancel/                # Cancelamento público via token
    ├── perfil/
    ├── forbidden/
    └── not-found/
```

**Decisões de arquitetura:**
- **Standalone Components** em todas as páginas e componentes — sem NgModules
- **Lazy loading** em todas as rotas para melhor performance inicial
- **SSR habilitado** via Angular Universal + Express
- Dois interceptors separados: um para JWT e outro para os headers customizados `X-User-Id` e `X-User-Role` exigidos pelo backend

---

## Páginas e Rotas

| Rota | Componente | Guard | Role |
|---|---|---|---|
| `/login` | LoginComponent | — | Público |
| `/recuperar-senha` | RecoverPasswordComponent | — | Público |
| `/setup-conta` | SetupAccountComponent | — | Público (token de convite) |
| `/cancelar-agendamento` | CancelAppointmentComponent | — | Público (token de cancelamento) |
| `/dashboard` | DashboardComponent | authGuard | Todos |
| `/usuarios` | UsersComponent | authGuard + roleGuard | DEV, ADMIN |
| `/catalogo` | CatalogListComponent | authGuard + roleGuard | DEV, ADMIN |
| `/agenda` | AvailabilityComponent | authGuard + roleGuard | DEV, ADMIN |
| `/agendamentos` | AppointmentsComponent | authGuard | Todos |
| `/perfil` | ProfileComponent | authGuard | Todos |
| `/forbidden` | ForbiddenComponent | — | — |
| `/**` | NotFoundComponent | — | — |

---

## Segurança JWT

### AuthService

Responsável por todo o ciclo de vida de autenticação:

- `login()` — chama `POST /api/auth/login`, salva tokens no `localStorage`
- `logout()` — chama `POST /api/auth/logout`, limpa tokens locais
- `refreshToken()` — renova o access token com o refresh token
- `isAuthenticated()` — verifica existência e expiração do token sem request
- `getCurrentUserData()` — decodifica o JWT localmente e extrai `userId`, `role`, `email`, `exp`
- `hasRole()` / `hasAnyRole()` — verificação de role sem request adicional

### Interceptors

**auth.interceptor** — anexa `Authorization: Bearer {token}` em todas as requests autenticadas.

**user-headers.interceptor** — anexa `X-User-Id` e `X-User-Role` nos headers, exigidos pelos endpoints protegidos do backend para auditoria.

### Route Guards

**authGuard** — redireciona para `/login` se não autenticado.

**roleGuard(roles[])** — redireciona para `/forbidden` se a role do usuário não estiver na lista permitida.

---

## Sistema de Temas

Dark Mode e Light Mode com persistência via `localStorage`. O `ThemeService` aplica a classe CSS correspondente no `document.body` e mantém a preferência entre sessões.

---

## Como Executar

### Pré-requisitos

- Node.js LTS (18+)
- Angular CLI 19

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
ng serve
```

Acesse em `http://localhost:4200`.

> Por padrão, o frontend aponta para `http://localhost:8080`. O backend precisa estar rodando.

### Build de produção

```bash
ng build
```

### SSR (Server-Side Rendering)

```bash
npm run serve:ssr:barbearia-front
```

---

## Status do Projeto

### ✅ Concluído

**Auth e navegação**
- Tela de login com Reactive Forms e tratamento de erros
- Fluxo completo de recuperação de senha (solicitar → validar código → redefinir)
- Ativação de conta via convite (`/setup-conta`)
- Guards de autenticação e role em todas as rotas protegidas
- Interceptors JWT e headers customizados
- Refresh automático de token

**Usuários**
- Listagem com filtros
- Criação por convite
- Edição e exclusão
- Reset de senha por admin
- Divisão de tags/roles

**Catálogo**
- Listagem, criação, edição e exclusão de serviços
- Gerenciamento de responsáveis

**Agenda**
- Visualização e edição de horários por dia
- Bloqueios de horário

**Agendamentos**
- Listagem com filtros (data, status, barbeiro)
- Cancelamento interno via dialog
- Cancelamento público via link tokenizado (`/cancelar-agendamento`)

**Perfil**
- Autoedição de nome, telefone e e-mail
- Troca de senha

**UI Global**
- Sidebar de navegação responsiva
- Toast notifications global
- Dark / Light mode com persistência
- Página 403 (forbidden) e 404 (not-found)

---

### 🚧 Em desenvolvimento — Etapa 5

- [ ] Revisão completa da página de agendamentos
- [ ] Formulário de criação de agendamento interno (balcão)
- [ ] Visualização de horários disponíveis em tempo real
- [ ] Fluxo público de agendamento para o cliente
- [ ] Download do comprovante PDF

---

## Roadmap

### 📋 Etapa 6 — Dashboard Inteligente

- Métricas de agendamentos, faturamento e ocupação
- Gráficos interativos por período
- Comparativo mensal/semanal
- Exportação de relatórios PDF/Excel

### 📋 Etapa 7 — Qualidade e Infra

- Testes unitários com Jasmine/Karma
- Configuração de `environment.ts` por ambiente (dev / staging / prod)
- CI/CD para build e deploy automatizado

---

## 🔗 Integração com o Backend

O frontend consome exclusivamente a [API REST em Java / Spring Boot](https://github.com/Marcos-Gabriell/api-barbearia).

A URL base está configurada em cada service apontando para `http://localhost:8080`. Para produção, crie `src/environments/environment.prod.ts` com a URL real e ajuste os services via `environment.apiUrl`.

---

## 👨‍💻 Autor

Desenvolvido por **Marcos Gabriel** — [GitHub](https://github.com/Marcos-Gabriell)
