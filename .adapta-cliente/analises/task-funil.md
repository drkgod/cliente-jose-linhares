# Análise — task "Mostrar as contas no funil visual do CRM"

- **SPEC:** `04_fase-atual/specs/spec-1-005-funil-visual.md`
- **Critérios:** CA-1-21 a CA-1-25 (TDD 1 a 5) · **Skip:** 78281 · versão final `17760be`
- **Teste humano:** SIM — é a sessão única da fase 1 (D-07).

## Objetivo
O José vê as contas de cada cliente em colunas por etapa, abre a ficha (dados, motivo da nota,
pesquisa, histórico), arrasta ou usa o seletor para mover, anota contatos de outro canal e filtra
por faixa, etapa e origem — sempre dentro da carteira escolhida.

## Decisão de modelagem (a correção mais importante)
`contas.etapa` vinha da SPEC-1-003 repetindo a **triagem** (prioridade / fora_do_perfil /
pendente_dados). A SPEC-1-005 pede 5 etapas de funil. Em vez de criar um segundo campo (que
ficaria ambíguo), o campo `etapa` passou a ser o do funil e a triagem ficou só em
`situacao_triagem`. Migração 0018 ajustou os valores e mapeou as contas existentes; o hook de
triagem deixou de reescrever `etapa`.

## Arquivos
- `pocketbase/migrations/0017_create_historico_contas.js` — histórico só de acréscimo
  (`updateRule` e `deleteRule` = null).
- `pocketbase/migrations/0018_etapas_funil.js` — troca os valores de `etapa` e migra os dados.
- `pocketbase/hooks/funil_api.js` — `GET /backend/v1/funil` (contadores no servidor),
  `POST /funil/mover` (motivo obrigatório para descartar), `POST /funil/anotar`,
  `GET /funil/historico`.
- `pocketbase/hooks/triagem_contas.js` — passou a **não** tocar em `etapa`.
- `src/services/funil.ts`, `src/pages/Funil.tsx`, `src/components/contas/SecaoHistorico.tsx`,
  `src/pages/ContaDetalhe.tsx` (ganhou a seção de histórico), `src/App.tsx` (rota `/funil`).

## Ficha de Tela — Funil (`/funil`)
- Tarefa principal: decidir qual conta trabalhar agora, movendo as contas entre etapas.
- Ação primária: nenhuma global (a ação é o movimento do cartão); filtros e "Atualizar" no topo.
- Padrão: kanban (`padroes-de-tela.md` §5).
- Dados: empresa · cidade/UF · faixa (A/B/C com texto) · nota · origem.
- Ações e permissões: mover/descartar/anotar → usuário liberado em `acessos` → rotas + coleções.
- Estados: carregando · sem cliente ("cadastre um cliente e aprove o perfil") · coluna vazia
  ("Nenhuma conta") · erro com "Tentar de novo" · sem permissão.
- Validações: descartar exige motivo (lista ou texto livre).
- Celular: colunas com rolagem horizontal só dentro do quadro; o seletor de etapa em cada cartão
  é o caminho garantido (arrastar é atalho, nunca a única via).
- Acessibilidade: coluna é `<section aria-label>`; contador em `Badge` com `aria-label`; seletor
  com rótulo; faixa com texto, nunca só cor; foco visível.
- Textos: "Funil", "Nova", "Priorizada", "Em pesquisa", "Pronta para cadência", "Descartada",
  "Nenhuma conta", "Limpar filtros", "Descartar".

## Matriz critério → prova
| Critério | Prova |
|---|---|
| CA-1-21 | contador de cada coluna = número de cartões = contas da lista (6 = 6 = 6) |
| CA-1-22 | ficha com dados, nota 100 com motivos e histórico em ordem de data |
| CA-1-23 | mover grava histórico; descartar sem motivo → 400 |
| CA-1-24 | anotação aparece no histórico com data |
| CA-1-25 | filtro faixa A + em_pesquisa + planilha devolve só a conta certa; funil de B não mostra A |

## Riscos
- **Arrastar em dispositivo de toque:** tratado com o seletor de etapa em cada cartão (plano B da
  SPEC, implementado desde o início).
- **Migration 0018** altera valores de um campo select existente e reescreve registros: é aditiva
  em intenção (não apaga nada), mas transforma dados — registrada aqui de propósito.
