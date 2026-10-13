# Ruah Base

Template base oficial para criação de novas ferramentas e sistemas web na Ruah (baseado na arquitetura do **Finfisc**).

Construído com:
- **TanStack Start** (Modo SPA estático com pré-renderização)
- **TanStack Router** (Roteamento baseado em arquivos)
- **TanStack Query** (Cache e sincronização de dados)
- **Vite** + **Tailwind CSS v4**
- **shadcn/ui** (Kit completo de componentes acessíveis com Radix UI)

---

## 🚀 Como Criar um Novo Projeto

A partir da pasta do `ruah-base`, execute o comando:

```bash
npm run new-project -- <target-dir> "<App Name>" <slug> <app-id> [basepath]
```

*Ou diretamente via script shell:*
```bash
./scripts/new-project.sh <target-dir> "<App Name>" <slug> <app-id> [basepath]
```

### 📋 Parâmetros do Comando

| Parâmetro | Obrigatório | Exemplo | Descrição |
| :--- | :---: | :--- | :--- |
| `<target-dir>` | **Sim** | `../estoque` ou `/home/talison/dev/estoque` | Diretório onde a nova aplicação será criada. Não pode conter arquivos pré-existentes. |
| `"<App Name>"` | **Sim** | `"Controle de Estoque"` | Nome de exibição da ferramenta. Aparece no cabeçalho da sidebar, na tela de login e no título das páginas (`<title>`). |
| `<slug>` | **Sim** | `estoque` | Identificador da aplicação em minúsculas (kebab-case). Define o nome em `package.json` e a chave única de sessão no localStorage (ex: `ruah_estoque_token`), impedindo conflitos de login entre diferentes ferramentas no mesmo domínio. |
| `<app-id>` | **Sim** | `21` | ID numérico registrado no Portal J-One e no backend da API para autenticação e permissões de acesso. |
| `[basepath]` | *Opcional* | `/estoque` | Subcaminho da URL onde a aplicação será hospedada em produção (ex: `https://meudominio.com/estoque`). Se omitido, o projeto é configurado para a raiz (`/`). |

---

## 💡 Exemplos Práticos de Uso

### Exemplo 1: Ferramenta hospedada em subdiretório (`/estoque`)
```bash
# 1. Gerar o novo projeto a partir do ruah-base
npm run new-project -- ../estoque "Controle de Estoque" estoque 21 /estoque

# 2. Entrar na pasta do novo projeto
cd ../estoque

# 3. Instalar dependências e rodar localmente
npm install
npm run dev
```

### Exemplo 2: Ferramenta hospedada na raiz (`/`)
```bash
# 1. Gerar o novo projeto na raiz
npm run new-project -- ../portaria "Controle de Portaria" portaria 14

# 2. Entrar na pasta, instalar e executar
cd ../portaria
npm install
npm run dev
```

---

## ⚙️ O que o comando faz automaticamente?

1. **Cópia Limpa**: Clona toda a estrutura base (componentes shadcn, estilos, layouts, hooks e cliente de API), ignorando pastas pesadas e desnecessárias (`node_modules`, `dist`, `.git`, `.output`, `.tanstack`, `.env`).
2. **Rebranding Imediato**: Atualiza `src/app.config.ts` com o nome da sua aplicação, subtítulo padrão, ID da aplicação e chave de armazenamento local (`storageKey`) única.
3. **Isolamento de Sessão**: Cria uma chave exclusiva de localStorage para evitar que fazer logout em uma aplicação deslogue as outras.
4. **Configuração de Ambiente**: Cria `.env` e `.env.example` já preenchidos com o `VITE_APP_ID` e `VITE_BASEPATH` corretos.
5. **Configuração de Rotas e Vite**: Ajusta o `vite.config.ts` e o roteador para lidar de forma nativa com o `basepath` definido.
6. **Repositório Git**: Inicializa automaticamente um novo repositório git (`git init`) pronto para o primeiro commit.

---

## 📦 O que já vem pronto na base?

- 🎨 **Tema e Estilos**: Identidade visual institucional da Ruah (`src/styles.css`), incluindo paleta verde escuro e creme, animação de shimmer, scrollbars estilizadas e suporte completo a classes utilitárias do Tailwind v4.
- 🧩 **Componentes UI**: Mais de 40 componentes shadcn/ui prontos em `src/components/ui/` (botões, tabelas, modais, gavetas, inputs, dropdowns, tooltips, cards, tabs, etc.).
- 🔐 **Autenticação Dupla**:
  - Login direto por usuário e senha com feedback visual e mensagens amigáveis de erro (`src/components/login-screen.tsx`).
  - Integração transparente com o **Portal J-One** (recebimento de credenciais via `postMessage`, autenticação de ticket SSO de uso único, troca de token e botão "Voltar ao Portal").
  - Tratamento global de sessão expirada (401) com interceptação automática de requisições.
- 🌐 **Cliente HTTP / API**: `apiGet`, `apiPost`, `apiPut` e `apiDelete` em `src/lib/api-client.ts`, já incluindo cabeçalho `Bearer`, tratamento de erros com mensagens em português e tratamento de CORS.
- 📐 **Layout Padrão**:
  - Sidebar retrátil moderna com itens de navegação ativos, expansão/recolhimento e exibição do usuário logado (`src/components/app-sidebar.tsx`).
  - Cabeçalho padronizado de página (`src/components/page-header.tsx`) com disparador da sidebar e área para botões de ação.
  - Telas elegantes de 404 e boundary de erros.
- 📊 **Tabelas e Exportação CSV**: Modelo pronto com cabeçalho fixo, busca rápida e exportação CSV formatada no padrão brasileiro (delimitador `;`, decimais com vírgula e UTF-8 com BOM para Excel) em `src/routes/exemplo-tabela.tsx` e `src/utils/export-csv.ts`.
- 🔔 **Notas de Atualização**: Modal automático de novidades da versão (`src/components/release-notes-modal.tsx`), gerenciado pelo arquivo `src/data/versions.json`.

---

## 🛠️ Onde Customizar o Novo Projeto

| O que você quer alterar | Onde alterar | Descrição |
| :--- | :--- | :--- |
| **Nome, títulos e IDs padrão** | [`src/app.config.ts`](file:///src/app.config.ts) | Centraliza o nome do sistema, tagline de login e ID padrão do app. |
| **Variáveis de ambiente** | [`.env`](file:///.env) | `VITE_API_URL`, `VITE_APP_ID` e `VITE_BASEPATH`. |
| **Menu lateral (Sidebar)** | [`src/components/app-sidebar.tsx`](file:///src/components/app-sidebar.tsx) | Edite os arrays `mainItems` e `systemItems` com os links e ícones desejados. |
| **Criar novas páginas** | [`src/routes/`](file:///src/routes/) | Crie arquivos como `src/routes/pedidos.tsx`. O TanStack Router cria as rotas automaticamente. |
| **Chamadas de API do sistema** | [`src/lib/`](file:///src/lib/) | Crie um arquivo (ex: `src/lib/estoque-api.ts`) usando as funções utilitárias de `api-client.ts`. |
| **Notas de lançamento** | [`src/data/versions.json`](file:///src/data/versions.json) | Adicione novas versões para exibir o modal de novidades aos usuários após o login. |
| **Cores e tema** | [`src/styles.css`](file:///src/styles.css) | Modifique as variáveis CSS do `:root` ou `@theme inline`. |

---

## 📜 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento local.
- `npm run build`: Compila o projeto estático e pré-renderiza as rotas em `dist/client`.
- `npm run preview`: Testa localmente os arquivos gerados em `dist/client`.
- `npm run typecheck` / `npm run test`: Valida a tipagem TypeScript em todo o projeto.
- `npm run lint`: Executa a verificação do ESLint.
- `npm run format`: Formata todos os arquivos com o Prettier.
- `npm run new-project`: Gera um novo projeto a partir desta base.
