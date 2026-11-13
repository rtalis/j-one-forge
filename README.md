<p align="center">
  <img src="public/favicon.png" width="88" alt="J-One" />
</p>

<h1 align="center">J-One Forge</h1>

<p align="center">
  O molde das ferramentas internas J-One.<br/>
  Um comando, uma pergunta por vez, e a nova ferramenta já sai com login, layout e API prontos.
</p>

---

## Criar uma ferramenta

```bash
npm run create
```

O assistente pergunta o nome e o app id, sugere o resto e mostra um resumo antes de criar. A pasta é criada em `../<slug>` (ex.: `../controle-de-estoque`), a menos que você informe outra:

```text
⚒  J-One Forge — new J-One tool

? Tool name: Controle de Estoque
? J-One Portal app id: 21
? Slug (controle-de-estoque):
? Production sub-path ("/" = root) (/controle-de-estoque):
? Install dependencies now? (Y/n):
```

Aperte **Enter** para aceitar cada sugestão.

### Sem perguntas

```bash
npm run create -- "Controle de Estoque" 21 -y              # cria em ../controle-de-estoque
npm run create -- "Controle de Estoque" 21 ../estoque -y   # pasta opcional
```

Só o nome e o app id são obrigatórios. Para trocar alguma sugestão:

| Opção | Padrão | Para quê |
| :-- | :-- | :-- |
| `--slug <slug>` | gerado do nome | Nome do pacote e chave da sessão (`ruah_<slug>_token`) |
| `--base <path>` | `/<slug>` | Subcaminho em produção. Use `/` para a raiz |
| `--dir <pasta>` | `../<slug>` | Onde criar o projeto (ou o 3º argumento) |
| `--install` | não | Roda `npm install` no final |
| `-y` | | Aceita todas as sugestões |

### O que é gerado

- Cópia limpa do template, sem `node_modules`, `dist`, `.git` nem os scripts do Forge
- `src/app.config.ts` com nome, app id e chave de sessão própria, para o logout de uma ferramenta não derrubar as outras
- `.env` e `.env.example` com `VITE_APP_ID` e `VITE_BASEPATH`
- `README.md` curto da ferramenta e um `git init`

---

## O que já vem pronto

| | |
| :-- | :-- |
| **Login** | Usuário e senha, SSO do Portal J-One (ticket e `postMessage`), botão "Voltar ao Portal" e tratamento de sessão expirada |
| **Layout** | Sidebar retrátil, `PageHeader` padrão, telas de 404 e de erro |
| **API** | `apiGet`, `apiPost`, `apiPut` e `apiDelete` com token `Bearer` e erros em português |
| **Fallback de API** | `VITE_API_URL` (principal) e `VITE_API_BACKUP_URL` (reserva, aceita vários separados por vírgula) no `.env`; sem eles, vale `APP_CONFIG.apiUrls`. Sem resposta em 10 s, ou GET com 5xx, passa para o próximo e fica nele até recarregar — mesma lógica do Portal. Cada troca mostra um aviso no canto inferior direito (brilho enquanto tenta o reserva, depois "Usando o servidor reserva") |
| **Erros** | Toast do Sonner no padrão do Portal, com botão "Copiar" (relatório para o suporte, sem tokens). Aparece sozinho em qualquer erro de `useQuery`/`useMutation`; mude o texto com `meta: { erro: "..." }` ou desligue com `meta: { erro: false }`. Fora do React Query: `toastErro(titulo, err)` de `src/lib/erro-toast.tsx` |
| **Carregamento** | Shimmer no lugar de spinner: `TableSkeletonRows`, `CardsSkeleton` e `AppShellSkeleton` em `src/components/loading-skeletons.tsx` |
| **Tabelas** | Exemplo com cabeçalho fixo, ordenação, busca, linha de total e exportação CSV no padrão do Excel brasileiro |
| **Filtros** | Padrão do Excel (busca, "Selecionar todos", Limpar / Cancelar / OK): `FiltroExcel` na barra acima da tabela e `FiltroColuna` no cabeçalho, em `src/components/filtros/` |
| **Novidades** | Modal de release notes lido de `src/data/versions.json` |
| **Visual** | Tema verde e creme, mais de 40 componentes shadcn/ui, ícones J-One |

**Stack:** TanStack Start (SPA pré-renderizada), TanStack Router e Query, Vite, Tailwind CSS v4 e shadcn/ui.

---

## Onde mexer

| Quero mudar | Arquivo |
| :-- | :-- |
| Nome, textos do login e ids | `src/app.config.ts` |
| Endereços da API (em ordem) e subcaminho | `.env` |
| Itens do menu | `src/components/app-sidebar.tsx` |
| Páginas | `src/routes/` (cada arquivo vira uma rota) |
| Chamadas de API | `src/lib/` usando `api-client.ts` |
| Cores | `src/styles.css` |
| Ícones | `public/favicon.ico`, `favicon.png` e `apple-touch-icon.png` |

## Scripts

| Comando | Faz |
| :-- | :-- |
| `npm run create` | Cria uma nova ferramenta |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera o site estático em `dist/client` |
| `npm run preview` | Serve o build localmente |
| `npm run typecheck` | Valida o TypeScript |
| `npm run lint` / `format` | ESLint e Prettier |
