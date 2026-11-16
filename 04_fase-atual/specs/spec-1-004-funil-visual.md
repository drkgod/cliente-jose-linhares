# SPEC-1-004 — Funil visual do CRM com histórico

**Fase:** 1 · **Status:** pronta para construir · **Dono:** José Linhares (com o Maestro) · aceite: consultor Rodrigo Santos
**Origem no escopo:** funcionalidade 4.8 e regras 3 e 8 · decisões D-03 e D-07
**Degrau da solução:** nativo da plataforma. Telas e coleções do Skip, sem biblioteca de CRM externa.

## Contexto e decisões fechadas

- **Estado atual:** não há funil. O José acompanha quem contatar e quando pela memória.
- **Estado desejado:** o José vê as contas de cada cliente num funil por etapa, abre a ficha de cada uma, move entre etapas, anota à mão e encontra tudo por filtro. Nada se perde para uma nova abordagem no futuro.
- **Decisões já fechadas:**
  - Etapas da fase 1:
    1. Nova
    2. Priorizada
    3. Em pesquisa
    4. Pronta para cadência
    5. Descartada

    As etapas de cadência, resposta e reunião entram nas fases 3 e 4.
  - Descartar exige um motivo, escolhido numa lista ou escrito.
  - Toda mudança fica no histórico, com data, de onde para onde e quem fez.
  - **D-03:** o cliente atendido não vê o funil, porque o painel é só do José.
  - **D-07:** esta é a única SPEC da fase com sessão do José, no fim, junto com o questionário de produto.

## Resultado observável

Na tela Funil, o José escolhe o cliente teste e vê as colunas com os cartões, cada um com empresa, nota, faixa e origem. Ele abre um cartão e vê a ficha com os dados, o motivo da nota e o histórico. Ele arrasta para outra etapa, anota "falei com ele no evento" e filtra pela faixa A. O contador de cada coluna confere com a lista.

## Limites e dependências

- **Inclui:**
  - a coleção `historico_contas`;
  - a tela Funil, com colunas, cartão e ficha;
  - mover com motivo;
  - anotação à mão;
  - o contato vindo de outro canal, como nota;
  - os filtros e os contadores.
- **Fora de escopo:**
  - etapas de cadência e reunião (fases 3 e 4);
  - relatório e mapa de jornada (fase 5);
  - busca em linguagem natural (fase 5).
- **Entradas:** as contas com nota (SPEC-1-003).
- **Saídas:**
  - o funil do cliente teste;
  - as provas em `05_entregas/fase-1/evidencias/SPEC-1-004/`;
  - as respostas do questionário em `06_notas/preferencias-do-jose.md`.
- **Dependência:** SPEC-1-003.
- **Risco e plano B:** se arrastar não funcionar bem no Skip, o cartão ganha um seletor de etapa, com a mesma regra e o mesmo histórico.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Permissão | Idempotência | Erro |
|---|---|---|---|---|---|
| `contas.etapa` | José ou sistema | uma das 5 etapas | admin | mover para a mesma etapa não gera histórico | etapa inválida é recusada |
| `historico_contas` | sistema | `conta`, `quando`, `tipo` (mudança_etapa/anotacao/importacao/nota_recalculada), `de`, `para`, `motivo`, `texto`, `quem` | admin, filtro por carteira | só acrescenta, nunca apaga | — |

| Regra | Condição | Resultado |
|---|---|---|
| RN-14 | Mover para Descartada | Exige motivo; sem motivo, não move |
| RN-15 | Qualquer mudança de etapa, anotação ou nota recalculada | Uma linha nova em `historico_contas` |
| RN-16 | Filtros | Sempre dentro da carteira escolhida; contadores calculados no servidor |

## Fluxo e regras

1. Criar `historico_contas`, que só acrescenta, com a regra de acesso e o filtro por carteira.
2. Criar a tela Funil: seletor de cliente, colunas, cartões ordenados por nota e contador por coluna.
3. Criar a ficha: dados da conta, motivo da nota (SPEC-1-003), histórico e campo de anotação.
4. Mover por arrastar ou pelo seletor, com motivo obrigatório para descartar (RN-14).
5. Criar os filtros por faixa, etapa e origem.
6. Fazer a sessão do fim da SPEC com o José, conforme a seção "Teste humano do cliente".

| Cenário | Condição | Resultado esperado | Recuperação |
|---|---|---|---|
| Principal | José move uma conta | Coluna e histórico atualizados | — |
| Limite | Descartar sem motivo | Não move e pede o motivo | informar o motivo |
| Falha | Erro ao gravar | A conta volta para a coluna anterior com aviso | tentar de novo |

## Instruções de execução para o Maestro

- **Ler antes de alterar:** esta SPEC, `AGENTS.md` e o que as SPECs 1-002 e 1-003 já criaram.
- **Alterar somente:** o projeto "JLA — CRM de prospecção", `07-sistemas/` e `06_notas/preferencias-do-jose.md`.
- **Ordem:** passos 1 a 5, depois o TDD, e só então a sessão com o José (passo 6).
- **Parar quando:** uma resposta do questionário pedir etapa, regra ou dado fora desta SPEC. Registre como `DÚVIDA:` no `STATUS.md` e não implemente.

## Checklist de execução

- [ ] `historico_contas`, só de acréscimo.
- [ ] Funil com colunas, cartões e contadores.
- [ ] Ficha com o motivo da nota, o histórico e a anotação.
- [ ] Mover com motivo para descartar.
- [ ] Filtros.
- [ ] Sessão do José feita e respostas registradas.
- [ ] Provas em `05_entregas/fase-1/evidencias/SPEC-1-004/`.

## Critérios de aceite

- **CA-1-16:** o funil do cliente teste mostra as 5 etapas, e o contador de cada uma é igual ao número de contas da lista com o mesmo filtro.
- **CA-1-17:** a ficha mostra os dados da conta, a nota com os motivos e o histórico em ordem de data.
- **CA-1-18:** mover uma conta grava uma linha no histórico. Descartar sem motivo é recusado.
- **CA-1-19:** uma anotação à mão, como um contato vindo de outro canal, aparece no histórico com data.
- **CA-1-20:** os filtros por faixa, etapa e origem funcionam combinados, e nenhum registro de outra carteira aparece.

## TDD da SPEC

| # | Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|---|
| 1 | RED | Contador sem regra | Comparar o contador com a lista antes do cálculo no servidor | Diferença ou dado de outra carteira, o que mostra a falha | `red.txt` |
| 2 | GREEN | Funil e ficha | Abrir o funil e 3 fichas do cliente teste | Contadores iguais à lista, ficha completa (CA-1-16, CA-1-17) | `green-funil.txt` e capturas |
| 3 | GREEN | Mover e anotar | Mover 2 contas, tentar descartar sem motivo, descartar com motivo e anotar 1 contato | Histórico com 4 linhas e a recusa registrada (CA-1-18, CA-1-19) | `green-historico.txt` |
| 4 | GREEN | Filtros | Combinar faixa A, etapa Priorizada e origem planilha; repetir com o cliente fictício B | Só as contas certas, e nada de B (CA-1-20) | `green-filtros.txt` |
| 5 | REGRESSÃO | Navegador automatizado | Percorrer as SPECs 1-001 a 1-004 de ponta a ponta e remover o cliente B | Tudo funciona e nada de teste sobra | `regressao.txt` |

**Dados e fixtures:** o cliente fictício B com 3 contas, removido no fim.

**Caminhos de erro obrigatórios:**
- descartar sem motivo;
- etapa inválida;
- erro ao gravar;
- leitura cruzada de carteira.

## Teste humano do cliente

É a única sessão da fase 1, no fim desta SPEC, com até 15 minutos. Mande ao José o link e o passo a passo em frases curtas.

**Roteiro:**
1. Entrar no sistema.
2. Abrir o cliente teste e ver o perfil ideal aprovado.
3. Em Contas, ver a melhor conta e o motivo da nota.
4. No Funil, mover uma conta para "Em pesquisa" e anotar algo.
5. Descartar uma conta com motivo.
6. Filtrar pela faixa A.

**Questionário de produto:** uma pergunta por vez, com opções A, B, C e "outra: me conte", mostrando a tela.
1. Etapas do funil: ficam assim ou quer renomear alguma?
2. O cartão mostra empresa, nota e origem: falta algo que você quer ver sem abrir a ficha?
3. A faixa A, B ou C ajuda, ou prefere só a nota?
4. Os motivos de descarte da lista servem?

Registre as respostas em `06_notas/preferencias-do-jose.md`. O que couber nesta SPEC vira ajuste, com prova. O que mudar regra ou escopo vai como `DÚVIDA:`.

## Handoff e operação

- **Demonstrar:** o roteiro acima, na call de validação de 02/12.
- **Operar:** o José abre o funil todo dia para decidir as próximas contas.
- **Monitorar:** quantidade de contas paradas em "Nova" há mais de 7 dias.

## Tasks vinculadas

Status, responsável e prazo ficam só em `04_fase-atual/fase.md`.

| Task | Critério | Prova |
|---|---|---|
| Mostrar as contas no funil visual do CRM | CA-1-16 a CA-1-20 | TDD 1 a 5 |
| Montar o funil com as etapas e a ficha da conta | CA-1-16, CA-1-17 | TDD 1 e 2 |
| Mover contas entre etapas e anotar à mão com histórico | CA-1-18, CA-1-19 | TDD 3 |
| Filtrar por cliente, faixa de nota, etapa e origem | CA-1-20 | TDD 4 |
| Testar o funil e responder o questionário de produto | sessão do fim da SPEC | registro em `06_notas/preferencias-do-jose.md` |
| Validar a fase 1 com o José | gate da fase | aceite do consultor |

## Emendas

Nenhuma.
