# 💈 Falcão Barbearia – Web Panel (Frontend)

Painel web de gestão para barbearias, desenvolvido com **Angular 19**, consumindo uma **API REST em Java / Spring Boot**.
O sistema oferece uma interface moderna, segura e escalável para administração de usuários, autenticação, perfis, agendamentos, clientes, financeiro e catálogo de serviços.

---

## 🚀 Tecnologias Utilizadas

- **Angular 19**
- **TypeScript**
- **Standalone Components**
- **Angular Router**
- **Reactive Forms**
- **JWT (JSON Web Token)**
- **CSS moderno (Dark / Light Theme)**
- **Integração com API Java / Spring Boot**

---

## 🧱 Arquitetura Frontend

O projeto segue boas práticas de arquitetura frontend, com foco em:

- Separação de responsabilidades
- Componentização
- Segurança na navegação
- Experiência do usuário (UX)
- Escalabilidade e manutenção

Destaques técnicos:

- Uso de **Standalone Components** (sem NgModules)
- Serviços desacoplados para autenticação, usuários e preferências
- Interceptors e Guards centralizados
- Validações robustas com **Reactive Forms**

---

## 🔐 Segurança Avançada (JWT)

A segurança da aplicação é baseada em **JWT**, integrada diretamente com o backend Spring Boot.

### 🔁 HTTP Interceptor

- Anexa automaticamente o **token JWT** no header `Authorization`
- Centraliza o tratamento de erros de autenticação (401 / 403)

### 🛡️ Route Guards

- Proteção de rotas baseada em autenticação e perfil do usuário
- Separação entre rotas públicas, autenticadas e administrativas
- Bloqueio de acesso não autorizado via URL direta

---

## ✅ Funcionalidades Implementadas

### 🔑 Autenticação

- **Login** seguro com validação via Reactive Forms
- **Esqueci Minha Senha** – fluxo completo de recuperação (envio de token por e-mail e redefinição)

### ✉️ Criação de Conta via Convite

- Validação obrigatória de **Token de Convite via URL**
- Liberação do formulário apenas após validação do token

### 📊 Dashboard

- Indicadores estratégicos da barbearia
- Métricas de agendamentos, usuários, clientes e serviços
- Visualizações gráficas para apoio à tomada de decisão

### 💰 Financeiro

- Controle financeiro da barbearia
- Acompanhamento de receitas e movimentações

### 🧾 Catálogo de Serviços

- Cadastro e gestão de serviços da barbearia
- Definição de preços, duração e status
- Integração direta com o módulo de agendamento

### 📅 Agendamentos

- Agenda por barbeiro
- Controle de horários disponíveis e ocupados
- Integração direta com catálogo de serviços e clientes

### 👥 Usuários

- Listagem e gestão de usuários
- Gestão de permissões e status
- Interface administrativa organizada

### 🙍‍♂️ Clientes

- Cadastro e gestão de clientes
- Histórico e dados para uso no agendamento

### 🙋 Meu Perfil

- Tela de autoedição de perfil
- Atualização de dados pessoais e senha
- Validações completas com Reactive Forms

---

## 🎨 UX / UI – Sistema de Temas

- **Dark Mode 🌙** e **Light Mode ☀️**
- Persistência da preferência do usuário
- Aplicação imediata do tema

---

## 🧪 Validações com Reactive Forms

- Validações síncronas e assíncronas
- Controle de estado de formulários
- Feedback visual claro ao usuário

---

## ⚙️ Instalação e Execução

### Pré-requisitos

- Node.js (LTS)
- Angular CLI

### 📦 Instalação

```bash
npm install
```

### ▶️ Executar

```bash
ng serve
```

Acesse:

```
http://localhost:4200
```

---

## 🔗 Integração com Backend

Consome uma **API REST em Java / Spring Boot**, responsável por:

- Autenticação e autorização
- Emissão e validação de JWT
- Gestão de usuários, clientes, agendamentos, serviços e financeiro

---

## 📌 Status do Projeto

✅ **Módulos principais concluídos** – login, recuperação de senha, criação de conta via convite, dashboard, financeiro, catálogo de serviços, agendamentos, usuários, clientes e perfil.
🚧 Melhorias e novos recursos continuam sendo implementados.

---

## 👨‍💻 Autor

Projeto desenvolvido com foco em **segurança**, **arquitetura limpa** e **experiência do usuário**.
