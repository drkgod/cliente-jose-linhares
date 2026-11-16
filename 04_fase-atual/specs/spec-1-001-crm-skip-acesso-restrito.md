# SPEC-1-001 — CRM da JLA no Skip com acesso protegido

**Fase:** 1 · **Status:** pronta para construir · **Dono:** José Linhares (com o Maestro) · aceite: consultor Rodrigo Santos
**Origem no escopo:** funcionalidade 4.8, regras 1 e 12 · decisões D-01, D-02, D-13 · insumos CL-001, CL-002
**Degrau da solução:** nativo da plataforma. Usa o login, as regras de acesso e o cofre de segredos do próprio Skip; nenhuma tela de login ou criptografia própria.

## Contexto e decisões fechadas

- **Estado atual:** a JLA não tem CRM. Contas, contatos e acompanhamento ficam no Google Drive, na Agenda e na memória do José.
- **Estado desejado:** existe o projeto "JLA — CRM de prospecção" no Skip do José. Ele só abre com login e, nesta fase, só para o José. O cofre de segredos já está pronto para a chave da IA (SPEC-1-002).
- **Decisões já fechadas:**
  - **D-01:** a plataforma é o Skip (aplicação e banco), e o José constrói com o Maestro.
  - **D-02:** o uso é interno. Clientes da JLA não têm cadastro, login nem painel.
  - **Usuário:** nesta fase existe um único usuário, o José, com papel admin. O parceiro de comunicação entra na fase 3.
  - **Proteção:** o acesso é conferido no servidor, pelas regras de coleção e pelas funções do Skip. Esconder botão na tela não conta como proteção.
  - **Segredos:** chaves e senhas ficam só no cofre do Skip.
- **Pré-condição:** aval do José no escopo final (CL-001), pedido na call de 16/11.

## Resultado observável

O José abre o endereço do sistema, faz login e vê a tela inicial "JLA — CRM de prospecção" com o menu Clientes, Contas e Funil. Cada item mostra "em construção" até a sua SPEC. Qualquer outra pessoa, ou alguém sem login, não vê nenhum dado.

## Limites e dependências

- **Inclui:**
  - o projeto no Skip;
  - login obrigatório;
  - a coleção `acessos` e o papel admin;
  - a regra de acesso no servidor para todas as coleções;
  - o menu inicial;
  - o teste do cofre.
- **Fora de escopo:**
  - acesso do parceiro de comunicação (fase 3);
  - outros papéis;
  - conteúdo das telas (SPECs 1-002 a 1-004);
  - domínio próprio.
- **Entradas:** login do José no Maestro e no Skip, e o e-mail que ele usa no Skip (CL-002).
- **Saídas:**
  - o projeto criado e registrado em `07-sistemas/README.md`;
  - `acessos` com 1 registro;
  - a regra aplicada;
  - o segredo `TESTE_COFRE` criado e removido;
  - as provas em `05_entregas/fase-1/evidencias/SPEC-1-001/`.
- **Superfícies afetadas:** só o novo projeto. Outros projetos que o José tenha no Skip não mudam.
- **Risco e plano B:** se o Skip não deixar desligar o cadastro público, a regra no servidor recusa todo e-mail fora de `acessos`, com o mesmo efeito.
- **Reversão:** o projeto é novo. Desfazer é remover o projeto.

## Dados e integrações

| Origem/destino | Fonte de verdade | Campos/contrato | Permissão | Idempotência | Erro |
|---|---|---|---|---|---|
| Coleção `acessos` | José | `email` (minúsculo, único), `papel` (admin), `ativo` (sim/não), `criado_em` | leitura e escrita só para admin | e-mail único; repetir não duplica | e-mail repetido é recusado |
| Cofre do Skip | Skip | nome do segredo → valor | só funções do servidor leem | — | segredo ausente gera "segredo não configurado", sem mostrar valor |

| Regra | Condição | Resultado |
|---|---|---|
| RN-01 | Pessoa sem login | Vai para a tela de login; nenhum dado é enviado |
| RN-02 | Login fora de `acessos` ou com `ativo = não` | "Acesso não liberado."; nenhum dado é enviado |
| RN-03 | Qualquer leitura ou escrita | O servidor confere `acessos` antes de responder |
| RN-04 | Chaves e senhas | Só no cofre; nunca em código, tela, planilha, log ou mensagem |

## Fluxo e regras

1. Criar o projeto "JLA — CRM de prospecção" na conta Skip do José.
2. Ativar o login e desligar o cadastro público, se a opção existir.
3. Criar `acessos` e o registro do José com `papel = admin` e `ativo = sim`.
4. Aplicar a RN-03 em todas as coleções, inclusive nas das próximas SPECs.
5. Criar a tela inicial com o menu Clientes, Contas e Funil.
6. Criar `TESTE_COFRE`, conferir que uma função do servidor o lê e que ele não aparece em tela, código ou log, e depois removê-lo.

| Cenário | Condição | Resultado esperado | Recuperação |
|---|---|---|---|
| Principal | José faz login | Tela inicial com o menu | — |
| Limite | Sessão expirada | Volta ao login sem mostrar dado | entrar de novo |
| Falha | E-mail não autorizado | "Acesso não liberado" e zero dados | o José libera o e-mail (só a partir da fase 3) |

## Instruções de execução para o Maestro

- **Ler antes de alterar:** esta SPEC, `AGENTS.md`, `06_notas/decisoes-do-projeto.md` e a lista de projetos do José no Skip, para não alterar nenhum deles.
- **Alterar somente:** o novo projeto e `07-sistemas/`.
- **Não alterar:** outros projetos do Skip, plano ou cobrança.
- **Ordem:** passos 1 a 6 do fluxo e depois o TDD.
- **Parar quando:**
  - o Skip não oferecer login ou regra no servidor;
  - um passo pedir mudança de plano ou cobrança.

  Se o e-mail do José ainda não estiver informado, siga com a conta de teste e cadastre o José quando chegar.
- **Estado válido ao parar:** o projeto existe, sem dados, e ninguém sem autorização lê nada.

## Checklist de execução

- [ ] Projeto criado e registrado em `07-sistemas/README.md`.
- [ ] Login ativo e cadastro público desligado, ou bloqueado pela regra.
- [ ] `acessos` com o José como admin.
- [ ] RN-03 aplicada e provada com a conta de teste.
- [ ] Cofre testado e `TESTE_COFRE` removido.
- [ ] Provas em `05_entregas/fase-1/evidencias/SPEC-1-001/`.

## Critérios de aceite

- **CA-1-01:** sem login, abrir o endereço leva à tela de login, e nenhuma coleção devolve dados.
- **CA-1-02:** com uma conta de teste fora de `acessos`, aparece "Acesso não liberado", e o servidor recusa a leitura direta de qualquer coleção.
- **CA-1-03:** o José, ou a conta de teste cadastrada como admin enquanto o e-mail dele não chega, entra e vê o menu Clientes, Contas e Funil.
- **CA-1-04:** uma função do servidor lê o segredo de teste, e o valor não aparece em tela, código ou log.

## TDD da SPEC

| # | Etapa | Prova | Comando/ação | Resultado esperado | Evidência |
|---|---|---|---|---|---|
| 1 | RED | Leitura anônima antes da regra | Criar `teste_acesso` com 1 registro fictício e ler sem login | Devolve o registro, o que mostra que sem regra o dado vaza | `evidencias/SPEC-1-001/red.txt` |
| 2 | GREEN | Mesma leitura depois da RN-03 | Repetir sem login e com a conta de teste fora de `acessos` | Recusa nos dois casos (CA-1-01, CA-1-02) | `green-acesso.txt` |
| 3 | GREEN | Login do admin | Entrar com o admin | Menu com os três itens (CA-1-03) | captura |
| 4 | GREEN | Cofre | Ler `TESTE_COFRE` por função do servidor e procurar o valor em tela, código e log | A função lê e o valor não aparece (CA-1-04) | `green-cofre.txt` |
| 5 | REGRESSÃO | Navegador automatizado | Janela anônima, conta de teste e admin; depois remover `teste_acesso`, `TESTE_COFRE` e a conta de teste | Só o admin entra, e nada de teste sobra | `regressao.txt` |

**Dados e fixtures:** conta de teste temporária, criada e apagada pelo Maestro, e a coleção `teste_acesso` com um registro fictício.

**Caminhos de erro obrigatórios:**
- sem login;
- e-mail não autorizado;
- `ativo = não`;
- segredo ausente.

## Teste humano do cliente

Sem sessão própria (D-07). Esta SPEC fecha pela prova automática. O José vê o login e o menu na sessão única do fim da SPEC-1-004.

## Handoff e operação

- **Demonstrar:** login do José e uma tentativa negada, na call de validação.
- **Operar:** só o José libera e-mails novos, a partir da fase 3.
- **Monitorar:** revisar `acessos` a cada fase.

## Tasks vinculadas

Status, responsável e prazo ficam só em `04_fase-atual/fase.md`.

| Task | Critério | Prova |
|---|---|---|
| Começar a construção da fase 1 na call de 16/11 | pré-condição CL-001 | registro da call |
| Dar o aval no escopo final do projeto | pré-condição CL-001 | aval por escrito |
| Abrir o CRM da JLA no Skip com acesso só do José | CA-1-01 a CA-1-04 | TDD 1 a 5 |
| Entrar no Maestro e no Skip e informar o e-mail de acesso | insumo CL-002 | login feito |
| Criar o projeto do CRM no Skip com login obrigatório | CA-1-01, CA-1-03 | TDD 1 e 3 |
| Liberar o acesso só para o José e bloquear os demais | CA-1-02, CA-1-04 | TDD 2, 4 e 5 |

## Emendas

Nenhuma.
