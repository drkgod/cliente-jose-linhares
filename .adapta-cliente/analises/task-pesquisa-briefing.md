# Análise — task "Pesquisar sozinho cada conta priorizada e escrever o briefing"

- **SPEC:** `04_fase-atual/specs/spec-1-004-pesquisa-automatica-briefing.md`
- **Critérios:** CA-1-16 a CA-1-20 (TDD 1 a 5) · **Skip:** 78281 · versão no ar `e17e436`
- **Teste humano:** não (D-07).

## Objetivo

Toda conta que entra em Prioridade é pesquisada sozinha: o sistema lê o site e marca maturidade
digital com evidência, traz até 5 decisores pela Apollo e escreve o briefing de abertura com a IA,
cada item com fonte. O José corrige o que vier errado e a correção não é sobrescrita.

## Estado atual

- Existem `contas` (com `situacao_triagem`), `buscas`, `perfis_ideais` e as rotas `/backend/v1/contas*`.
- Não existem `pesquisas` nem `decisores`; nenhuma tela de conta individual.
- **Restrições do JSVM aprendidas:** sem função de topo em callback, sem `runInTransaction`. A
  comunicação entre partes é por rota interna (`PB_INSTANCE_URL` + `PB_SUPERUSER_TOKEN`), que já
  funcionou na SPEC-1-003.

## Arquivos

### Migrations
1. `0015_create_pesquisas.js` — `pesquisas`: `cliente`, `conta` (unique: uma vigente por conta),
   `maturidade` (json), `briefing` (json), `fontes` (json), `status`
   (`ok|parcial|pendente`), `motivo`, `corrigido_por_jose` (bool), `tentativas` (number),
   `feito_em` (date), `nota_maturidade` (number).
2. `0016_create_decisores.js` — `decisores`: `cliente`, `conta`, `nome`, `cargo`, `senioridade`,
   `fonte`, `ativo`, `corrigido`. Índice único (`conta`, `nome`).

### Hooks — `pesquisa_conta.js`
3. `POST /backend/v1/pesquisas/pesquisar` `{conta}`:
   1. limite diário (RN-15): conta as pesquisas feitas hoje; no limite, grava `pendente` com motivo
      "limite diário" e **não chama nada externo**;
   2. **site** (até 3 páginas, timeout 20 s): lê HTML e procura marcadores de CRM, pixel e
      automação; cada item vira `sim|nao|nao_lido` **com a evidência** (RN-16);
   3. **Apollo** (chave no cofre, senão simulador): até 5 decisores com nome, cargo, senioridade —
      nunca e-mail ou telefone (CA-1-18);
   4. **briefing** por `$ai.chat` com JSON validado; dor sem fonte vira "a confirmar" (RN-18);
   5. recalcula a nota com a maturidade (RN-17) e grava em `contas`, marcando
      `origem_recalculo = pesquisa` para o hook de triagem não desfazer;
   6. grava a `pesquisa` com `status` `ok|parcial|pendente` e o motivo;
   7. respeita correção do José: item já corrigido não é sobrescrito (RN-19).
4. `POST /backend/v1/pesquisas/{id}/corrigir` — grava a correção do José e marca `corrigido_por_jose`.
5. `GET /backend/v1/pesquisas?conta=` — devolve pesquisa + decisores da conta.
6. `onRecordAfterUpdateSuccess` em `contas`: quando `situacao_triagem` passa a `prioridade`, chama a
   rota acima com `gatilho: prioridade` (CA-1-16).
7. `cronAdd('pesquisa_reprocessa', '20 * * * *')` — a cada hora, retenta pesquisas `pendente`/
   `parcial` (CA-1-20).

### Frontend
8. `src/services/pesquisas.ts` — tipos e chamadas.
9. `src/pages/ContaDetalhe.tsx` — rota `/contas/:id`: dados da conta, maturidade com evidência,
   decisores, briefing com fontes, botões "Pesquisar de novo" e "Corrigir".
10. `src/components/contas/SecaoPesquisa.tsx` — a seção propriamente dita.
11. `src/App.tsx` — rota `/contas/:id`; `TelaContas` linka a empresa para a ficha.

### Ficha de Tela — Pesquisa (`/contas/:id`)
- Tarefa principal: ler o briefing e a maturidade e corrigir o que estiver errado.
- Ação primária: "Pesquisar de novo".
- Padrão: detalhe do registro (`padroes-de-tela.md` §3).
- Estados: carregando · sem pesquisa ("A pesquisa entra na fila quando a conta vira Prioridade") ·
  pesquisando (carregamento, aviso de até 15 min) · parcial/pendente (badge + motivo + nova
  tentativa) · ok.
- Maturidade em tabela de 3 linhas: item · situação (Sim/Não/Não lido — texto, nunca só cor) ·
  evidência.
- Decisores em lista: nome · cargo · senioridade · fonte.
- Briefing em blocos: dor provável, gatilho, abordagem, fontes. Dor sem fonte: "a confirmar".
- Correção: `Dialog` por bloco, grava e mostra "corrigido por José".
- Celular: blocos empilhados, tabela vira lista de cartões.

## Matriz critério → prova

| Critério | Prova |
|---|---|
| CA-1-16 | conta movida para prioridade → `pesquisas` com maturidade, decisores e briefing + data |
| CA-1-17 | site só JS → todos os itens `nao_lido`; site com pixel → `sim` com a evidência citada |
| CA-1-18 | decisores com nome/cargo/fonte e nenhum campo de e-mail ou telefone |
| CA-1-19 | briefing com dor/gatilho/abordagem + `fontes`; dor sem fonte = "a confirmar" |
| CA-1-20 | Apollo 401/429 e IA fora → `parcial`/`pendente` com motivo, retentativa, correção mantida |

## Riscos
- **Site em JavaScript**: vira `nao_lido`, sem chute (RN-16) — é o comportamento correto, não falha.
- **Custo da IA**: uma chamada `fast` por pesquisa, texto do site truncado em 15 mil caracteres e
  limite diário de 25.
- **Migration aditiva**: duas coleções novas, `down` remove.
