# Análise — task "Cadastrar o cliente atendido e o perfil ideal sugerido por IA"

- **SPEC:** `04_fase-atual/specs/spec-1-002-cliente-atendido-perfil-ideal.md`
- **Critérios:** CA-1-05, CA-1-06, CA-1-07, CA-1-08, CA-1-09 (TDD 1 a 5)
- **Sistema:** crm · **Skip:** 78281 (Projeto Native) · versão no ar `0a0d0f5`
- **Última task da SPEC?** Sim (as 4 filhas de construção). Teste humano: **não** (D-07 — fecha por prova automática).

## Objetivo e resultado observável

O José abre Clientes, cadastra o cliente teste com site e dados de abordagem, clica em "Sugerir
perfil ideal" e recebe, em até 2 minutos, um perfil com tipo e porte de empresa, cargos, prioridade
e exclusões — cada item com a fonte. Ele aprova; o perfil vira o vigente com versão e data. Nenhuma
carteira enxerga dado de outra.

## Estado atual e erros encontrados

- Coleções existentes: `users` (auth) e `acessos`. Não existem `clientes_atendidos` nem
  `perfis_ideais`.
- `/clientes` abre `EmConstrucao` (SPEC-1-002) — nenhuma tela de cadastro.
- `acesso_guard_lista.js` e `acesso_guard_registro.js` já aplicam a RN-03 a **todas** as coleções:
  quem não tem registro ativo em `acessos` recebe 403. A RN-03 vale de graça para as coleções
  novas; a RN-05 (filtro por carteira) é trabalho desta task.
- `src/lib/mensagens-erro.ts` só tem `mensagemDeErro`; não tem `errosDeCampo` (usado pelas receitas).
  Vou acrescentar a função, sem mexer no que existe.
- `src/lib/formatos.ts` não existe.
- **Descoberta que melhora a SPEC:** o Skip Cloud já tem IA embutida via `$ai.chat` (guia
  `skip_cloud_ai_guide`). As credenciais do gateway são provisionadas pelo próprio Skip e a chamada
  é cobrada nos créditos do Skip; o guia é explícito: "Never ask the user for an API key". Ou seja,
  **a `IA_API_KEY` do CL-005 não é necessária** — o custo estimado de D-13 (R$ 15 a 25/mês) vira
  consumo de créditos do Skip. Não uso simulador: a função chama a IA real desde o início. Registro
  como observação na parada, porque é uma SPEC que ficou mais barata de operar, não mais cara — não
  muda escopo nem aceite, então não é `DÚVIDA:`.

## Arquivos/componentes afetados (plano em código)

### Migrations (aditivas, com `down`)

1. `pocketbase/migrations/0009_create_clientes_atendidos.js`
   - Coleção `clientes_atendidos` (base): `nome` (text, required, máx 120), `site` (url, required),
     `produtos` (text, máx 2000), `dores_solucoes` (text, máx 4000), `playbook` (text, máx 8000),
     `closer_nome` (text, máx 120), `closer_email` (email), `regras_prioridade` (text, máx 4000),
     `ativo` (bool), `created`, `updated`.
   - Índice único em `nome` (idempotência exigida pela tabela de dados da SPEC).
   - Regras: `list`/`view`/`create`/`update`/`delete` = `@request.auth.id != ''`. A RN-03 é
     garantida pelos hooks de guarda; a RN-05 é aplicada pelos hooks de carteira (item 5).
2. `pocketbase/migrations/0010_create_perfis_ideais.js`
   - Coleção `perfis_ideais` (base): `cliente` (relation → `clientes_atendidos`, required,
     `cascadeDelete: true`, `maxSelect: 1`), `versao` (number, required), `status` (select
     `sugerido|aprovado|substituido`, required), `tipo_empresa` (text), `porte` (text),
     `cargos` (json), `prioridade` (json), `exclusoes` (json), `fontes` (json), `aprovado_em`
     (date), `observacao` (text), `created`, `updated`.
   - Índice único em (`cliente`, `versao`) — impede versão duplicada por corrida.
   - Regras: `@request.auth.id != ''` nas cinco; RN-05 pelos hooks.
   - `cargos`, `prioridade` e `exclusoes` são **json** (listas de objetos `{ valor, fonte }`), porque
     a SPEC pede a fonte **por item** e um campo texto não sustenta isso sem virar string solta.

### Hooks

3. `pocketbase/hooks/carteira_perfis.js` — guarda da RN-05, só onde há carteira a filtrar. Em
   `clientes_atendidos` não cabe filtro: cada registro **é** uma carteira, e o José precisa ver
   todas (D-02, operador único) — a RN-03 já é garantida pelos hooks existentes. Em `perfis_ideais`,
   que é dado **dentro** de uma carteira:
   - `onRecordsListRequest`: superusuário passa; autenticado sem `acessos` ativo recebe 403; e a
     lista exige `:request.query.cliente` (id da carteira) — sem ele, 400 "Informe a carteira.";
     com ele, o servidor acrescenta o vínculo ao filtro, de modo que pedir a carteira B nunca
     devolve perfil de A.
   - `onRecordViewRequest`: confere que o `cliente` do perfil é o mesmo `:request.query.cliente`
     da consulta; divergência recebe 403.
   É a prova técnica do CA-1-06 no servidor, não só no botão da tela.
5. `pocketbase/hooks/criar_perfil_sugerido.js` — `routerAdd('POST', '/backend/v1/perfis/sugerir')`:
   valida `cliente` e `site` no corpo, lê o site com `$http.send` (timeout 20 s, só http/https),
   monta o prompt, chama `$ai.chat({ model: 'fast' })` pedindo JSON, faz o parse defensivo,
   descarta item sem fonte (RN-08), calcula `versao` = maior existente + 1, grava como `sugerido` e
   devolve o perfil. Erro de rede, site fora do ar, JSON inválido ou item sem fonte **não gravam
   nada** e respondem 502/400 com mensagem em PT. Roda dentro de `$app.runInTransaction` para o
   cálculo de `versao` não sofrer corrida.
6. `pocketbase/hooks/aprovar_perfil.js` — `routerAdd('POST', '/backend/v1/perfis/{id}/aprovar')`:
   confere que o perfil existe e pertence a uma carteira do operador; dentro de uma transação marca
   o anterior `aprovado` desta carteira como `substituido` (RN-07) e grava o novo como `aprovado`
   com `aprovado_em`. Corpo aceita os ajustes opcionais (`tipo_empresa`, `porte`, `cargos`,
   `prioridade`, `exclusoes`), que viram uma **versão nova** (N+1), nunca edição da anterior.

### Frontend

7. `src/services/clientesAtendidos.ts` — tipos `ClienteAtendido`/`ClienteEntrada`, `listarClientes`,
   `obterCliente`, `criarCliente`, `atualizarCliente`. `pb` só aqui.
8. `src/services/perfisIdeais.ts` — tipo `PerfilIdeal` (com `fontes` tipado), `listarPerfis(cliente)`,
   `sugerirPerfil(clienteId)`, `aprovarPerfil(id, ajustes)`. As duas últimas por `pb.send`.
9. `src/lib/mensagens-erro.ts` — **acrescentar** `errosDeCampo(erro)` ao arquivo existente, sem
   mudar `mensagemDeErro`.
10. `src/lib/formatos.ts` — `formatarData`/`formatarDataHora` (pt-BR).
11. `src/pages/Clientes.tsx` — substitui o `EmConstrucao` por lista (tabela no computador, cards no
    celular), busca com espera de 300 ms, estados carregando/vazio/erro, botão "Novo cliente".
12. `src/components/clientes/FormularioCliente.tsx` — `Dialog` com `react-hook-form` + `zod`:
    `nome`, `site`, `produtos`, `dores_solucoes`, `playbook`, `closer_nome`, `closer_email`,
    `regras_prioridade`, `ativo`. Obrigatórios: `nome` e `site`. Mais de 6 campos ⇒ agrupo em duas
    seções por assunto dentro do diálogo largo (`sm:max-w-2xl`).
13. `src/components/clientes/PerfilIdeal.tsx` — na ficha do cliente: perfil vigente (versão, data,
    status em `Badge`), lista dos itens com a fonte de cada um, botão "Sugerir perfil ideal" com
    carregamento, e "Aprovar"/"Ajustar e aprovar".
14. `src/components/clientes/FichaCliente.tsx` — rota `/clientes/:id` com dados do cliente, seção de
    perfis (versões: vigente e substituídas) e o `PerfilIdeal`.
15. `src/pages/ClienteDetalhe.tsx` — página que carrega a ficha pela rota.
16. `src/App.tsx` — rota `/clientes/:id` dentro do `Layout`, sob `ProtecaoAcesso`.

### Ficha de Tela — Clientes (`/clientes`)

- Quem usa e onde: José, computador e celular.
- Tarefa principal: cadastrar e encontrar um cliente atendido.
- Ação primária: "Novo cliente".
- Padrão: lista/cadastro (`padroes-de-tela.md` §1).
- Dados: nome (texto) · site (link) · closer (texto) · ativo (Badge) · cadastro (data pt-BR).
- Ações e permissões: criar/editar → qualquer usuário liberado em `acessos` → regras da coleção +
  hooks de carteira.
- Estados: carregando (Skeleton) · vazio de primeiro uso ("Nenhum cliente cadastrado" + botão) ·
  vazio de busca ("Nenhum resultado para…" + limpar) · erro com "Tentar de novo" · sucesso (toast).
- Validações: `nome` ≥ 2 e único → "Este nome já está em uso."; `site` → "Informe o endereço do
  site, como https://empresa.com.br."; `closer_email` → "Informe um e-mail válido."
- Celular: tabela vira cards; busca no topo; botão em largura total.
- Acessibilidade: rótulos visíveis, obrigatórios com "*" e legenda, foco visível, `aria-label` na
  ação de ícone, contraste por token.
- Textos: "Clientes", "Novo cliente", "Sugerir perfil ideal", "Aprovar", "Ajustar e aprovar".
- Reuso: `Button`, `Input`, `Textarea`, `Dialog`, `Table`, `Card`, `Badge`, `Skeleton`, `Alert`.

### Ficha de Tela — Ficha do cliente (`/clientes/:id`)

- Tarefa principal: ver o cliente, gerar e aprovar o perfil ideal.
- Ação primária: "Sugerir perfil ideal" (quando não há perfil) ou "Ajustar e aprovar" (quando há).
- Padrão: detalhe do registro (`padroes-de-tela.md` §3).
- Dados: dados do cliente · perfil vigente (versão, data, status) · itens do perfil com fonte ·
  histórico de versões.
- Estados: carregando · cliente não encontrado ("Cliente não encontrado" + voltar à lista) · sem
  perfil · sugerindo (botão com carregamento e aviso de até 2 min) · falha na sugestão ("Não deu
  para sugerir agora" + tentar de novo) · site não lido ("site não lido" na fonte) · sucesso.
- Validações: ajuste com lista vazia → mantém o item anterior.
- Celular: seções empilhadas, itens do perfil em lista com a fonte abaixo.
- Acessibilidade: status nunca só por cor (`Badge` com texto), âncoras de seção com `h2`.
- Textos: "Perfil ideal", "Vigente", "Sugerido", "Substituído", "Fonte: site / cadastro / José".

## Matriz critério → prova

| Critério | Como é provado |
|---|---|
| CA-1-05 | `curl` POST sem `nome` e sem `site` → 400 com mensagem por campo (`red.txt`) |
| CA-1-06 | carteiras A e B com 1 perfil cada; `curl` de A em `/clientes_atendidos` e em `/perfis_ideais?cliente=A` → nada de B; leitura de `perfis_ideais` sem `cliente` → 400 (`green-carteiras.txt`) |
| CA-1-07 | `curl` POST `/backend/v1/perfis/sugerir` com site real → perfil `sugerido` com `fontes` por item; item sem fonte descartado (`green-sugestao.txt`) |
| CA-1-08 | aprovar e conferir `status=aprovado` + `aprovado_em` + `versao` ; antes disso, o vigente não aparece (`green-aprovacao.txt`) |
| CA-1-09 | ajustar o aprovado → versão 2 vigente, versão 1 `substituido`; IA fora do ar e JSON inválido não gravam (`regressao.txt`) |
| RN-08 | resposta da IA com item sem fonte → item ausente no perfil gravado |
| RN-05 | leitura cruzada de carteira recusada no servidor |

## Teste de mesa

| Caso | Entrada | Saída esperada | Onde o código garante |
|---|---|---|---|
| Principal | nome "Cliente Teste", site válido | cliente criado, toast "Cliente cadastrado." | `FormularioCliente.enviar` + regra da coleção |
| Limite | nome com 1 caractere | recusado no campo nome | `zod` `min(2)` |
| Erro | nome repetido | "Este nome já está em uso." no campo | índice único + `errosDeCampo` |
| Erro | site "abc" | "Informe o endereço do site…" | `zod` `.url()` |
| Sugestão | site responde e IA devolve JSON válido | perfil `sugerido` v1 com fontes | `criar_perfil_sugerido` |
| Sugestão | site não abre | 502 "Site não respondeu"; nada gravado | `$http.send` em try/catch |
| Sugestão | IA devolve JSON inválido | 502; nada gravado | parse defensivo |
| Sugestão | item sem `fonte` | item descartado | RN-08 no laço |
| Aprovação | aprovar perfil v1 | v1 `aprovado` + `aprovado_em` | `aprovar_perfil` |
| Ajuste | ajustar aprovado | v2 `aprovado`, v1 `substituido` | `aprovar_perfil` (transação) |
| Carteira | listar perfis de A pedindo B | 403/400, nada de B | `carteira_perfis` |

## Riscos, erros e segurança

- **Migration aditiva**: duas coleções novas, nenhum campo existente alterado. `down` remove as
  coleções criadas. Preview e produção compartilham banco — nada destrutivo.
- **Site lento**: `$http.send` com `timeout: 20`; estouro cai em "Site não respondeu", não trava.
- **SSRF**: aceito apenas `http`/`https`, e recuso host interno (`localhost`, `127.0.0.1`, `10.`,
  `192.168.`, `169.254.`) antes de buscar.
- **Prompt injection no site**: o conteúdo do site entra como **dado** delimitado, com instrução
  explícita para ignorar comandos vindos dele; a saída passa por validação de formato e a fonte é
  conferida contra a lista permitida (`site`, `cadastro`, `josé`). Item que não passar é descartado.
- **Custo**: uma chamada `fast` por sugestão, texto do site truncado em 20 mil caracteres.
- **Sem segredo novo**: `$ai` não exige chave; nada de `IA_API_KEY` no código.
- **LGPD**: dados do cliente teste ficam na coleção, que é interna e fechada; nada vai para
  `06_notas/`.
- **Timeout da rota**: a rota pode passar dos 30 s padrão (site 20 s + IA). Vou medir na prova; se
  estourar, reduzo o timeout do site para 12 s.

## Perguntas reais

Nenhuma que bloqueie. As duas pendências são insumos já previstos:
- **CL-003** (dados do cliente teste): cadastro com dados fictícios de teste para provar, e troco
  pelos reais quando o José informar.
- **CL-005** (chave da IA): **deixa de ser necessária** — o Skip já provisiona a IA. Registro na
  parada para o José não perder tempo colando chave.

## Roteiro de verificação automática

1. Migrations aplicadas; coleções e índices conferidos.
2. `curl` do RED (sem obrigatórios) e dos GREEN de carteira, sugestão e aprovação.
3. Regressão: ajuste, IA fora do ar, JSON inválido e limpeza dos fictícios.
4. QA do Skip verde, publicação provada e espelho no repositório.
5. Revisão de UI pelo checklist e teste de mesa refeito no código final.
