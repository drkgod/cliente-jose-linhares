# Estado atual — Adapta Cliente

- schema_version: adapta-cliente-state/v3
- task_id: pesquisa-briefing
- executor: agente do cliente (ETHOS)
- owner_informativo: José Linhares
- spec: 04_fase-atual/specs/spec-1-004-pesquisa-automatica-briefing.md
- analise: .adapta-cliente/analises/task-pesquisa-briefing.md
- etapa: concluida
- autorizacao_implementacao: confirmada pelo pedido "continue para a SPEC-1-004" em 16/11/2026 20:21
- aguardando_teste: nenhuma
- em_espera: nenhuma
- teste_humano: nao_aplicavel:SPEC-1-004 fecha pela prova automática (D-07) — red.txt, green-pesquisa.txt, green-briefing.txt, green-falhas.txt e regressao.txt em 05_entregas/fase-1/evidencias/SPEC-1-004/
- verificacao_automatica: passou — QA do Skip verde, versão 0.0.18 (ed42afa) publicada
- aprendizado: pendente
- sistema: crm
- skip_projeto: 78281
- skip_versao: ed42afa
- skip_publicacao: publicada:ed42afa em 2026-11-16T23:28:36.533Z
- pendente_github: nao
- ultima_acao: SPEC-1-004 entregue, publicada e provada — CA-1-16 a CA-1-20
- proxima_acao: abrir a SPEC-1-005 (funil visual) e preparar a sessão de teste com o José
- atualizado_em: 2026-11-16T20:30:00-03:00

## Descobertas técnicas (valem para as próximas SPECs)

- **`TextDecoder` não funciona no JSVM do PocketBase:** recusa o corpo do `$http.send`
  ("expected ArrayBuffer, TypedArray, or DataView"). A leitura de site/CSV passou a converter os
  bytes com `String.fromCharCode`. O mesmo problema derrubou a fonte Anvisa na SPEC-1-003.
- **Sem função de topo em callback:** já registrado; os gatilhos chamam rotas internas com
  `PB_INSTANCE_URL` + `PB_SUPERUSER_TOKEN`, que funciona.
- **A IA do Skip funciona** (`$ai.chat`, modelo `fast`) e devolve os três itens do briefing com fonte.

## Pendências para o cliente

- **CL-003 — dados do cliente teste:** José informa amanhã. Com eles o cadastro real é criado e a
  busca + pesquisa + briefing passam a rodar sobre uma conta de verdade.
- **CL-004 — lista de contas** (opcional) e **CL-010 — chave da Apollo** (sem ela, decisores e
  empresas vêm do simulador).
