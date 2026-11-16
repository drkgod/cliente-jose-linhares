# Instruções para o Maestro — CRM de prospecção JLA

Antes de qualquer alteração, leia:
- este arquivo;
- o `README.md`;
- o `STATUS.md`;
- `06_notas/decisoes-do-projeto.md`;
- `04_fase-atual/specs/00-INDICE.md`.

## Fila de trabalho

Há uma fase aberta: `04_fase-atual/fase.md`, com as SPECs 1-001 a 1-004 em `04_fase-atual/specs/`. Siga a ordem do arquivo.

**Tarefas de insumo** (`CL-xxx`, em `06_notas/insumos-do-jose.md`) são ações do José. Não espere por elas:
- **sem a chave da IA:** use o simulador da IA;
- **sem a lista de contas:** use a lista aberta da Anvisa (D-09);
- **sem o e-mail do José:** use uma conta de teste como admin.

Deixe a tarefa aberta até o José resolver.

**Tarefas com `@"Rodrigo Santos"`** são do consultor (calls e aceite). Você não as marca.

## Ritmo e teste do cliente

- Construa as tarefas em sequência, uma por vez, sem pedir autorização nem teste entre elas.
- **Em cada tarefa:**
  1. leia a SPEC inteira;
  2. implemente só o recorte da tarefa;
  3. rode o RED, o GREEN e a regressão indicados na SPEC;
  4. grave a saída em `05_entregas/fase-1/evidencias/SPEC-1-00N/`;
  5. se passou, marque `[x]` e siga.
- Só existe uma sessão com o José nesta fase: no fim da SPEC-1-004, com teste e questionário de produto. As SPECs 1-001 a 1-003 fecham pela prova automática.
- **Só pare por:**
  - pergunta que muda a implementação e que a SPEC não responde;
  - acesso ou chave que só o José tem;
  - ação de risco em dado real;
  - falha que você não consegue resolver.

  Uma pergunta numa tarefa não para as outras que não dependem dela.
- Não pergunte o que já está nas SPECs ou em `06_notas/`. O que não está decidido já tem um padrão (`D-xx`): use o padrão. Decisão que muda escopo ou aceite vai para a consultoria como `DÚVIDA:` no `STATUS.md`.

## Fim da SPEC-1-004: teste e questionário de produto

Quando a última tarefa de construção da SPEC-1-004 fechar, faça uma sessão curta com o José.

1. **Teste:** peça as ações da seção `## Teste humano do cliente` da SPEC, com o link e o passo a passo em frases curtas.
2. **Questionário:**
   - faça uma pergunta por vez;
   - dê opções por letra (A, B, C) e sempre "outra: me conte";
   - mostre uma captura de cada opção;
   - diga qual opção é a de hoje: sem resposta, fica como está;
   - acrescente no máximo 2 perguntas suas, desde que caibam na SPEC;
   - não faça perguntas técnicas.
3. **Não espere a resposta:** siga para o que faltar da fase.
4. **Quando a resposta chegar:**
   - registre em `06_notas/preferencias-do-jose.md`;
   - o que cabe na SPEC vira ajuste, com prova;
   - o que muda regra, decisão ou escopo vai como `DÚVIDA:` no `STATUS.md`.

## Limites

- **Nenhuma mensagem sai nesta fase.**
  - Nada de e-mail, LinkedIn ou WhatsApp para lead, cliente ou closer.
  - Envios só existem a partir da fase 3, depois da autorização escrita do cliente teste (D-04).
- **Dados:**
  - nada de base paga nem robô em site que proíbe;
  - nesta fase, só nome da empresa, CNPJ e dados públicos da empresa;
  - nenhum dado pessoal de lead.
- **Carteiras:** tudo é filtrado por cliente atendido no servidor. Nada de uma carteira aparece em outra.
- **Segredos:**
  - `IA_API_KEY` fica só no cofre do Skip, colada pelo José;
  - nunca peça chave por chat, e-mail ou WhatsApp;
  - nunca escreva chave em código, log, prova ou mensagem.
- **Skip:** altere só o projeto "JLA — CRM de prospecção". Outros projetos do José, plano e cobrança não são tocados.

## Ao terminar cada tarefa

1. Grave as provas em `05_entregas/fase-1/evidencias/SPEC-1-00N/`.
2. Marque `[x]` na tarefa em `04_fase-atual/fase.md`, sem apagar o `<!-- id:… -->`.
3. Acrescente uma linha no `changelog.md` e atualize o `STATUS.md` e o `.adapta-cliente/estado-atual.md`.
4. Faça um commit único com o código, as provas e o registro da tarefa.
