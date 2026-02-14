# 💈 Sistema de Gerenciamento de Barbearia - Frontend

[![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Latest-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow)](https://github.com)

> 🚧 **Projeto em Desenvolvimento Ativo**
> 
> Painel web moderno e responsivo para gestão completa de barbearias

---

## 📖 Sobre o Projeto

Interface web desenvolvida em **Angular 19** para o **Sistema de Gerenciamento de Barbearia**. Oferece uma experiência moderna, segura e intuitiva para administração completa de equipes, serviços, agendas e atendimentos.

### 💡 Visão Geral

Painel administrativo completo que consome uma **API REST Java/Spring Boot**, oferecendo:

- **Autenticação Segura**: Login com JWT e sistema de refresh token
- **Gestão de Usuários**: Controle hierárquico (DEV, ADMIN, STAFF)
- **Sistema de Convites**: Criação controlada de usuários via link tokenizado
- **Recuperação de Senha**: Fluxo completo com código de verificação
- **Gestão de Perfil**: Auto-gestão de dados pessoais
- **Catálogo de Serviços**: Gerenciamento completo de serviços e responsáveis
- **Gestão de Agenda**: Controle de disponibilidade e horários de cada usuário
- **Temas Personalizados**: Dark Mode e Light Mode
- **Interface Responsiva**: Adaptada para desktop, tablet e mobile

### 🎯 Diferenciais

**Experiência do Usuário:**
- Interface intuitiva e moderna
- Feedback visual em todas as ações
- Validações em tempo real
- Mensagens contextuais e claras
- Navegação fluida e performática

**Segurança:**
- Proteção de rotas com Guards
- Interceptors automáticos para anexar JWT
- Tratamento centralizado de erros de autenticação
- Validações robustas em formulários

**Arquitetura Moderna:**
- Standalone Components (sem NgModules)
- Serviços desacoplados e reutilizáveis
- Reactive Forms para validações complexas
- Lazy Loading para melhor performance

---

## 🛠️ Tecnologias

### Core
<div align="left">
  <img src="https://img.shields.io/badge/Angular-19-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular"/>
  <img src="https://img.shields.io/badge/TypeScript-Latest-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/RxJS-Latest-B7178C?style=for-the-badge&logo=reactivex&logoColor=white" alt="RxJS"/>
</div>

### Ferramentas e Bibliotecas
<div align="left">
  <img src="https://img.shields.io/badge/Angular_CLI-19-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular CLI"/>
  <img src="https://img.shields.io/badge/Node.js-LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/NPM-Latest-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="NPM"/>
</div>

### Padrões e Conceitos
- **Standalone Components** (sem módulos NgModule)
- **Reactive Forms** (validações robustas)
- **Angular Router** (navegação avançada)
- **HTTP Interceptors** (tratamento centralizado)
- **Route Guards** (proteção de rotas)
- **Services** (lógica de negócio desacoplada)
- **CSS Moderno** (variáveis CSS, temas dinâmicos)

---

## 📊 Status do Projeto

### 🎉 Etapa 1: Fundação e Autenticação ✅ **CONCLUÍDA**

#### 🔐 Sistema de Login
- ✅ Tela de login responsiva
- ✅ Validação de formulário (Reactive Forms)
- ✅ Integração com API (JWT + Refresh Token)
- ✅ Armazenamento seguro de tokens
- ✅ Redirecionamento pós-login baseado em perfil

#### 🔄 Recuperação de Senha
- ✅ Solicitação de recuperação
- ✅ Validação de código de verificação
- ✅ Redefinição de senha
- ✅ Feedback visual em cada etapa
- ✅ Tratamento de erros

---

### 🎉 Etapa 2: Segurança e Navegação ✅ **CONCLUÍDA**

#### 🛡️ HTTP Interceptor
- ✅ Anexa automaticamente JWT em requisições
- ✅ Tratamento centralizado de erros 401/403
- ✅ Logout automático em caso de token inválido
- ✅ Renovação automática de token expirado

#### 🚧 Route Guards
- ✅ AuthGuard (protege rotas autenticadas)
- ✅ RoleGuard (protege rotas por perfil)
- ✅ Redirecionamento para login quando não autenticado
- ✅ Bloqueio de acesso não autorizado via URL

---

### 🎉 Etapa 3: Gestão de Usuários ✅ **CONCLUÍDA**

#### 👥 Sistema de Convites
- ✅ Validação de token de convite via URL
- ✅ Formulário de ativação de conta
- ✅ Definição de senha segura
- ✅ Feedback de sucesso/erro
- ✅ Redirecionamento automático pós-ativação

#### 📋 Listagem de Usuários
- ✅ Tabela responsiva de usuários
- ✅ Filtros por nome, email, perfil
- ✅ Paginação
- ✅ Ações contextuais (editar, desativar)
- ✅ Indicadores visuais de status

#### ➕ Criação de Usuários
- ✅ Formulário de convite
- ✅ Validação de e-mail único
- ✅ Seleção de perfil (ADMIN/STAFF)
- ✅ Envio de convite por e-mail
- ✅ Confirmação visual de envio

---

### 🎉 Etapa 4: Gestão de Perfil ✅ **CONCLUÍDA**

#### 🙍‍♂️ Meu Perfil
- ✅ Visualização de dados pessoais
- ✅ Edição de nome, telefone, e-mail
- ✅ Alteração de senha (com validação da atual)
- ✅ Validações robustas (Reactive Forms)
- ✅ Confirmação de alterações

---

### 🎉 Etapa 5: Experiência do Usuário ✅ **CONCLUÍDA**

#### 🎨 Sistema de Temas
- ✅ Dark Mode 🌙
- ✅ Light Mode ☀️
- ✅ Alternância instantânea
- ✅ Persistência da preferência (LocalStorage)
- ✅ Aplicação automática ao carregar a aplicação

#### ✨ Feedback Visual
- ✅ Loading states em requisições
- ✅ Toasts de sucesso/erro/info
- ✅ Animações de transição
- ✅ Indicadores de campos obrigatórios
- ✅ Mensagens de validação contextuais

---

### 🎉 Etapa 6: Catálogo de Serviços ✅ **CONCLUÍDA**

#### 📝 Gestão de Serviços
- ✅ Listagem de serviços disponíveis
- ✅ Criação de novo serviço
- ✅ Edição de serviços existentes
- ✅ Atribuição de múltiplos responsáveis (barbeiros)
- ✅ Definição de preço e duração
- ✅ Ativação/desativação de serviços
- ✅ Validações completas de formulário

#### 🧠 Interface Inteligente
- ✅ Seleção múltipla de responsáveis
- ✅ Feedback visual de alterações
- ✅ Confirmação antes de excluir
- ✅ Filtros e busca
- ✅ Cards responsivos para mobile

---

### 🎉 Etapa 7: Gestão de Agenda ✅ **CONCLUÍDA**

#### 📅 Minha Agenda (Perfil)
- ✅ Visualização da agenda própria
- ✅ Configuração de disponibilidade por dia
- ✅ Ativar/desativar dias da semana
- ✅ Definir horário de início e fim
- ✅ Configurar até 3 pausas por dia
- ✅ Validação de conflitos de horários
- ✅ Interface intuitiva de edição

#### ⚙️ Controle de Disponibilidade
- ✅ Toggle visual para ativar/desativar dias
- ✅ Inputs de time para horários
- ✅ Adição/remoção de pausas
- ✅ Validação em tempo real
- ✅ Salvamento automático

#### 👥 Gestão de Agendas (Admin/Dev)
- ✅ Visualização de agendas de todos os usuários (DEV)
- ✅ Visualização de agendas dos STAFF (ADMIN)
- ✅ Edição de agenda de qualquer usuário autorizado
- ✅ Filtro por usuário
- ✅ Controle hierárquico de permissões

---

### 🚧 Etapa 8: Sistema de Agendamentos **EM DESENVOLVIMENTO**

#### 📌 Agendamento Interno (Balcão)
- [ ] Interface de criação de agendamento
- [ ] Seleção de cliente (cadastrado ou avulso)
- [ ] Seleção de serviço e barbeiro
- [ ] Visualização de horários disponíveis
- [ ] Validação de disponibilidade em tempo real
- [ ] Confirmação automática

#### 🌐 Agendamento Externo (Cliente)
- [ ] Página pública de agendamento
- [ ] Cadastro simplificado do cliente
- [ ] Visualização de serviços disponíveis
- [ ] Seleção de horário
- [ ] Confirmação e e-mail

#### 🔍 Gestão de Agendamentos
- [ ] Listagem com filtros avançados
- [ ] Filtro por data, status, barbeiro, cliente
- [ ] Paginação e ordenação
- [ ] Alteração de status
- [ ] Cancelamento de agendamento
- [ ] Histórico completo

---

### 📋 Etapa 9: Dashboard Inteligente **PLANEJADO**

#### 📊 Métricas e Análises
- [ ] Serviços mais vendidos
- [ ] Performance por barbeiro
- [ ] Taxa de ocupação
- [ ] Horários de pico
- [ ] Faturamento por período
- [ ] Gráficos interativos

#### 📈 Visualizações
- [ ] Gráficos de linha (faturamento)
- [ ] Gráficos de pizza (serviços)
- [ ] Gráficos de barra (barbeiros)
- [ ] Filtros personalizados
- [ ] Exportação de relatórios

---

## 🚀 Instalação e Execução

### Pré-requisitos

```
📦 Node.js (LTS - versão 18 ou superior)
🔧 Angular CLI 19
```

### Instalação do Angular CLI

```bash
npm install -g @angular/cli@19
```

### Configuração do Projeto

**1. Clone o repositório**
```bash
git clone https://github.com/Marcos-Gabriell/front-barbearia.git
cd barbershop-frontend
```

**2. Instale as dependências**
```bash
npm install
```

**3. Execute o servidor de desenvolvimento**
```bash
ng serve
```

**4. Acesse a aplicação**
```
http://localhost:4200
```

### Build para Produção

```bash
ng build --configuration production
```

Os arquivos de build estarão em `dist/barbershop-frontend/`

---

## 🏗️ Arquitetura

### Princípios Arquiteturais

**Standalone Components:**
- Sem uso de NgModules
- Imports diretos nos componentes
- Melhor tree-shaking e performance

**Serviços Desacoplados:**
- AuthService (autenticação)
- UserService (gestão de usuários)
- ServiceService (catálogo de serviços)
- ScheduleService (gestão de agendas)
- ThemeService (temas)
- Cada serviço com responsabilidade única

**Reactive Forms:**
- Validações síncronas e assíncronas
- Controle fino de estado
- Feedback visual imediato

---

## 🔒 Segurança

### Autenticação
- Login com JWT
- Tokens armazenados de forma segura
- Refresh token automático
- Logout com limpeza de sessão

### Proteção de Rotas
```typescript
// Exemplo de rota protegida
{
  path: 'users',
  component: UsersComponent,
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['ADMIN', 'DEV'] }
}
```

### HTTP Interceptor
```typescript
// Anexa JWT automaticamente
intercept(req: HttpRequest<any>, next: HttpHandler) {
  const token = this.authService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next.handle(req);
}
```

---


## 🧪 Validações

### Reactive Forms

**Validações Síncronas:**
- Required
- Email
- MinLength
- MaxLength
- Pattern

**Validações Assíncronas:**
- Email único (verifica no backend)
- Token válido

**Validações Customizadas:**
- Senha forte (maiúscula, minúscula, número, caractere especial)
- Confirmação de senha
- Horários válidos (início < fim)
- Conflito de horários de pausa

**Exemplo:**
```typescript
this.form = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [
    Validators.required,
    Validators.minLength(8),
    this.strongPasswordValidator()
  ]]
});
```

---

## 📱 Responsividade

- **Mobile First**: Design pensado para mobile
- **Breakpoints**: Desktop (1024px+), Tablet (768px), Mobile (< 768px)
- **Componentes Adaptáveis**: Tabelas viram cards em mobile
- **Menu Responsivo**: Sidebar que colapsa em mobile

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Padrões de Código
- Seguir o guia de estilo do Angular
- Componentes standalone
- Services injetáveis com `providedIn: 'root'`
- Reactive Forms para formulários complexos
- TypeScript strict mode

---

## 📞 Suporte

Para dúvidas, sugestões ou reportar bugs, abra uma [issue](../../issues) no repositório.

---
