# Análise — task "Buscar contas sozinho pelas APIs e dar nota com o motivo"

- **SPEC:** `04_fase-atual/specs/spec-1-003-busca-automatica-contas.md`
- **Critérios:** CA-1-10 a CA-1-15 (TDD 1 a 5)
- **Sistema:** crm · **Skip:** 78281 · versão no ar `e7174eb`
- **Teste humano:** não (D-07 — fecha por prova automática).

## Objetivo e resultado observável

Depois que o perfil ideal é aprovado, o sistema busca sozinho as empresas que se encaixam, completa
os dados do CNPJ, dá nota de 0 a 100 com faixa A/B/C e mostra **o motivo de cada ponto**. O José não
monta lista: ele abre Contas e vê a fila pronta, com abas Prioridade, Fora do perfil e Pendentes.

## Estado atual

- Existem `clientes_atendidos`, `perfis_ideais` e as rotas `/backend/v1/perfis*`.
- `/contas` ainda abre `EmConstrucao` (SPEC-1-003).
- Não existe coleção de contas nem de buscas.
- `perfis_api.js` já tem o padrão de rota autenticada (guarda `acessos`) que vou repetir.
- **Restrição descoberta na SPEC-1-002:** o JSVM do PocketBase não deixa callback de rota
  (`runInTransaction`) enxergar o escopo da rota — nada de helpers de topo nem de transação.

## Arquivos/componentes (plano em código)

### Migrations

1. `0013_create_contas.js` — coleção `contas`:
   - `cliente` (relation `clientes_atendidos`, required, cascade), `empresa` (text, required),
     `cnpj` (text), `dominio` (text), `chave` (text, required), `fontes` (json),
     `porte`, `cnae`, `situacao`, `municipio`, `uf`, `abertura` (text), `capital_social` (number),
     `consultado_em` (date), `nota` (number), `faixa` (select A/B/C), `motivos` (json),
     `perfil_versao` (number), `situacao_triagem` (select `prioridade|fora_do_perfil|pendente_dados`),
     `etapa` (select `nova|prioridade|fora_do_perfil|pendente_dados`), `origem_carga` (text).
   - **Índice único (`cliente`, `chave`)** — é a idempotência do CA-1-11: `chave` = CNPJ só com
     dígitos, senão domínio, senão nome normalizado.
   - Regras `@request.auth.id != ''` nas cinco.
2. `0014_create_buscas.js` — coleção `buscas`: `cliente`, `perfil_versao`, `gatilho`
   (`aprovacao|botao|agenda|planilha`), `fonte`, `encontradas`, `novas`, `repetidas`, `falhas`,
   `cota_usada`, `inicio`, `fim`, `erro` (text), `created`.
   - Regras `@request.auth.id != ''`; leitura filtrada por carteira na rota.
3. `0015_seed_contas_ficticias.js` — cria 3 contas fictícias (ativa, inativa, excluída) para o
   TDD 4; removida em `0016_limpa_contas_ficticias.js` ao fim das provas.

### Hooks (cada um autocontido, sem helper de topo)

4. `buscar_contas.js` — `POST /backend/v1/contas/buscar` `{cliente, gatilho}`:
   1. guarda `acessos`; lê o perfil aprovado (sem ele, 400 "Aprove o perfil ideal antes de buscar.");
   2. **Fonte CNPJ/BrasilAPI** (`https://brasilapi.com.br/api/cnpj/v1/{cnpj}`) — consulta usada no
      completar; aqui entra pelas contas vindas da planilha que já têm CNPJ;
   3. **Fonte Apollo** — se `APOLLO_API_KEY` existir no cofre, `POST https://api.apollo.io/v1/
      organizations/search`; sem a chave, usa o **simulador** (3 empresas fictícias no mesmo
      formato) — plano B previsto na SPEC;
   4. **Fonte Anvisa** — dados abertos são um CSV grande; busco com `timeout: 20` e, se não vier no
      formato, registro falha na `buscas` e sigo (CA-1-15);
   5. deduplica pela `chave` antes de gravar, grava o que é novo, conta repetidas;
   6. grava uma linha em `buscas` por fonte com encontradas/novas/repetidas/falhas/cota.
   7. `completar_cnpj` roda inline para cada conta nova com CNPJ (RN-09: sem resposta →
      `pendente_dados`).
5. `triar_e_pontuar.js` — `onRecordAfterCreateSuccess` e `onRecordAfterUpdateSuccess` em `contas`:
   aplica RN-09 a RN-12 e grava `nota`, `faixa`, `motivos`, `situacao_triagem`, `etapa`.
   - RN-10: situação ≠ "ATIVA" → `fora_do_perfil`, motivo "CNPJ não ativo".
   - RN-11: casa exclusão do perfil → `fora_do_perfil`, motivo com o texto da exclusão.
   - RN-09: sem CNPJ ou sem retorno → `pendente_dados`.
   - RN-12: cada item de prioridade que casa vale `floor(100/itens)`; motivo lista `regra → pontos`
     e a soma é a nota; A ≥ 70, B 40–69, C < 40.
6. `contas_api.js` — `GET /backend/v1/contas?cliente=&aba=` lista por aba, e
   `POST /backend/v1/contas/planilha` importa linhas (`empresa`, `cnpj`, `cidade`, `uf`, `site`,
   `observacao`), validando cada linha e devolvendo o relatório por linha (CL-004).
7. `buscar_automatico.js` — `onRecordAfterUpdateSuccess` em `perfis_ideais`: quando o status vira
   `aprovado`, dispara a busca (CA-1-10). RN-13: recalcula as notas das contas da carteira com a
   versão nova do perfil.
8. `agenda_busca.js` — `cronAdd('busca_semanal', '0 7 * * 1', ...)`: toda segunda às 7h, uma busca
   por carteira com perfil aprovado.

### Frontend

9. `src/services/contas.ts` — tipos e chamadas (`listarContas`, `buscarAgora`, `importarPlanilha`,
   `listarBuscas`).
10. `src/pages/Contas.tsx` — três abas (Prioridade / Fora do perfil / Pendentes) com contagem,
    tabela no computador e cards no celular, botão "Buscar agora", e o histórico das buscas em
    `Sheet`.
11. `src/components/contas/TabelaContas.tsx`, `CardsContas.tsx`, `DetalheConta.tsx` (nota + faixa +
    lista "regra → pontos").

### Ficha de Tela — Contas (`/contas`)

- Quem usa e onde: José, computador e celular.
- Tarefa principal: ver a fila de contas prontas e entender por que cada uma está ali.
- Ação primária: "Buscar agora".
- Padrão: lista com abas (`padroes-de-tela.md` §1).
- Dados: empresa · CNPJ · cidade/UF · fonte · nota (número) · faixa (`Badge` A/B/C) · motivo.
- Ações: abrir a ficha (motivos), buscar agora, importar planilha, ver histórico.
- Estados: carregando · vazio de primeiro uso ("Nenhuma conta ainda. Aprove o perfil ideal…") ·
  vazio de aba · erro com "Tentar de novo" · buscando (botão com carregamento) · sucesso.
- Celular: cards; abas com rolagem; busca no topo.
- Acessibilidade: faixa em `Badge` com texto (nunca só cor), nota com rótulo "nota 82 de 100".

## Matriz critério → prova

| Critério | Prova |
|---|---|
| CA-1-10 | aprovar perfil → linha em `buscas` com as fontes e os contadores |
| CA-1-11 | rodar a busca 2× e importar a mesma planilha 2× → nenhuma conta repetida |
| CA-1-12 | conta com CNPJ real → porte, CNAE, situação, cidade e `consultado_em` |
| CA-1-13 | conta nova → `nota` = soma dos `motivos`, faixa coerente |
| CA-1-14 | CNPJ inativo e conta com exclusão → `fora_do_perfil` com motivo |
| CA-1-15 | fonte simulada fora do ar → falha em `buscas`, outras fontes seguem, nada descartado |

## Teste de mesa (nota)

| Caso | Entrada | Saída | Onde |
|---|---|---|---|
| Prioridade | empresa casa 2 de 4 itens de prioridade | nota 50, faixa B, 2 motivos | `triar_e_pontuar` |
| Todos | casa 4 de 4 | nota 100, faixa A | idem |
| Nenhum | casa 0 | nota 0, faixa C | idem |
| Inativa | situação "BAIXADA" | fora_do_perfil "CNPJ não ativo" | RN-10 |
| Excluída | exclusão "Sem e-commerce" casa | fora_do_perfil com a exclusão | RN-11 |
| Sem CNPJ | cnpj vazio | pendente_dados | RN-09 |

## Riscos

- **Anvisa**: CSV grande; se estourar tempo/memória, fica registrado como falha e as outras fontes
  seguem — exatamente o CA-1-15.
- **Apollo sem chave** (CL-010): simulador no mesmo formato; prova real quando a chave chegar.
- **Cota**: contador em `buscas.cota_usada`; ao chegar no limite da fonte, para e registra (RN-14).
- **Migration aditiva**: três coleções novas; `down` remove.
