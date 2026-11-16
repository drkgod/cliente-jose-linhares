# Mapa — crm (versão Skip 43bddaf)

Sistema: CRM da JLA ("JLA — CRM de prospecção"), construído no projeto Skip "Projeto Native" (78281).

## Rotas
| Rota | Página | Componentes principais | Serviços |
|---|---|---|---|
| `/` | `src/pages/Index.tsx` (template, será substituída) | `Layout` | nenhum |
| `*` | `src/pages/NotFound.tsx` | nenhum | nenhum |

## Coleções
| Coleção | Campos principais | Regras de acesso (list/view/create/update/delete) |
|---|---|---|
| `users` (auth) | `name`, `avatar`, `created`, `updated` | `id = @request.auth.id` (list/view/update/delete), create público |

## Componentes reutilizáveis do projeto
- `src/components/Layout.tsx` — só `<Outlet />` dentro de `<main>`; é onde o menu deve entrar.
- `src/components/ui/*` — biblioteca shadcn completa (button, card, input, alert, dialog, form, table, skeleton…). Não se edita.
- `src/components/ui/toast` + `sonner` — avisos já montados em `App.tsx`.
- `src/lib/pocketbase/client.ts` — instância `pb`; `autoCancellation(false)`.
- `src/lib/pocketbase/errors.ts` — `extractFieldErrors`, `getErrorMessage`.
- `src/hooks/use-realtime.ts` — assinatura de mudanças em coleção.
- `src/lib/utils.ts` — `cn`.

## Padrões observados
- TypeScript + React 19, componentes funcionais exportados por `export default` nas páginas e `export function` nos componentes.
- Imports com alias `@/`.
- Sem `src/services/` ainda; as telas novas criam esse diretório.
- `index.html` com título genérico do template ("Um incrível projeto do Skip") — será ajustado.
- `App.tsx` centraliza rotas dentro de `<Route element={<Layout />}>`.

## Arquivos gerados que não se editam
`.skip.config.json`, `src/lib/pocketbase/client.ts`, `src/lib/pocketbase/errors.ts`, `src/hooks/use-realtime.ts`, `src/components/ui/*`, `package.json`, lockfiles, `vite.config.ts`, `tsconfig*.json`, `.oxlintrc.json`.

## Backend
- Backend URL: `https://projeto-native-60baf.shrd01.internal.goskip.dev` (`/api/health` responde 200).
- Migrações existentes: `1794833811_updated_users` (applied) — a partir dela, numeração 4 dígitos `0001…`.
- Segredos de sistema: `PB_INSTANCE_URL`, `PB_SUPERUSER_TOKEN`, `SITE_URL`, `SKIP_AI_*`, `SKIP_CONNECTORS_*`. Nenhum segredo de negócio ainda.
- Hooks: nenhum.
