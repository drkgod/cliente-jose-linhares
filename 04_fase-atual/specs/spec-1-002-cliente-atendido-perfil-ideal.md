# SPEC-1-002 — Cliente atendido com carteira própria e perfil ideal sugerido por IA

**Fase:** 1 · **Status:** pronta para construir · **Dono:** José Linhares (com o Maestro) · aceite: consultor Rodrigo Santos
**Origem no escopo:** funcionalidades 4.1 e 4.2, regra 3 · decisões D-02, D-13 · insumos CL-003, CL-005
**Degrau da solução:** construção mínima sobre o nativo. Usa as coleções do Skip e uma chamada de IA paga por uso, numa função do servidor com a chave no cofre; nenhum modelo próprio.

## Contexto e decisões fechadas

- **Estado atual:** o perfil ideal de cada cliente fica na cabeça do José. O que cada cliente vende, as dores e o playbook estão espalhados.
- **Estado desejado:**
  - cada cliente da JLA tem uma carteira no CRM, com site, produtos, dores e soluções, playbook, closer e regras de prioridade;
  - a IA lê o site e o cadastro e sugere o perfil ideal;
  - o José aprova ou ajusta, e só o perfil aprovado vale para a triagem (SPEC-1-003).
- **Decisões já fechadas:**
  - **Carteiras:** tudo pertence a uma carteira, e nada de uma carteira aparece em outra (regra 3).
  - **Perfil ideal:**
    - pode haver mais de um perfil por cliente;
    - cada ajuste vira uma versão nova;
    - fica "sugerido" até o José aprovar.
  - **D-13:** a IA é chamada por uma função do servidor, com a chave `IA_API_KEY` no cofre. O provedor é o que o José escolher na construção, e o custo estimado é de R$ 15 a 25 por mês.
  - **Dados do cliente teste:** não passam pelo consultor. O José informa no Maestro quando ele pedir (CL-003).

## Resultado observável

1. Na tela Clientes, o José cadastra o cliente teste e informa o site.
2. Ele clica em "Sugerir perfil ideal" e, em até 2 minutos, vê a sugestão com a fonte de cada item: tipo e porte de empresa, cargos que decidem, critérios de prioridade e exclusões.
3. Ele ajusta e aprova. O perfil aprovado fica marcado como "vigente", com a versão e a data.

## Limites e dependências

- **Inclui:**
  - as coleções `clientes_atendidos` e `perfis_ideais`;
  - a tela Clientes, com cadastro, lista e ficha;
  - a sugestão por IA;
  - a aprovação e as versões.
- **Fora de escopo:**
  - busca de contas (SPEC-1-003);
  - pesquisa da conta e briefing (fase 2);
  - contas de envio do cliente (fase 3).
- **Entradas:**
  - os dados do cliente teste (CL-003);
  - a chave da IA no cofre (CL-005).
- **Saídas:**
  - o cliente teste cadastrado;
  - 1 perfil ideal aprovado;
  - as provas em `05_entregas/fase-1/evidencias/SPEC-1-002/`.
- **Dependência:** SPEC-1-001.
- **Risco e plano B:**
  - **Site que não abre ou é feito só em JavaScript:** a sugestão usa só o cadastro e mostra "site não lido".
  - **Chave da IA que ainda não chegou:** construa e prove com um simulador da resposta da IA, no mesmo formato, e faça a prova real quando a chave chegar.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Permissão | Idempotência | Erro |
|---|---|---|---|---|---|
| `clientes_atendidos` | José | `nome`, `site`, `produtos`, `dores_solucoes`, `playbook` (texto ou arquivo), `closer_nome`, `closer_email`, `regras_prioridade`, `ativo` | admin | `nome` único | campo obrigatório vazio é recusado com a mensagem do campo |
| `perfis_ideais` | IA sugere, José aprova | `cliente` (vínculo), `versao`, `status` (sugerido/aprovado/substituído), `tipo_empresa`, `porte`, `cargos`, `prioridade`, `exclusoes`, `fontes` (lista: item → site, cadastro ou José), `aprovado_em` | admin | nova versão nunca apaga a anterior | — |
| IA (função `sugerir_perfil`) | provedor escolhido | entrada: texto do site, até cerca de 20 mil caracteres, mais o cadastro; saída: JSON validado com os campos do perfil e a fonte de cada item | chave só no cofre | — | erro, tempo esgotado ou JSON inválido mostra "Não deu para sugerir agora", e o perfil não muda |

| Regra | Condição | Resultado |
|---|---|---|
| RN-05 | Leitura de qualquer registro | Só da carteira escolhida; o servidor filtra por `cliente` |
| RN-06 | Perfil sugerido | Não vale para a triagem até `status = aprovado` |
| RN-07 | José ajusta um perfil aprovado | Cria a versão N+1 aprovada; a anterior vira "substituído" |
| RN-08 | Item sem fonte na resposta da IA | O item é descartado e não aparece na sugestão |

## Fluxo e regras

1. Criar as coleções com a RN-03 da SPEC-1-001 e o filtro por carteira (RN-05).
2. Criar a tela Clientes, com lista, cadastro e ficha.
3. Criar a função `sugerir_perfil`:
   1. ler o site, com tempo limite de 20 segundos;
   2. montar a entrada;
   3. chamar a IA com a resposta em JSON;
   4. validar o formato;
   5. gravar como "sugerido".
4. Na ficha, mostrar o perfil sugerido e os botões "Aprovar" e "Ajustar e aprovar", que geram a versão nova (RN-07).
5. Cadastrar o cliente teste com os dados que o José passar.

| Cenário | Condição | Resultado esperado | Recuperação |
|---|---|---|---|
| Principal | Site abre e a IA responde | Sugestão com fontes em até 2 minutos | — |
| Limite | Site não abre | Sugestão só pelo cadastro, com "site não lido" | o José completa à mão |
| Falha | IA fora do ar ou resposta inválida | "Não deu para sugerir agora"; nada é gravado | tentar de novo |

## Instruções de execução para o Maestro

- **Ler antes de alterar:** esta SPEC, `AGENTS.md`, `06_notas/decisoes-do-projeto.md` e `06_notas/insumos-do-jose.md`.
- **Alterar somente:** o projeto "JLA — CRM de prospecção" e `07-sistemas/`.
- **Ordem:** passos 1 a 5 e depois o TDD. Use o simulador da IA enquanto `IA_API_KEY` não estiver no cofre.
- **Parar quando:** a escolha do provedor da IA mudar o custo além de R$ 50 por mês. Nesse caso, registre `DÚVIDA:` no `STATUS.md` e siga com o simulador.
- **Nunca:** pedir a chave por chat ou gravar dado do cliente teste em `06_notas/` além do que o José autorizar.

## Checklist de execução

- [ ] Coleções e filtro por carteira aplicados.
- [ ] Tela Clientes com cadastro, lista e ficha.
- [ ] Função `sugerir_perfil` com validação do JSON e fontes.
- [ ] Aprovação e versões funcionando.
- [ ] Cliente teste cadastrado e 1 perfil aprovado.
- [ ] Provas em `05_entregas/fase-1/evidencias/SPEC-1-002/`.

## Critérios de aceite

- **CA-1-05:** o José cadastra um cliente com os campos obrigatórios. Campo obrigatório vazio é recusado com a mensagem do campo.
- **CA-1-06:** com dois clientes cadastrados, a lista e a leitura direta pelo servidor de uma carteira não trazem nenhum registro da outra.
- **CA-1-07:** "Sugerir perfil ideal" grava um perfil "sugerido" com tipo e porte de empresa, cargos, prioridade e exclusões, e cada item tem fonte.
- **CA-1-08:** um perfil "sugerido" não aparece como vigente. Depois de aprovado, aparece com versão e data.
- **CA-1-09:** ajustar um perfil aprovado cria a versão seguinte, e a anterior continua consultável como "substituído".

## TDD da SPEC

| # | Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|---|
| 1 | RED | Cadastro sem obrigatórios | Enviar um cliente sem `nome` e sem `site` | Recusado, com a mensagem de cada campo (CA-1-05) | `red.txt` |
| 2 | GREEN | Isolamento | Criar os clientes fictícios A e B, com 1 perfil cada; ler A pela tela e pelo servidor | Nada de B aparece (CA-1-06) | `green-carteiras.txt` |
| 3 | GREEN | Sugestão | Rodar `sugerir_perfil` com um site fictício (simulador) e depois com o site real do cliente teste | Perfil "sugerido" com fontes; item sem fonte descartado (CA-1-07) | `green-sugestao.txt` |
| 4 | GREEN | Aprovação | Aprovar o perfil e conferir se é o vigente | Versão 1 aprovada, com data (CA-1-08) | `green-aprovacao.txt` |
| 5 | REGRESSÃO | Versões e falhas | Ajustar o perfil aprovado; simular IA fora do ar e JSON inválido; remover A e B | Versão 2 vigente e versão 1 "substituído"; falha não grava nada (CA-1-09) | `regressao.txt` |

**Dados e fixtures:** clientes fictícios A e B e um site fictício no simulador, todos removidos no fim.

**Caminhos de erro obrigatórios:**
- site que não abre;
- IA fora do ar;
- JSON inválido;
- item sem fonte;
- leitura cruzada de carteira.

## Teste humano do cliente

Sem sessão própria (D-07). O José vê o cadastro e o perfil na sessão única do fim da SPEC-1-004.

## Handoff e operação

- **Demonstrar:** cadastrar o cliente teste e mostrar a sugestão com as fontes.
- **Operar:** cada cliente novo começa por este cadastro, e o perfil é revisto quando o resultado mudar.
- **Monitorar:** contar as sugestões com falha por mês.

## Tasks vinculadas

Status, responsável e prazo ficam só em `04_fase-atual/fase.md`.

| Task | Critério | Prova |
|---|---|---|
| Cadastrar o cliente atendido e o perfil ideal sugerido por IA | CA-1-05 a CA-1-09 | TDD 1 a 5 |
| Informar ao Maestro os dados do cliente teste | insumo CL-003 | cliente teste cadastrado |
| Guardar a chave da IA no cofre do Skip | insumo CL-005 | função lê a chave (sem mostrar) |
| Criar o cadastro do cliente atendido com carteira separada | CA-1-05, CA-1-06 | TDD 1 e 2 |
| Sugerir o perfil ideal com IA a partir do site e do cadastro | CA-1-07 | TDD 3 |
| Aprovar, ajustar e versionar o perfil ideal | CA-1-08, CA-1-09 | TDD 4 e 5 |

## Emendas

Nenhuma.
