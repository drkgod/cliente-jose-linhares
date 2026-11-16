# Índice de SPECs — Fase 1 · Base do CRM: clientes, perfil ideal, contas com nota e funil

**Atualizado em:** 16/11/2026 · **Janela da fase:** 16/11 a 02/12/2026 (feriado em 20/11)

**Resultado da fase:** o José entra no CRM da JLA no Skip, cadastra o cliente teste, aprova o perfil ideal sugerido pela IA, importa as contas e as vê no funil, ordenadas por nota, com o motivo de cada ponto. Nenhuma mensagem é enviada nesta fase.

| SPEC | Entrega | Degrau | Critérios | Depende de | Sessão com o José |
|---|---|---|---|---|---|
| [SPEC-1-001](spec-1-001-crm-skip-acesso-restrito.md) | CRM no Skip com acesso protegido | nativo da plataforma | CA-1-01 a CA-1-04 | CL-001 (aval do escopo) | não (prova com conta de teste) |
| [SPEC-1-002](spec-1-002-cliente-atendido-perfil-ideal.md) | Cliente atendido e perfil ideal sugerido por IA | construção mínima sobre o nativo | CA-1-05 a CA-1-09 | SPEC-1-001; CL-003 e CL-005 | não (prova automática) |
| [SPEC-1-003](spec-1-003-contas-triagem-nota.md) | Contas por planilha e dados abertos, triagem e nota | dependência existente | CA-1-10 a CA-1-15 | SPEC-1-002; CL-004 | não (prova automática) |
| [SPEC-1-004](spec-1-004-funil-visual.md) | Funil visual com histórico | nativo da plataforma | CA-1-16 a CA-1-20 | SPEC-1-003 | **sim, a única da fase, com o questionário de produto** |

## Ordem de execução

SPEC-1-001 → SPEC-1-002 → SPEC-1-003 → SPEC-1-004.

Insumo que falta não para a construção:
- **sem a chave da IA:** use o simulador da IA;
- **sem a lista do José:** use a lista aberta da Anvisa (D-09);
- **sem o e-mail do José:** use a conta de teste como admin.

## Fora desta fase

- **Fase 2:** maturidade digital, pesquisa da conta e briefing, decisores e e-mails validados, sinais de mercado.
- **Fase 3:** cadências e envios nos três canais, que só começam com a autorização escrita do cliente teste (D-04).
- **Fase 4:** respostas, qualificação, agendamento e resumo ao closer.
- **Fase 5:** relatório, mapa da jornada e busca inteligente.

## Gate da fase

A fase fecha quando:
- os 20 critérios têm prova em `05_entregas/fase-1/`;
- a sessão do fim da SPEC-1-004 foi feita;
- o consultor deu o aceite na call de validação de 02/12/2026.
