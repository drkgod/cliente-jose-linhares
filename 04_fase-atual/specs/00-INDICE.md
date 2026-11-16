# Índice de SPECs — Fase 1 · Motor de prospecção automático (sem envio)

**Atualizado em:** 16/11/2026 · **Janela da fase:** 16/11 a 03/12/2026 (feriado em 20/11)

**Resultado da fase:**
1. O José cadastra o cliente teste e aprova o perfil ideal sugerido pela IA.
2. A partir daí, o sistema trabalha sozinho:
   - busca as contas pelas APIs (Anvisa, CNPJ e Apollo) toda semana;
   - dá a nota com o motivo;
   - pesquisa cada conta priorizada: maturidade digital do site, decisores e briefing de abertura pela IA.
3. O José só acompanha no funil e corrige o que vier errado.

Nenhuma mensagem é enviada nesta fase.

| SPEC | Entrega | Degrau | Critérios | Depende de | Sessão com o José |
|---|---|---|---|---|---|
| [SPEC-1-001](spec-1-001-crm-skip-acesso-restrito.md) | CRM no Skip com acesso protegido e cofre | nativo da plataforma | CA-1-01 a CA-1-04 | CL-001 (aval do escopo) | não (prova com conta de teste) |
| [SPEC-1-002](spec-1-002-cliente-atendido-perfil-ideal.md) | Cliente atendido e perfil ideal sugerido por IA | construção mínima sobre o nativo | CA-1-05 a CA-1-09 | SPEC-1-001; CL-003 e CL-005 | não (prova automática) |
| [SPEC-1-003](spec-1-003-busca-automatica-contas.md) | Busca automática de contas pelas APIs, com triagem e nota | dependência existente | CA-1-10 a CA-1-15 | SPEC-1-002; CL-010 | não (prova automática) |
| [SPEC-1-004](spec-1-004-pesquisa-automatica-briefing.md) | Pesquisa automática: maturidade digital, decisores e briefing | construção mínima sobre o nativo | CA-1-16 a CA-1-20 | SPEC-1-003; CL-005 e CL-010 | não (prova automática) |
| [SPEC-1-005](spec-1-005-funil-visual.md) | Funil visual com histórico | nativo da plataforma | CA-1-21 a CA-1-25 | SPEC-1-004 | **sim, a única da fase, com o questionário de produto** |

## Automações desta fase

| Automação | Gatilho | Resultado |
|---|---|---|
| Sugestão do perfil ideal | cliente cadastrado ou botão | perfil "sugerido" para o José aprovar |
| Busca de contas | perfil aprovado, botão ou toda segunda às 7h | contas novas, sem repetir, com registro da busca |
| Completar CNPJ | conta nova | porte, atividade e situação, ou "pendente de dados" |
| Triagem e nota | conta nova ou atualizada | nota, faixa e motivo, ou fora do perfil com motivo |
| Pesquisa da conta | conta entra em Prioridade | maturidade, decisores e briefing na ficha |

## Ordem de execução

SPEC-1-001 → SPEC-1-002 → SPEC-1-003 → SPEC-1-004 → SPEC-1-005.

Insumo que falta não para a construção:
- **sem as chaves da IA ou da Apollo:** use os simuladores no mesmo formato;
- **sem o e-mail do José:** use a conta de teste como admin.

## Fora desta fase

- **Fase 2:** e-mail e celular dos decisores com validação, e sinais de mercado.
- **Fase 3:** cadências e envios nos três canais, que só começam com a autorização escrita do cliente teste (D-04).
- **Fase 4:** respostas, qualificação, agendamento e resumo ao closer.
- **Fase 5:** relatório, mapa da jornada, busca inteligente e loops.

## Gate da fase

A fase fecha quando:
- os 25 critérios têm prova em `05_entregas/fase-1/`;
- a sessão do fim da SPEC-1-005 foi feita;
- o consultor deu o aceite na call de validação de 03/12/2026.
