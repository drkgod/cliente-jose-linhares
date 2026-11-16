# SPEC-1-003 — Contas por planilha e dados abertos, com triagem e nota

**Fase:** 1 · **Status:** pronta para construir · **Dono:** José Linhares (com o Maestro) · aceite: consultor Rodrigo Santos
**Origem no escopo:** funcionalidades 4.3 e 4.4 (sem a maturidade digital, que fica na fase 2), regras 6, 7 e 8 · decisões D-06, D-08, D-09 · insumo CL-004
**Degrau da solução:** dependência existente. Usa a consulta aberta e gratuita de CNPJ e regras determinísticas, sem IA e sem base paga.

## Contexto e decisões fechadas

- **Estado atual:** o José monta as listas à mão e decide a prioridade pela memória.
- **Estado desejado:**
  - as contas do cliente teste entram por planilha ou pela lista aberta;
  - o sistema completa porte e atividade pelo CNPJ;
  - o sistema dá a cada conta uma nota de prioridade pelo perfil aprovado, com o motivo de cada ponto.
- **Decisões já fechadas:**
  - **D-08:** dados de empresa pela BrasilAPI (`/api/cnpj/v1/{cnpj}`), com a Minha Receita como plano B. Nada pago.
  - **D-09:** sem lista do José, a primeira lista vem dos dados abertos de fabricantes da Anvisa, com fonte e data registradas.
  - **Regra 7:** conta sem dado fica "pendente de dados", nunca descartada.
  - **Regra 8:** toda nota mostra o motivo de cada ponto, e toda conta fora do perfil mostra o motivo.
  - **Regra do cliente teste:** multinacional que contrata pela matriz fica em segundo plano, como critério de prioridade do perfil.

## Resultado observável

1. Na tela Contas, o José escolhe o cliente teste e importa a planilha, ou a lista aberta.
2. Em poucos minutos, cada conta aparece com porte, atividade, situação e cidade, mais a nota de 0 a 100, a faixa (A, B ou C) e o motivo de cada ponto.
3. As contas fora do perfil e as pendentes de dados ficam em abas separadas, com o motivo.

## Limites e dependências

- **Inclui:**
  - a coleção `contas`;
  - a importação de CSV e XLSX;
  - a importação da lista aberta;
  - a consulta de CNPJ;
  - a triagem e a nota;
  - as abas Prioridade, Fora do perfil e Pendentes.
- **Fora de escopo:**
  - busca automática em LinkedIn, Google Maps ou bases pagas;
  - maturidade digital, decisores, e-mails e sinais (fase 2);
  - formulário da landing page (fase 3).
- **Entradas:**
  - a planilha do José (CL-004) ou a lista aberta (D-09);
  - o perfil aprovado (SPEC-1-002).
- **Saídas:**
  - as contas do cliente teste com nota;
  - o relatório de importação;
  - as provas em `05_entregas/fase-1/evidencias/SPEC-1-003/`.
- **Dependências:** SPECs 1-001 e 1-002.
- **Risco e plano B:**
  - **API de CNPJ com limite ou fora do ar:** a conta fica "pendente de dados" e entra na fila de nova tentativa, com intervalo entre as consultas.
  - **Planilha sem CNPJ:** a conta casa por nome e cidade e fica "pendente de dados" até ter CNPJ.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Permissão | Idempotência | Erro |
|---|---|---|---|---|---|
| Planilha (CSV ou XLSX) | José | colunas aceitas: `empresa`, `cnpj`, `cidade`, `uf`, `site`, `observacao` (outras ficam como observação) | admin | casa pelo CNPJ ou por nome e cidade; reimportar atualiza e não duplica | linha inválida vai para o relatório com o motivo |
| Lista aberta da Anvisa | dados abertos | razão social, CNPJ, UF; registrar URL e data do download | — | igual à planilha | arquivo fora do formato vira importação recusada com o motivo |
| BrasilAPI ou Minha Receita | Receita Federal | porte, capital social, CNAE principal, situação, município, UF, data de abertura | pública, sem chave | resultado guardado com `consultado_em`; não consulta de novo antes de 30 dias | 404, 429 ou 5xx deixam a conta "pendente de dados" |
| `contas` | sistema | `cliente`, `empresa`, `cnpj`, `origem` (arquivo e linha, ou URL), dados do CNPJ, `nota`, `faixa`, `motivos` (lista: regra → pontos), `situacao_triagem` (prioridade/fora_do_perfil/pendente_dados), `etapa` | admin, filtro por carteira | chave: `cliente` + `cnpj` | — |

| Regra | Condição | Resultado |
|---|---|---|
| RN-09 | Conta sem CNPJ ou consulta sem resposta | `pendente_dados`, com o motivo |
| RN-10 | Situação cadastral diferente de "ativa" | `fora_do_perfil`, com o motivo "CNPJ não ativo" |
| RN-11 | Exclusão do perfil (atividade, porte ou regra do cliente) | `fora_do_perfil`, com a exclusão citada |
| RN-12 | Demais contas | Nota de 0 a 100 pela soma dos critérios do perfil aprovado; faixa A (70 ou mais), B (40 a 69) ou C (menos de 40) |
| RN-13 | Perfil novo aprovado | Recalcula as notas do cliente e registra a versão do perfil usada |

## Fluxo e regras

1. Criar `contas` com a regra de acesso e o filtro por carteira.
2. Criar a importação de planilha e da lista aberta, com relatório: importadas, atualizadas, recusadas e o motivo de cada recusa.
3. Criar a função `completar_cnpj`, com fila, intervalo entre consultas e plano B.
4. Criar a função `triar_e_pontuar`, que converte os critérios do perfil aprovado em pontos e grava a nota, a faixa, os motivos e a versão do perfil.
5. Criar a tela Contas com as abas Prioridade, Fora do perfil e Pendentes, ordenadas por nota.
6. Importar a lista do cliente teste (CL-004, ou D-09 se ela não vier).

| Cenário | Condição | Resultado esperado | Recuperação |
|---|---|---|---|
| Principal | Planilha com CNPJ válido | Conta completa, com nota e motivos | — |
| Limite | Mesma planilha importada de novo | Nenhuma conta duplicada; dados atualizados | — |
| Falha | API de CNPJ fora do ar | Conta pendente; nova tentativa depois | fila de nova tentativa |

## Instruções de execução para o Maestro

- **Ler antes de alterar:** esta SPEC, `AGENTS.md`, `06_notas/decisoes-do-projeto.md` e o perfil aprovado na SPEC-1-002.
- **Alterar somente:** o projeto "JLA — CRM de prospecção" e `07-sistemas/`.
- **Ordem:** passos 1 a 6 e depois o TDD.
- **Se a lista do José não chegar:** siga com a lista aberta (D-09) e registre a fonte.
- **Parar quando:** a única fonte disponível exigir pagamento ou contrato. Nesse caso, registre `DÚVIDA:` no `STATUS.md`.
- **Nunca:** comprar dados, usar robô em site que proíbe ou guardar dado pessoal além do nome da empresa e do CNPJ nesta fase.

## Checklist de execução

- [ ] `contas` com o filtro por carteira.
- [ ] Importação de planilha e da lista aberta, com relatório.
- [ ] `completar_cnpj` com fila, intervalo e plano B.
- [ ] `triar_e_pontuar` com motivos e versão do perfil.
- [ ] Tela Contas com as três abas.
- [ ] Contas do cliente teste importadas.
- [ ] Provas em `05_entregas/fase-1/evidencias/SPEC-1-003/`.

## Critérios de aceite

- **CA-1-10:** uma planilha com 10 linhas fictícias (2 inválidas) gera 8 contas e um relatório com as 2 recusas e o motivo de cada uma.
- **CA-1-11:** importar a mesma planilha de novo não cria nenhuma conta nova.
- **CA-1-12:** a conta com CNPJ válido ganha porte, CNAE, situação e cidade pela consulta aberta, com a data da consulta.
- **CA-1-13:** cada conta em Prioridade mostra nota, faixa e a lista "regra → pontos", que soma a nota.
- **CA-1-14:** a conta com CNPJ não ativo ou com exclusão do perfil vai para Fora do perfil, com o motivo.
- **CA-1-15:** com a consulta de CNPJ fora do ar (simulada), a conta fica em Pendentes com o motivo e entra na fila de nova tentativa, sem descarte.

## TDD da SPEC

| # | Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|---|
| 1 | RED | Importação ingênua | Importar a planilha fictícia de 10 linhas antes das validações | Linhas inválidas entram ou duplicam, o que mostra a falha | `red.txt` |
| 2 | GREEN | Importação e reimportação | Importar a planilha duas vezes | 8 contas, 2 recusas com motivo e zero duplicatas (CA-1-10, CA-1-11) | `green-importacao.txt` |
| 3 | GREEN | CNPJ | Completar 3 CNPJs públicos de teste e 1 simulado com a API fora | 3 completos com data e 1 pendente na fila (CA-1-12, CA-1-15) | `green-cnpj.txt` |
| 4 | GREEN | Nota e triagem | Pontuar as contas com o perfil aprovado | A soma dos motivos é igual à nota; CNPJ inativo e excluídos vão para Fora do perfil (CA-1-13, CA-1-14) | `green-nota.txt` |
| 5 | REGRESSÃO | Ponta a ponta | Importar a lista real do cliente teste, conferir 5 contas à mão contra a Receita e remover os dados fictícios | Notas coerentes e nenhum resíduo de teste | `regressao.txt` |

**Dados e fixtures:** a planilha fictícia de 10 linhas e o simulador da API de CNPJ (404, 429 e 5xx), removidos no fim.

**Caminhos de erro obrigatórios:**
- linha sem empresa;
- CNPJ inválido;
- API fora do ar;
- limite de consultas (429);
- reimportação.

## Teste humano do cliente

Sem sessão própria (D-07). O José vê as contas e as notas na sessão única do fim da SPEC-1-004.

## Handoff e operação

- **Demonstrar:** importar a lista e mostrar a melhor conta com o motivo da nota.
- **Operar:** importar uma lista nova sempre que houver. Rever o perfil se muitas contas boas caírem em Fora do perfil.
- **Monitorar:** quantidade de pendentes e de consultas com falha por semana.

## Tasks vinculadas

Status, responsável e prazo ficam só em `04_fase-atual/fase.md`.

| Task | Critério | Prova |
|---|---|---|
| Trazer as contas e dar nota de prioridade com o motivo | CA-1-10 a CA-1-15 | TDD 1 a 5 |
| Enviar ao Maestro a primeira lista de contas do cliente teste | insumo CL-004 | lista importada |
| Importar contas por planilha sem duplicar | CA-1-10, CA-1-11 | TDD 1 e 2 |
| Completar porte e atividade pelos dados abertos do CNPJ | CA-1-12, CA-1-15 | TDD 3 |
| Calcular a nota de prioridade com o motivo de cada ponto | CA-1-13, CA-1-14 | TDD 4 e 5 |

## Emendas

Nenhuma.
