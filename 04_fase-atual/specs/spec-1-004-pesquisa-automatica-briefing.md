# SPEC-1-004 — Pesquisa automática da conta: maturidade digital, decisores e briefing

**Fase:** 1 · **Status:** pronta para construir · **Dono:** José Linhares (com o Maestro) · aceite: consultor Rodrigo Santos
**Origem no escopo:** funcionalidades 4.4 (maturidade digital) e 4.5, automação "Pesquisa e briefing de abertura" e regra 6 · decisões D-06, D-13 · insumos CL-005, CL-010
**Degrau da solução:** construção mínima sobre o nativo. Leitura do site por função do servidor, busca de pessoas da Apollo (que não consome crédito) e IA paga por uso, com as chaves no cofre.

## Contexto e decisões fechadas

- **Estado atual:** pesquisar empresa por empresa é a parte que mais toma o tempo do José.
- **Estado desejado:** toda conta que entra em Prioridade (faixa A ou B) é pesquisada sozinha:
  - o sistema lê o site e marca a maturidade digital (CRM, pixel de marketing e automação);
  - o sistema traz os decisores, com nome e cargo;
  - a IA escreve o briefing de abertura no CRM.

  O José só corrige o que vier errado.
- **Decisões já fechadas:**
  - **Regra 6:** só as contas que passaram na triagem são pesquisadas.
  - **Decisores:** vêm da busca de pessoas da Apollo, que traz nome e cargo e não consome crédito. Priorize C-level e diretores. E-mail e celular ficam para a fase 2.
  - **D-13:** o briefing usa a IA pela chave `IA_API_KEY`, com o modelo de melhor custo para texto longo, em lote.
  - **D-06:** limite de pesquisas por dia configurável, com padrão de 25 por dia, para caber na cota.
  - **Sinais de maturidade:** são lidos no HTML e nos registros públicos do site (Tag Manager, pixels, scripts de CRM e automação, registros DNS). Site feito só em JavaScript ou protegido fica "site não lido", sem chute.

## Resultado observável

1. Uma conta entra em Prioridade.
2. Em até 15 minutos, a ficha mostra:
   - **maturidade digital:** CRM, pixel e automação, cada um com sim, não ou não lido, e a evidência;
   - **decisores:** até 5, com nome e cargo;
   - **briefing de abertura:** empresa, porte, dor provável, gatilho, por onde abordar e as fontes.
3. Em cada item o José pode marcar "corrigido" e editar.

## Limites e dependências

- **Inclui:**
  - as coleções `pesquisas` e `decisores`;
  - a automação `pesquisar_conta`, disparada pela entrada em Prioridade e por um botão;
  - a leitura do site;
  - a busca de decisores;
  - o briefing pela IA;
  - o recálculo da nota com a maturidade digital;
  - a seção Pesquisa na ficha.
- **Fora de escopo:**
  - e-mail e celular dos decisores e a validação (fase 2);
  - sinais de mercado (fase 2);
  - qualquer contato com a empresa (fase 3).
- **Entradas:**
  - as contas em Prioridade (SPEC-1-003);
  - o cadastro e o playbook do cliente (SPEC-1-002);
  - as chaves no cofre.
- **Saídas:**
  - a pesquisa, os decisores e o briefing de cada conta priorizada;
  - as provas em `05_entregas/fase-1/evidencias/SPEC-1-004/`.
- **Dependência:** SPEC-1-003.
- **Risco e plano B:**
  - **Apollo sem chave ou com a cota esgotada:** a ficha mostra "decisores a pesquisar" e o briefing sai sem os nomes.
  - **IA fora do ar:** a pesquisa fica "briefing pendente" e é tentada de novo na próxima hora.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Permissão | Idempotência | Erro |
|---|---|---|---|---|---|
| Site da conta | empresa | HTML da página inicial e de até 2 páginas internas; tempo limite de 20 s | pública | uma leitura a cada 30 dias por conta | sem resposta, ou só JavaScript, vira "site não lido" |
| Apollo (busca de pessoas) | Apollo | nome, cargo, senioridade e empresa (sem e-mail e sem telefone) | chave `APOLLO_API_KEY` no cofre | casa pelo nome dentro da conta | 401 vira "chave inválida"; 429 vira "cota esgotada" |
| IA (briefing) | provedor escolhido | entrada: cadastro do cliente, dados da conta, maturidade e decisores; saída: JSON com `dor_provavel`, `gatilho`, `abordagem`, `fontes` | chave `IA_API_KEY` no cofre | nova versão só quando o dado de entrada muda | JSON inválido vira "briefing pendente" |
| `pesquisas` | sistema | `conta`, `maturidade` (crm, pixel, automacao: sim/não/não lido, mais `evidencia`), `briefing`, `fontes`, `status` (ok/parcial/pendente), `corrigido_por_jose`, `feito_em` | admin, filtro por carteira | uma vigente por conta | — |
| `decisores` | Apollo ou José | `conta`, `nome`, `cargo`, `senioridade`, `fonte`, `ativo` | admin, filtro por carteira | chave: `conta` + `nome` | — |

| Regra | Condição | Resultado |
|---|---|---|
| RN-15 | Conta entra em Prioridade | `pesquisar_conta` entra na fila, respeitando o limite diário |
| RN-16 | Item da maturidade sem evidência | Fica "não lido", nunca "sim" ou "não" |
| RN-17 | Maturidade lida | A nota é recalculada com o critério de maturidade do perfil, e o motivo aparece |
| RN-18 | Briefing sem fonte para a dor provável | A dor fica "a confirmar" |
| RN-19 | O José corrige um item | A correção vale sobre a próxima pesquisa automática |

## Fluxo e regras

1. Criar `pesquisas` e `decisores`, com a regra de acesso e o filtro por carteira.
2. Criar a leitura do site e a detecção dos sinais de maturidade, com a evidência (RN-16).
3. Criar a busca de decisores na Apollo, com o simulador enquanto a chave não chegar.
4. Criar o briefing pela IA, com JSON validado e fontes (RN-18).
5. Criar `pesquisar_conta`, que encadeia os passos 2, 3 e 4, recalcula a nota (RN-17) e respeita o limite diário (RN-15).
6. Ligar os gatilhos: entrada em Prioridade e botão "Pesquisar de novo".
7. Criar a seção Pesquisa na ficha, com a edição e a marca de corrigido (RN-19).

| Cenário | Condição | Resultado esperado | Recuperação |
|---|---|---|---|
| Principal | Site abre, Apollo e IA respondem | Ficha completa em até 15 minutos | — |
| Limite | Limite diário atingido | Conta fica na fila para o dia seguinte | — |
| Falha | IA ou Apollo fora | Pesquisa "parcial" ou "pendente", com o motivo | nova tentativa automática |

## Instruções de execução para o Maestro

- **Ler antes de alterar:** esta SPEC, `AGENTS.md`, `06_notas/decisoes-do-projeto.md` e o que a SPEC-1-003 criou.
- **Alterar somente:** o projeto "JLA — CRM de prospecção" e `07-sistemas/catalogo-apis.md`.
- **Ordem:** passos 1 a 7 e depois o TDD.
- **Parar quando:** a busca de decisores exigir plano pago. Nesse caso, siga sem decisores e registre `DÚVIDA:` no `STATUS.md`.
- **Nunca:**
  - buscar e-mail ou telefone nesta fase;
  - coletar perfil do LinkedIn;
  - entrar em contato com a empresa;
  - passar da cota.

## Checklist de execução

- [ ] `pesquisas` e `decisores` com o filtro por carteira.
- [ ] Leitura do site e maturidade com evidência.
- [ ] Decisores pela Apollo, com simulador.
- [ ] Briefing pela IA, com fontes.
- [ ] `pesquisar_conta` com fila, limite e recálculo da nota.
- [ ] Seção Pesquisa na ficha, com correção.
- [ ] Provas em `05_entregas/fase-1/evidencias/SPEC-1-004/`.

## Critérios de aceite

- **CA-1-16:** uma conta que entra em Prioridade é pesquisada sozinha, e a ficha mostra a maturidade, os decisores e o briefing, com data.
- **CA-1-17:** cada item da maturidade tem evidência, e sem evidência fica "não lido".
- **CA-1-18:** os decisores vêm com nome, cargo e fonte, sem e-mail e sem telefone.
- **CA-1-19:** o briefing traz a dor provável, o gatilho e a abordagem com as fontes. A dor sem fonte fica "a confirmar".
- **CA-1-20:** com a IA ou a Apollo fora do ar (simuladas), a pesquisa fica "parcial" ou "pendente" com o motivo e é tentada de novo, e uma correção do José não é sobrescrita.

## TDD da SPEC

| # | Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|---|
| 1 | RED | Maturidade sem evidência | Rodar a detecção num site fictício só em JavaScript | Marca "não" sem evidência, o que mostra a falha | `red.txt` |
| 2 | GREEN | Disparo e ficha | Mover uma conta fictícia para Prioridade | Pesquisa automática com maturidade, decisores e briefing (CA-1-16, CA-1-17, CA-1-18) | `green-pesquisa.txt` |
| 3 | GREEN | Briefing | Rodar com e sem fonte para a dor | Fontes presentes; sem fonte, "a confirmar" (CA-1-19) | `green-briefing.txt` |
| 4 | GREEN | Falhas e correção | Simular a IA e a Apollo fora; corrigir um item e pesquisar de novo | Parcial ou pendente com nova tentativa; correção mantida (CA-1-20) | `green-falhas.txt` |
| 5 | REGRESSÃO | Ponta a ponta real | Pesquisar 3 contas reais do cliente teste e conferir à mão o site e os decisores; remover os fictícios | Itens coerentes com o site; nenhum resíduo | `regressao.txt` |

**Dados e fixtures:** sites fictícios (com pixel, sem pixel e só JavaScript) e os simuladores da Apollo e da IA, removidos no fim.

**Caminhos de erro obrigatórios:**
- site fora do ar;
- site só em JavaScript;
- Apollo com 401 ou 429;
- IA fora do ar;
- JSON inválido;
- limite diário.

## Teste humano do cliente

Sem sessão própria (D-07). O José vê a pesquisa e o briefing na sessão única do fim da SPEC-1-005.

## Handoff e operação

- **Demonstrar:** abrir a melhor conta e ler o briefing.
- **Operar:** o José corrige o que vier errado. As correções valem sobre as próximas pesquisas.
- **Monitorar:** pesquisas parciais ou pendentes por semana e o custo da IA no mês.

## Tasks vinculadas

Status, responsável e prazo ficam só em `04_fase-atual/fase.md`.

| Task | Critério | Prova |
|---|---|---|
| Pesquisar sozinho cada conta priorizada e escrever o briefing | CA-1-16 a CA-1-20 | TDD 1 a 5 |
| Ler o site e marcar a maturidade digital com evidência | CA-1-16, CA-1-17 | TDD 1 e 2 |
| Trazer os decisores da conta pela busca de pessoas | CA-1-18 | TDD 2 |
| Escrever o briefing de abertura com IA e as fontes | CA-1-19 | TDD 3 |
| Encadear a pesquisa com fila, limite diário e nova tentativa | CA-1-20 | TDD 4 e 5 |

## Emendas

Nenhuma.
