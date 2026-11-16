# Análise — task "Abrir o CRM da JLA no Skip com acesso só do José"

- **SPEC:** `04_fase-atual/specs/spec-1-001-crm-skip-acesso-restrito.md`
- **Critérios:** CA-1-01, CA-1-02, CA-1-03, CA-1-04 (TDD 1 a 5)
- **Sistema:** crm · **Skip:** 78281 (Projeto Native) · versão atual 43bddaf
- **Última task da SPEC?** Sim para CA-1-01 a CA-1-04. Teste humano: **não** (D-07 — fecha por prova automática).

## Objetivo e resultado observável

O José abre o endereço do sistema, faz login e vê a tela inicial "JLA — CRM de prospecção" com o
menu Clientes, Contas e Funil, cada item "em construção". Quem não tem login, ou tem login e não
está liberado em `acessos`, não vê nenhum dado.

## Estado atual e erros encontrados

- Projeto Skip em branco, versão `43bddaf`, template base: rotas `/` (Index genérico em inglês) e
  `*` (NotFound). Sem coleção própria, sem menu, sem login na tela.
- Coleções: só `users` (auth), com `create: ""` — **cadastro público aberto** (viola passo 2 da SPEC).
- Título da página ainda é o do template ("Um incrível projeto do Skip").
- Segredos: só os de sistema. Nenhum segredo de negócio.
- Baseline do Skip: pendência só `.skip.config.json` (da plataforma), nada inesperado. Produção
  ainda não publicada.

## Arquivos/componentes afetados (plano em código)

### Migrations

1. `pocketbase/migrations/0001_create_acessos.js`
   - Coleção `acessos` (base): `email` (text, required, único), `papel` (select `admin`),
     `ativo` (bool, default true), `criado_em` (date), `created`, `updated`.
   - Índice único em `email`.
   - Regras: `list`/`view` = `@request.auth.id != '' && email = @request.auth.email && ativo = true`;
     `create`/`update`/`delete` = `null` (só superusuário, pelo painel do Skip — decisão D-02/RN-04).
   - Fecha o cadastro público de `users`: `create` → `null`.
2. `pocketbase/migrations/0002_seed_acessos.js` — semente idempotente lida de segredos
   (`CRM_ADMIN_EMAIL`/`CRM_ADMIN_SENHA`, `CRM_TESTE_EMAIL`/`CRM_TESTE_SENHA`). Segredo ausente não
   falha a migration; apenas não cria. Nenhuma senha no código.
3. `pocketbase/migrations/0003_create_teste_acesso.js` — coleção temporária `teste_acesso` com
   `list`/`view` públicos (estado ANTES da RN-03, para o RED).
4. `pocketbase/migrations/0004_fechar_teste_acesso.js` — aplica a RN-03: `list`/`view` =
   `@request.auth.id != ''` (GREEN).

### Hooks

5. `pocketbase/hooks/acesso_guard_lista.js` — `onRecordsListRequest(..., 'acessos')`: superusuário
   passa; autenticado sem registro ativo em `acessos` recebe `ForbiddenError('Acesso não liberado.')`.
6. `pocketbase/hooks/acesso_guard_registro.js` — o mesmo para `onRecordViewRequest(..., 'acessos')`.
7. `pocketbase/hooks/cofre_teste.js` — rota `GET /backend/v1/cofre-teste` que lê `TESTE_COFRE` por
   `$secrets.get` e devolve só `{ configurado: true, tamanho: n }`. O valor nunca sai do servidor.
   Removida depois da prova (SPEC manda remover o segredo de teste).

### Frontend

8. `src/services/acessos.ts` — `verificarAcesso()`: lê o próprio registro em `acessos` pelo e-mail
   da sessão; devolve `autorizado`/`motivo`. Sem `pb` fora daqui.
9. `src/pages/Login.tsx` — formulário de e-mail e senha, `authWithPassword`, erro em PT-BR.
10. `src/components/ProtecaoAcesso.tsx` — sem sessão → Login; sessão sem liberação → "Acesso não
    liberado." com botão Sair; liberado → conteúdo.
11. `src/components/Layout.tsx` — cabeçalho com o nome do sistema, menu Clientes/Contas/Funil,
    e-mail do usuário e Sair.
12. `src/pages/Index.tsx` — tela inicial com os três itens "Em construção".
13. `src/pages/EmConstrucao.tsx` — página real que cada item abre, dizendo o que virá e em qual SPEC.
14. `src/App.tsx` — rotas `/clientes`, `/contas`, `/funil` dentro do `Layout`, todas sob a proteção.
15. `index.html` — título "JLA — CRM de prospecção".

### Ficha de Tela — tela inicial e menu (`/`)

- Quem usa e onde: José, no computador e no celular.
- Tarefa principal: confirmar que entrou no CRM certo e enxergar as três áreas.
- Ação primária: nenhuma (a ação do momento é entrar); Sair fica no cabeçalho.
- Padrão: página inicial com menu fixo e três cartões de status.
- Dados: nenhum dado de negócio; só o e-mail da sessão.
- Ações e permissões: entrar/sair → regra da coleção `acessos` + guarda no servidor.
- Estados: carregando (verificando acesso) · não autenticado (login) · sem permissão ("Acesso não
  liberado." + Sair) · autenticado e liberado (menu e cartões) · erro de rede com "Tentar de novo".
- Validações: e-mail e senha obrigatórios; erro do servidor exibido perto do formulário.
- Celular: menu vira lista no topo, cartões empilhados, alvos de 44 px.
- Acessibilidade: rótulos visíveis, foco visível, `aria-current` no item ativo, contraste dos tokens.
- Textos: "Entrar", "E-mail", "Senha", "Acesso não liberado.", "Em construção", "Sair".
- Reuso: `Button`, `Input`, `Card`, `Alert`, `Label`, `Skeleton`, `toast`.

### Ficha de Tela — login (`/` sem sessão)

- Tarefa principal: entrar no CRM com e-mail e senha.
- Ação primária: "Entrar". Estados: enviando (botão desabilitado com indicador), erro.
- Validações: campos obrigatórios; mensagem "E-mail ou senha incorretos." para 400/401.
- Sem cadastro público: nenhum link de "criar conta".

## Matriz critério → prova

| Critério | Como é provado |
|---|---|
| CA-1-01 | `curl` anônimo em `/api/collections/acessos/records` → recusa; app sem sessão mostra o login |
| CA-1-02 | `curl` com a conta de teste autenticada → 403 "Acesso não liberado."; app mostra a mensagem |
| CA-1-03 | login do admin → app mostra o menu com Clientes, Contas e Funil |
| CA-1-04 | `curl` em `/backend/v1/cofre-teste` → `{configurado:true,tamanho:n}`; busca do valor no código e nos logs |
| TDD 1 (RED) | `curl` anônimo em `teste_acesso` com regra pública → devolve o registro |
| TDD 2 (GREEN) | mesma leitura sem login e com a conta de teste → recusa nos dois casos |
| TDD 5 | depois: `teste_acesso` removida, `TESTE_COFRE` removido, conta de teste removida |

## Riscos, erros e segurança

- **Migration 0002 depende de segredos**: sem `CRM_ADMIN_EMAIL`/`CRM_ADMIN_SENHA` não há admin. Não
  falha, mas o sistema fica sem ninguém liberado — por isso os segredos são gravados antes de aplicar.
- **Preview e produção usam bancos diferentes**: os segredos precisam existir também em produção,
  senão o admin não é criado lá. Vou gravar nos dois ambientes.
- **Cadastro público fechado** impede auto-registro: correto para D-02, e é o que a SPEC pede.
- **`teste_acesso` é temporária**: removida no fim (TDD 5). Enquanto existir, é uma coleção sem dado real.
- **Senha nunca vai para o repositório**: só em segredo do Skip.
- LGPD: nenhum dado pessoal de terceiros nesta task; só e-mail e papel do próprio admin.

## Perguntas reais

1. **E-mail do José no Skip (CL-002)** — necessário para o admin definitivo. A SPEC permite seguir
   com a conta de teste enquanto ele não chega, então **não bloqueia**: construo e pergunto.

## Roteiro de verificação automática

1. Migrations aplicadas e coleções conferidas por `skip_cloud_get_collection_details`.
2. `curl` anônimo, `curl` com conta de teste e `curl` com admin, contra o backend.
3. `curl` no cofre de teste.
4. QA do Skip verde, publicação provada, espelho dos arquivos no repositório.
