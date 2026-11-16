# Estado atual — Adapta Cliente

- schema_version: adapta-cliente-state/v3
- task_id: cliente-perfil
- executor: agente do cliente (ETHOS)
- owner_informativo: José Linhares
- spec: 04_fase-atual/specs/spec-1-002-cliente-atendido-perfil-ideal.md
- analise: .adapta-cliente/analises/task-cliente-perfil.md
- etapa: concluida
- autorizacao_implementacao: confirmada pelo pedido "Sim, pode continuar" em 16/11/2026 18:23
- aguardando_teste: nenhuma
- em_espera: nenhuma
- teste_humano: nao_aplicavel:SPEC-1-002 fecha pela prova automática (D-07) — red.txt, green-carteiras.txt, green-sugestao.txt, green-aprovacao.txt e regressao.txt em 05_entregas/fase-1/evidencias/SPEC-1-002/
- verificacao_automatica: passou — QA do Skip verde, versão 0.0.12 (fb4b1c6) publicada
- aprendizado: pendente
- sistema: crm
- skip_projeto: 78281
- skip_versao: fb4b1c6
- skip_publicacao: publicada:fb4b1c6 em 2026-11-16T21:40:30.978Z
- pendente_github: nao
- ultima_acao: SPEC-1-002 entregue, publicada e provada — CA-1-05 a CA-1-09
- proxima_acao: abrir a SPEC-1-003 (busca automática de contas) na próxima entrada
- atualizado_em: 2026-11-16T18:45:00-03:00

## Descoberta que muda um insumo

- **CL-005 (chave da IA) deixa de ser necessária.** O Skip Cloud já provisiona a IA em `$ai.chat`
  (guia `skip_cloud_ai_guide`: "Never ask the user for an API key"); o consumo entra nos créditos do
  Skip. A função `sugerir_perfil` usa `$ai.chat` direto, com o simulador previsto na SPEC só como
  plano B. O José não precisa colar nenhuma chave.

## Pendências para o cliente

- **CL-002 — e-mail do José no Skip.** Administrador ainda é a conta provisória. Quando o e-mail
  real chegar, a conta dele é criada e a provisória removida.
- **CL-003 — dados do cliente teste.** O cadastro foi provado com dados fictícios (removidos no
  fim). Quando o José informar site, produtos, dores e playbook, o cliente teste é cadastrado e o
  primeiro perfil real é gerado.
- **CL-004 e CL-010** seguem abertos para a SPEC-1-003.

## Conta de prova

- `CRM_PROVA_EMAIL` / `CRM_PROVA_SENHA` no cofre criam a conta de prova da SPEC-1-002 (migração
  0011). Mantida para as próximas provas; remover quando a fase fechar.
