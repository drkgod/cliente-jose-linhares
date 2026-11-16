# CRM de prospecção — JLA (José Linhares)

Projeto Adapta Native da JLA Representações. O sistema é um **CRM de uso interno** da consultoria. Ele roda no **Skip** do José (aplicação e banco) e é construído pelo **Maestro** junto com o José. O sistema cobre:

1. o perfil ideal de cada cliente atendido;
2. as contas com nota;
3. a pesquisa;
4. as cadências por e-mail, LinkedIn e WhatsApp;
5. a qualificação;
6. a passagem da reunião ao closer.

Este repositório é o lugar de trabalho do Maestro do José: tarefas, SPECs e provas de cada entrega.

## Onde está cada coisa

| Pasta ou arquivo | O que tem |
|---|---|
| `AGENTS.md` | Regras para o Maestro: ordem, ritmo, provas, limites e segurança. Leia antes de tudo. |
| `STATUS.md` | Onde o projeto está hoje. |
| `changelog.md` | O que mudou, uma linha por entrega. |
| `04_fase-atual/fase.md` | Tarefas da fase 1, que são a fonte dos cards do portal. |
| `04_fase-atual/specs/` | SPECs da fase 1. Índice em `00-INDICE.md`. |
| `05_entregas/fase-1/` | Provas de cada SPEC (RED, GREEN e regressão). |
| `06_notas/decisoes-do-projeto.md` | Decisões já combinadas (D-01 a D-14), citadas nas SPECs. |
| `06_notas/insumos-do-jose.md` | O que só o José entrega ou decide (CL-001 a CL-010) e a situação de cada item. |
| `06_notas/preferencias-do-jose.md` | Respostas do José ao questionário de produto do fim da SPEC. |
| `07-sistemas/` | Registro do projeto do Skip criado pelo Maestro. |
| `.adapta-cliente/estado-atual.md` | Estado do agente: tarefa em construção, etapa e próxima ação. |

## Fases

| Fase | Entrega | Situação |
|---|---|---|
| 1 | Motor automático sem envio: CRM no Skip; perfil ideal por IA; busca semanal de contas pelas APIs (Anvisa, CNPJ e Apollo) com nota e motivo; pesquisa automática (maturidade digital, decisores e briefing por IA); funil | em construção de 16/11 a 03/12/2026 |
| 2 | E-mails dos decisores validados, celular direto quando pago, sinais de mercado mensais, Sales Navigator opcional | a consultoria libera depois |
| 3 | Cadências nos três canais com freio, lista única de saída e formulário de lead quente (só com a autorização escrita do cliente) | depois |
| 4 | Agente de respostas pelo playbook, qualificação, agendamento com o aval do José e resumo ao closer | depois |
| 5 | Números por cliente, canal e lista, mapa da jornada, busca inteligente, loops e validação ponta a ponta | depois |
