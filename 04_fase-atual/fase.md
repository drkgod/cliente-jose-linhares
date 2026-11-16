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
  > Call com o José: escopo final, as 4 SPECs da fase 1, Maestro ligado a este repositório e o que o José informa durante a construção. Ref.: SPEC-1-001.
  - [ ] Dar o aval no escopo final do projeto @"José Linhares" !16/11/2026 #projeto
    > Responder "aprovado" ao escopo final ou dizer o que falta ou sobra. Pode ser na call de 16/11. Ref.: SPEC-1-001 · CL-001.
- [ ] Abrir o CRM da JLA no Skip com acesso só do José @"José Linhares" !18/11/2026 #projeto
  > Projeto "JLA — CRM de prospecção" no Skip, só com login e só para o José. Fecha pela prova automática. Ref.: SPEC-1-001 (CA-1-01 a CA-1-04).
  - [ ] Entrar no Maestro e no Skip e informar o e-mail de acesso @"José Linhares" !17/11/2026 #projeto
    > Insumo do José (CL-002): entra no Maestro e no Skip e informa ao Maestro o e-mail que usa no Skip.
  - [ ] Criar o projeto do CRM no Skip com login obrigatório @"José Linhares" !17/11/2026 #projeto
    > Projeto novo com login e o menu Clientes, Contas e Funil ("em construção" até a sua SPEC). Prova: TDD 1 e 3 da SPEC-1-001 (CA-1-01, CA-1-03).
  - [ ] Liberar o acesso só para o José e bloquear os demais @"José Linhares" !18/11/2026 #projeto
    > Coleção acessos com o José como admin, regra no servidor em todas as coleções e cofre testado. Prova: TDD 2, 4 e 5 da SPEC-1-001 (CA-1-02, CA-1-04).
- [ ] Cadastrar o cliente atendido e o perfil ideal sugerido por IA @"José Linhares" !23/11/2026 #projeto
  > Cada cliente com carteira própria; a IA sugere o perfil ideal pelo site e pelo cadastro e o José aprova. Fecha pela prova automática. Ref.: SPEC-1-002.
  - [ ] Informar ao Maestro os dados do cliente teste @"José Linhares" !19/11/2026 #projeto
    > Insumo do José (CL-003): site, produtos, dores e soluções, playbook, closer e regras de prioridade do cliente teste, direto no Maestro.
  - [ ] Guardar a chave da IA no cofre do Skip @"José Linhares" !19/11/2026 #projeto
    > Insumo do José (CL-005): colar a chave como IA_API_KEY direto no cofre do Skip. A chave nunca vai por chat, e-mail ou WhatsApp.
  - [ ] Criar o cadastro do cliente atendido com carteira separada @"José Linhares" !19/11/2026 #projeto
    > Coleção clientes_atendidos e tudo ligado à carteira do cliente; uma carteira nunca vê a outra. Prova: TDD 1 e 2 da SPEC-1-002 (CA-1-05, CA-1-06).
  - [ ] Sugerir o perfil ideal com IA a partir do site e do cadastro @"José Linhares" !21/11/2026 #projeto
    > A IA lê o site e o cadastro e propõe empresa-alvo, porte, cargos, prioridade e exclusões, com a fonte de cada item. Prova: TDD 3 da SPEC-1-002 (CA-1-07).
  - [ ] Aprovar, ajustar e versionar o perfil ideal @"José Linhares" !23/11/2026 #projeto
    > O perfil fica "sugerido" até o José aprovar; ajuste vira versão nova; só o aprovado vale na triagem. Prova: TDD 4 e 5 da SPEC-1-002 (CA-1-08, CA-1-09).
- [ ] Trazer as contas e dar nota de prioridade com o motivo @"José Linhares" !27/11/2026 #projeto
  > Contas por planilha e pela lista aberta, completadas pelo CNPJ; nota com motivo, fora do perfil e pendente de dados separados. Ref.: SPEC-1-003.
  - [ ] Enviar ao Maestro a primeira lista de contas do cliente teste @"José Linhares" !20/11/2026 #projeto
    > Insumo do José (CL-004): planilha com as empresas-alvo (nome e CNPJ quando tiver). Sem lista, o Maestro usa a lista aberta da Anvisa (D-09).
  - [ ] Importar contas por planilha sem duplicar @"José Linhares" !24/11/2026 #projeto
    > Lê CSV ou XLSX, casa pelo CNPJ (ou nome e cidade), guarda origem e linha e não duplica. Prova: TDD 1 e 2 da SPEC-1-003 (CA-1-10, CA-1-11).
  - [ ] Completar porte e atividade pelos dados abertos do CNPJ @"José Linhares" !25/11/2026 #projeto
    > Consulta aberta por CNPJ: porte, capital, CNAE, situação e cidade; falha vira "pendente de dados". Prova: TDD 3 da SPEC-1-003 (CA-1-12, CA-1-15).
  - [ ] Calcular a nota de prioridade com o motivo de cada ponto @"José Linhares" !27/11/2026 #projeto
    > Regras do perfil aprovado viram pontos; a conta mostra nota, faixa e motivo; fora do perfil fica com motivo. Prova: TDD 4 da SPEC-1-003 (CA-1-13, CA-1-14).
- [ ] Mostrar as contas no funil visual do CRM @"José Linhares" !01/12/2026 #projeto
  > Funil por cliente com etapa, nota, origem, histórico e motivo. No fim, o único teste da fase com o José e o questionário de produto. Ref.: SPEC-1-004.
  - [ ] Montar o funil com as etapas e a ficha da conta @"José Linhares" !28/11/2026 #projeto
    > Colunas por etapa, cartão com nota e origem, ficha com dados, motivo da nota e histórico. Prova: TDD 1 e 2 da SPEC-1-004 (CA-1-16, CA-1-17).
  - [ ] Mover contas entre etapas e anotar à mão com histórico @"José Linhares" !30/11/2026 #projeto
    > O José arrasta a conta, dá o motivo ao descartar e anota contato de outro canal; tudo vai ao histórico. Prova: TDD 3 da SPEC-1-004 (CA-1-18, CA-1-19).
  - [ ] Filtrar por cliente, faixa de nota, etapa e origem @"José Linhares" !30/11/2026 #projeto
    > Filtros combinados e contador por etapa; nada de outra carteira aparece. Prova: TDD 4 da SPEC-1-004 (CA-1-20).
  - [ ] Testar o funil e responder o questionário de produto @"José Linhares" !01/12/2026 #projeto
    > Sessão única da fase, de até 15 minutos: o José faz o roteiro de teste da SPEC-1-004 e responde ao questionário de produto.
- [ ] Validar a fase 1 com o José @"Rodrigo Santos" !02/12/2026 #projeto
  > Call de validação: 20 critérios com prova em 05_entregas, sessão do fim da SPEC-1-004 feita e aceite do consultor. Ref.: SPEC-1-004.
