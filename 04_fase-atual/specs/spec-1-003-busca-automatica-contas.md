# SPEC-1-003 — Busca automática de contas pelas APIs, com triagem e nota

**Fase:** 1 · **Status:** pronta para construir · **Dono:** José Linhares (com o Maestro) · aceite: consultor Rodrigo Santos
**Origem no escopo:** funcionalidades 4.3 e 4.4 (sem a maturidade digital, que fica na SPEC-1-004), automações "Busca de contas" e "Triagem e nota", regras 6, 7 e 8 · decisões D-06, D-08, D-09 · insumos CL-004, CL-010
**Degrau da solução:** dependência existente. Usa APIs abertas e gratuitas, uma automação agendada do Skip e regras determinísticas, sem base paga.

## Contexto e decisões fechadas

- **Estado atual:** o José monta as listas à mão e decide a prioridade pela memória.
- **Estado desejado:**
  - depois que o José aprova o perfil ideal, o sistema busca sozinho as contas que se encaixam, completa os dados de cada empresa e dá a nota com o motivo;
  - o José não monta lista: ele só olha a fila;
  - a busca roda toda semana e quando o José pede, dentro da cota gratuita de cada fonte.
- **Fontes, em ordem:**
  1. dados abertos da Anvisa (fabricantes), para o cliente teste (D-09);
  2. consulta aberta de CNPJ pela OpenCNPJ ou pela BrasilAPI (D-08);
  3. busca de empresas da Apollo por segmento, porte e local do perfil, quando a chave da Apollo estiver no cofre (CL-010);
  4. planilha do José, como porta extra (CL-004).
- **Decisões já fechadas:**
  - **Regra 7:** conta sem dado fica "pendente de dados" e nunca é descartada.
  - **Regra 8:** toda nota mostra o motivo de cada ponto.
  - **Regra do cliente teste:** multinacional que contrata pela matriz fica em segundo plano.
  - **D-06:** nada pago. A automação respeita a cota gratuita e para quando ela acaba, sem gerar cobrança.

## Resultado observável

1. O José aprova o perfil ideal do cliente teste (SPEC-1-002).
2. Em até 30 minutos, a tela Contas mostra as empresas encontradas, cada uma com:
   - a fonte;
   - o porte, a atividade, a situação e a cidade;
   - a nota de 0 a 100 e a faixa A, B ou C;
   - o motivo de cada ponto.
3. Toda segunda-feira chegam contas novas sozinhas, sem duplicar.
4. As contas fora do perfil e as pendentes ficam em abas separadas, com o motivo.

## Limites e dependências

- **Inclui:**
  - a coleção `contas` e a coleção `buscas`, que registra cada execução;
  - a automação `buscar_contas`, disparada pelo perfil aprovado, por um botão e por agenda semanal;
  - as fontes 1 a 4;
  - a função `completar_cnpj`;
  - a automação `triar_e_pontuar`, disparada a cada conta nova ou atualizada;
  - as abas Prioridade, Fora do perfil e Pendentes.
- **Fora de escopo:**
  - pesquisa do site, decisores e briefing (SPEC-1-004);
  - e-mails e sinais de mercado (fase 2);
  - LinkedIn e Google Maps como fonte, porque coletar perfil do LinkedIn viola o contrato dele (fica para avaliação na fase 2).
- **Entradas:**
  - o perfil aprovado;
  - as chaves no cofre;
  - a planilha opcional.
- **Saídas:**
  - as contas do cliente teste com nota;
  - o registro de cada busca (fonte, encontradas, novas, repetidas, falhas, cota usada);
  - as provas em `05_entregas/fase-1/evidencias/SPEC-1-003/`.
- **Dependência:** SPEC-1-002, porque precisa do perfil aprovado.
- **Risco e plano B:**
  - **Fonte fora do ar ou com limite:** a busca registra a falha, segue nas outras fontes e tenta de novo na próxima execução.
  - **Chave da Apollo ausente:** a busca roda só com as fontes 1, 2 e 4.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Permissão | Idempotência | Erro |
|---|---|---|---|---|---|
| Dados abertos da Anvisa | Anvisa | razão social, CNPJ, UF, tipo de atividade; guardar URL e data do arquivo | pública | casa pelo CNPJ | arquivo fora do formato gera busca com falha e motivo |
| OpenCNPJ ou BrasilAPI | Receita Federal | porte, capital social, CNAE principal, situação, município, UF, abertura | pública, sem chave | `consultado_em`; não consulta de novo antes de 30 dias | 404, 429 ou 5xx deixam a conta "pendente de dados" e a põem na fila |
| Apollo (busca de empresas) | Apollo | nome, domínio, setor, faixa de funcionários, local | chave `APOLLO_API_KEY` no cofre | casa pelo domínio ou pelo CNPJ | 401 vira "chave inválida"; 429 vira "cota esgotada", e a busca para na fonte |
| Planilha | José | `empresa`, `cnpj`, `cidade`, `uf`, `site`, `observacao` | admin | casa pelo CNPJ, ou por nome e cidade | linha inválida vai para o relatório com o motivo |
| `buscas` | sistema | `cliente`, `perfil_versao`, `gatilho` (aprovação/botão/agenda), `fonte`, `encontradas`, `novas`, `repetidas`, `falhas`, `cota_usada`, `inicio`, `fim` | admin | uma linha por fonte por execução | — |
| `contas` | sistema | `cliente`, `empresa`, `cnpj`, `dominio`, `fontes` (lista), dados do CNPJ, `nota`, `faixa`, `motivos` (regra → pontos), `perfil_versao`, `situacao_triagem` (prioridade/fora_do_perfil/pendente_dados), `etapa` | admin, filtro por carteira | chave: `cliente` + `cnpj` (ou `dominio`) | — |

| Regra | Condição | Resultado |
|---|---|---|
| RN-09 | Conta sem CNPJ ou consulta sem resposta | `pendente_dados`, com o motivo |
| RN-10 | Situação cadastral diferente de "ativa" | `fora_do_perfil`, com "CNPJ não ativo" |
| RN-11 | Exclusão do perfil (atividade, porte ou regra do cliente) | `fora_do_perfil`, com a exclusão citada |
| RN-12 | Demais contas | Nota de 0 a 100 pelos critérios do perfil aprovado; faixa A (70 ou mais), B (40 a 69) ou C (menos de 40) |
| RN-13 | Perfil novo aprovado | Nova busca e recálculo das notas, com a versão do perfil registrada |
| RN-14 | Cota da fonte esgotada | Para aquela fonte, registra em `buscas` e não gera cobrança |

## Fluxo e regras

1. Criar `contas` e `buscas`, com a regra de acesso e o filtro por carteira.
2. Criar `completar_cnpj`, com fila, intervalo entre consultas e plano B.
3. Criar `buscar_contas`:
   1. ler o perfil aprovado;
   2. consultar as fontes 1 e 3 com os filtros do perfil;
   3. juntar sem duplicar;
   4. completar pelo CNPJ;
   5. registrar em `buscas`.
4. Criar `triar_e_pontuar`, disparada a cada conta nova ou atualizada (RN-09 a RN-12).
5. Ligar os gatilhos: perfil aprovado, botão "Buscar agora" e agenda toda segunda às 7h.
6. Criar a importação de planilha, que passa pelos mesmos passos 3.3 a 4.
7. Criar a tela Contas, com as três abas e o histórico das buscas.

| Cenário | Condição | Resultado esperado | Recuperação |
|---|---|---|---|
| Principal | Perfil aprovado | Contas novas com nota em até 30 minutos | — |
| Limite | Agenda roda de novo | Só entram contas novas, sem duplicar | — |
| Falha | Fonte fora do ar ou cota esgotada | Falha registrada em `buscas`; as outras fontes seguem | próxima execução |

## Instruções de execução para o Maestro

- **Ler antes de alterar:** esta SPEC, `AGENTS.md`, `06_notas/decisoes-do-projeto.md` e o perfil aprovado na SPEC-1-002.
- **Alterar somente:** o projeto "JLA — CRM de prospecção" e `07-sistemas/`. Registre o catálogo de cada API (rota, parâmetros, campos, limites e erros) em `07-sistemas/catalogo-apis.md`.
- **Ordem:** passos 1 a 7 e depois o TDD. Para a Apollo, monte um simulador no mesmo formato e faça a prova real quando a chave chegar.
- **Parar quando:** a única fonte disponível exigir pagamento ou contrato. Nesse caso, registre `DÚVIDA:` no `STATUS.md`.
- **Nunca:**
  - comprar dados;
  - passar da cota gratuita;
  - coletar perfil do LinkedIn;
  - guardar dado pessoal nesta SPEC (só empresa).

## Checklist de execução

- [ ] `contas` e `buscas` com o filtro por carteira.
- [ ] `completar_cnpj` com fila e plano B.
- [ ] `buscar_contas` com as fontes e o registro de cada execução.
- [ ] `triar_e_pontuar` automática.
- [ ] Gatilhos de aprovação, botão e agenda semanal.
- [ ] Importação de planilha pelo mesmo caminho.
- [ ] Tela Contas e `07-sistemas/catalogo-apis.md`.
- [ ] Provas em `05_entregas/fase-1/evidencias/SPEC-1-003/`.

## Critérios de aceite

- **CA-1-10:** aprovar o perfil dispara a busca sozinha. A tabela `buscas` registra cada fonte com encontradas, novas, repetidas e falhas.
- **CA-1-11:** rodar a busca duas vezes, ou importar a mesma planilha de novo, não cria nenhuma conta repetida.
- **CA-1-12:** a conta com CNPJ válido ganha porte, CNAE, situação e cidade pela consulta aberta, com a data da consulta.
- **CA-1-13:** a cada conta nova, a nota é calculada sozinha. A conta mostra nota, faixa e a lista "regra → pontos", que soma a nota.
- **CA-1-14:** a conta com CNPJ não ativo ou com exclusão do perfil vai para Fora do perfil, com o motivo.
- **CA-1-15:** com uma fonte fora do ar ou com a cota esgotada (simuladas), a busca registra a falha, as outras fontes seguem e nenhuma conta é descartada.

## TDD da SPEC

| # | Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|---|
| 1 | RED | Busca sem controle | Rodar a busca 2 vezes com o simulador antes da chave de idempotência | Contas repetidas, o que mostra a falha | `red.txt` |
| 2 | GREEN | Disparo e idempotência | Aprovar um perfil fictício e depois clicar "Buscar agora" | Busca automática registrada e zero repetidas na segunda (CA-1-10, CA-1-11) | `green-busca.txt` |
| 3 | GREEN | CNPJ e falhas | Completar 3 CNPJs públicos; simular 404, 429 e fonte fora do ar | 3 completos com data; falhas registradas; outras fontes seguem (CA-1-12, CA-1-15) | `green-cnpj.txt` |
| 4 | GREEN | Nota e triagem | Inserir contas fictícias (ativa, inativa e excluída) | Nota automática igual à soma dos motivos; inativa e excluída em Fora do perfil (CA-1-13, CA-1-14) | `green-nota.txt` |
| 5 | REGRESSÃO | Ponta a ponta real | Aprovar o perfil real do cliente teste, esperar a busca, conferir 5 contas à mão contra a Receita, rodar a agenda manualmente e remover os fictícios | Contas reais com nota coerente; agenda sem repetidas; nenhum resíduo | `regressao.txt` |

**Dados e fixtures:** perfil e contas fictícios, mais os simuladores da Apollo e da consulta de CNPJ (401, 404, 429 e 5xx), removidos no fim.

**Caminhos de erro obrigatórios:**
- fonte fora do ar;
- cota esgotada;
- chave inválida;
- CNPJ inválido;
- reexecução.

## Teste humano do cliente

Sem sessão própria (D-07). O José vê as contas que chegaram sozinhas na sessão única do fim da SPEC-1-005.

## Handoff e operação

- **Demonstrar:** aprovar o perfil e ver as contas chegando com nota.
- **Operar:** a busca roda toda segunda. Se muita conta boa cair em Fora do perfil, revise o perfil.
- **Monitorar:** a tabela `buscas`, com falhas e cota usada por semana.

## Tasks vinculadas

Status, responsável e prazo ficam só em `04_fase-atual/fase.md`.

| Task | Critério | Prova |
|---|---|---|
| Buscar contas sozinho pelas APIs e dar nota com o motivo | CA-1-10 a CA-1-15 | TDD 1 a 5 |
| Guardar a chave da Apollo no cofre do Skip | insumo CL-010 | função lê a chave (sem mostrar) |
| Enviar ao Maestro a primeira lista de contas do cliente teste | insumo CL-004 | lista importada |
| Buscar contas nas APIs a partir do perfil aprovado | CA-1-10, CA-1-11 | TDD 1 e 2 |
| Completar porte e atividade pelos dados abertos do CNPJ | CA-1-12, CA-1-15 | TDD 3 |
| Calcular a nota sozinho a cada conta nova, com o motivo | CA-1-13, CA-1-14 | TDD 4 e 5 |

## Emendas

Nenhuma.
