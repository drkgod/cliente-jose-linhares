# Estado atual — Adapta Cliente

- schema_version: adapta-cliente-state/v3
- task_id: busca-contas
- executor: agente do cliente (ETHOS)
- owner_informativo: José Linhares
- spec: 04_fase-atual/specs/spec-1-003-busca-automatica-contas.md
- analise: .adapta-cliente/analises/task-busca-contas.md
- etapa: concluida
- autorizacao_implementacao: confirmada pelo pedido "pode seguir para o SPEC-1-003" em 16/11/2026 20:03
- aguardando_teste: nenhuma
- em_espera: nenhuma
- teste_humano: nao_aplicavel:SPEC-1-003 fecha pela prova automática (D-07) — red.txt, green-busca.txt, green-cnpj.txt, green-nota.txt e regressao.txt em 05_entregas/fase-1/evidencias/SPEC-1-003/
- verificacao_automatica: passou — QA do Skip verde, versão 0.0.16 (e17e436) publicada
- aprendizado: pendente
- sistema: crm
- skip_projeto: 78281
- skip_versao: e17e436
- skip_publicacao: publicada:e17e436 em 2026-11-16T23:10:07.361Z
- pendente_github: nao
- ultima_acao: SPEC-1-003 entregue, publicada e provada — CA-1-10 a CA-1-15
- proxima_acao: abrir a SPEC-1-004 (pesquisa automática e briefing) na próxima entrada
- atualizado_em: 2026-11-16T20:12:00-03:00

## Decisões de implementação que valem registrar

- **Gatilho da busca:** o hook de atualização de perfil não disparava nada; a busca passou a ser
  chamada **de dentro da rota de aprovação**, que devolve `busca_disparada`. Fica mais confiável e
  é o que a prova do CA-1-10 mostra.
- **Lógica da busca em um único lugar:** as rotas de gatilho e o cron chamam
  `/backend/v1/contas/buscar` pelo backend interno (`PB_INSTANCE_URL` + `PB_SUPERUSER_TOKEN`), em
  vez de duplicar código — o JSVM não permite função de topo em callback.
- **Idempotência:** índice único (`cliente`, `chave`), com `chave` = CNPJ, senão domínio, senão nome.
- **Anvisa:** o endereço público do CSV respondeu 404 nas provas; fica registrado como falha da
  fonte e a busca segue com as outras (CA-1-15). Quando o endereço correto for confirmado, basta
  trocar a URL em `contas_api.js`.

## Pendências para o cliente

- **CL-003 — dados do cliente teste** (José informa amanhã).
- **CL-004 — lista de contas** (opcional; a busca roda sem ela).
- **CL-010 — chave da Apollo** (sem ela a busca usa o simulador de 3 empresas no mesmo formato).
