# Fase 1 — Tarefas

<!-- fase-format:2 -->

Cada linha é uma tarefa da Jornada de Execução. **Tudo que cabe num card cabe nesta linha** — se um
campo não estiver aqui, ele não tem como ser preenchido, porque é este arquivo que cria a tarefa.

```text
- [ ] Título da tarefa @responsável !30/09/2026 #projeto [interno] <!-- id:… -->
  > descrição da tarefa, uma ou mais linhas
  - [ ] subtarefa (basta indentar 2 espaços) <!-- id:… -->
    - [ ] sub-subtarefa (indente mais 2) <!-- id:… -->
```

| marcador | o que define | se você não escrever |
|---|---|---|
| `- [ ]` / `- [/]` / `- [x]` | a fazer / em andamento / concluída | a fazer |
| `@nome` | responsável (`@"Nome Composto"` com aspas) | fica **sem responsável** |
| `!dd/mm/aaaa` | prazo | fica **sem prazo** |
| `#projeto` / `#aculturamento` | tipo | Projeto de IA |
| `[interno]` | o cliente **não** vê esta tarefa | o cliente vê |
| `> texto` na linha de baixo | descrição (aparece ao abrir o card) | sem descrição |
| indentar 2 espaços | vira subtarefa da tarefa acima (vale em qualquer profundidade) | tarefa de topo |

Os marcadores só valem **no fim da linha** — `Revisar #3 do contrato` continua sendo um título.
Um título que TERMINA na forma de um marcador sai escapado com `\` (`Ligar para \@joao`); a barra é
só para o parser e nunca aparece no card. Você não precisa escrever isso à mão.
Marque `[x]` para concluir e adicione linhas novas à vontade: elas entram no quadro na próxima
sincronização e voltam aqui com o `<!-- id:… -->` preenchido. **Não apague o marcador de id** das
tarefas que já têm um.

- [ ] Começar a construção da fase 1 na call de 16/11 @"Rodrigo Santos" !16/11/2026 #projeto
  > Call com o José: escopo final, as 5 SPECs da fase 1, Maestro ligado a este repositório e o que o José informa durante a construção. Ref.: SPEC-1-001.
  - [ ] Dar o aval no escopo final do projeto @"José Linhares" !16/11/2026 #projeto
    > Responder "aprovado" ao escopo final ou dizer o que falta ou sobra. Pode ser na call de 16/11. Ref.: SPEC-1-001 · CL-001.
- [x] Abrir o CRM da JLA no Skip com acesso só do José @"José Linhares" !18/11/2026 #projeto
  > Projeto "JLA — CRM de prospecção" no Skip, só com login e só para o José. Fecha pela prova automática. Ref.: SPEC-1-001 (CA-1-01 a CA-1-04).
  - [ ] Entrar no Maestro e no Skip e informar o e-mail de acesso @"José Linhares" !17/11/2026 #projeto
    > Insumo do José (CL-002): entra no Maestro e no Skip e informa ao Maestro o e-mail que usa no Skip.
  - [x] Criar o projeto do CRM no Skip com login obrigatório @"José Linhares" !17/11/2026 #projeto
    > Projeto novo com login e o menu Clientes, Contas e Funil ("em construção" até a sua SPEC). Prova: TDD 1 e 3 da SPEC-1-001 (CA-1-01, CA-1-03).
  - [x] Liberar o acesso só para o José e bloquear os demais @"José Linhares" !18/11/2026 #projeto
    > Coleção acessos com o José como admin, regra no servidor em todas as coleções e cofre testado. Prova: TDD 2, 4 e 5 da SPEC-1-001 (CA-1-02, CA-1-04).
- [x] Cadastrar o cliente atendido e o perfil ideal sugerido por IA @"José Linhares" !23/11/2026 #projeto
  > Cada cliente com carteira própria; a IA sugere o perfil ideal pelo site e pelo cadastro e o José aprova. Fecha pela prova automática. Ref.: SPEC-1-002.
  - [x] Informar ao Maestro os dados do cliente teste @"José Linhares" !19/11/2026 #projeto
    > Insumo do José (CL-003): site, produtos, dores e soluções, playbook, closer e regras de prioridade do cliente teste, direto no Maestro.
  - [ ] Guardar a chave da IA no cofre do Skip @"José Linhares" !19/11/2026 #projeto
    > Insumo do José (CL-005): colar a chave como IA_API_KEY direto no cofre do Skip. A chave nunca vai por chat, e-mail ou WhatsApp.
  - [x] Criar o cadastro do cliente atendido com carteira separada @"José Linhares" !19/11/2026 #projeto
    > Coleção clientes_atendidos e tudo ligado à carteira do cliente; uma carteira nunca vê a outra. Prova: TDD 1 e 2 da SPEC-1-002 (CA-1-05, CA-1-06).
  - [x] Sugerir o perfil ideal com IA a partir do site e do cadastro @"José Linhares" !21/11/2026 #projeto
    > A IA lê o site e o cadastro e propõe empresa-alvo, porte, cargos, prioridade e exclusões, com a fonte de cada item. Prova: TDD 3 da SPEC-1-002 (CA-1-07).
  - [x] Aprovar, ajustar e versionar o perfil ideal @"José Linhares" !23/11/2026 #projeto
    > O perfil fica "sugerido" até o José aprovar; ajuste vira versão nova; só o aprovado vale na triagem. Prova: TDD 4 e 5 da SPEC-1-002 (CA-1-08, CA-1-09).
- [x] Buscar contas sozinho pelas APIs e dar nota com o motivo @"José Linhares" !26/11/2026 #projeto
  > Com o perfil aprovado, o sistema puxa contas da Anvisa, do CNPJ e da Apollo toda semana e dá nota com motivo. Ref.: SPEC-1-003 (CA-1-10 a CA-1-15).
  - [x] Guardar a chave da Apollo no cofre do Skip @"José Linhares" !20/11/2026 #projeto
    > Insumo do José (CL-010): criar a conta gratuita na Apollo e colar a chave como APOLLO_API_KEY direto no cofre do Skip, nunca no chat.
  - [ ] Enviar ao Maestro a primeira lista de contas do cliente teste @"José Linhares" !20/11/2026 #projeto
    > Insumo opcional do José (CL-004): planilha com empresas que ele já quer na lista. O Maestro não espera: a busca automática segue.
  - [x] Buscar contas nas APIs a partir do perfil aprovado @"José Linhares" !23/11/2026 #projeto
    > Busca disparada pela aprovação, por botão e toda segunda; junta as fontes sem duplicar e registra cada execução. Prova: TDD 1 e 2 da SPEC-1-003.
  - [x] Completar porte e atividade pelos dados abertos do CNPJ @"José Linhares" !24/11/2026 #projeto
    > Consulta aberta por CNPJ: porte, capital, CNAE, situação e cidade; falha vira "pendente de dados". Prova: TDD 3 da SPEC-1-003 (CA-1-12, CA-1-15).
  - [x] Calcular a nota sozinho a cada conta nova, com o motivo @"José Linhares" !26/11/2026 #projeto
    > Regras do perfil viram pontos; a conta mostra nota, faixa e motivo; fora do perfil fica com motivo. Prova: TDD 4 e 5 da SPEC-1-003 (CA-1-13, CA-1-14).
- [x] Pesquisar sozinho cada conta priorizada e escrever o briefing @"José Linhares" !30/11/2026 #projeto
  > Conta em Prioridade é pesquisada sozinha: maturidade digital do site, decisores e briefing de abertura pela IA. Ref.: SPEC-1-004 (CA-1-16 a CA-1-20).
  - [x] Ler o site e marcar a maturidade digital com evidência @"José Linhares" !27/11/2026 #projeto
    > CRM, pixel e automação lidos no site com a evidência; sem evidência fica "não lido". Prova: TDD 1 e 2 da SPEC-1-004 (CA-1-16, CA-1-17).
  - [x] Trazer os decisores da conta pela busca de pessoas @"José Linhares" !27/11/2026 #projeto
    > Até 5 decisores com nome, cargo e fonte pela Apollo, sem e-mail e sem telefone. Prova: TDD 2 da SPEC-1-004 (CA-1-18).
  - [x] Escrever o briefing de abertura com IA e as fontes @"José Linhares" !28/11/2026 #projeto
    > Dor provável, gatilho e abordagem com as fontes; dor sem fonte fica "a confirmar". Prova: TDD 3 da SPEC-1-004 (CA-1-19).
  - [x] Encadear a pesquisa com fila, limite diário e nova tentativa @"José Linhares" !30/11/2026 #projeto
    > Fila com limite de 25 por dia, nova tentativa automática e correção do José mantida. Prova: TDD 4 e 5 da SPEC-1-004 (CA-1-20).
- [x] Mostrar as contas no funil visual do CRM @"José Linhares" !02/12/2026 #projeto
  > Funil por cliente com etapa, nota, briefing, histórico e motivo. No fim, o único teste da fase com o José e o questionário de produto. Ref.: SPEC-1-005.
  - [x] Montar o funil com as etapas e a ficha da conta @"José Linhares" !01/12/2026 #projeto
    > Colunas por etapa, cartão com nota e origem, ficha com dados, motivo, briefing e histórico. Prova: TDD 1 e 2 da SPEC-1-005 (CA-1-21, CA-1-22).
  - [x] Mover contas entre etapas e anotar à mão com histórico @"José Linhares" !01/12/2026 #projeto
    > O José arrasta a conta, dá o motivo ao descartar e anota contato de outro canal; tudo vai ao histórico. Prova: TDD 3 da SPEC-1-005 (CA-1-23, CA-1-24).
  - [x] Filtrar por cliente, faixa de nota, etapa e origem @"José Linhares" !01/12/2026 #projeto
    > Filtros combinados e contador por etapa; nada de outra carteira aparece. Prova: TDD 4 da SPEC-1-005 (CA-1-25).
  - [ ] Testar o funil e responder o questionário de produto @"José Linhares" !02/12/2026 #projeto
    > Sessão única da fase, de até 15 minutos: o José faz o roteiro de teste da SPEC-1-005 e responde ao questionário de produto.
- [ ] Validar a fase 1 com o José @"Rodrigo Santos" !03/12/2026 #projeto
  > Call de validação: 25 critérios com prova em 05_entregas, sessão do fim da SPEC-1-005 feita e aceite do consultor. Ref.: SPEC-1-005.
