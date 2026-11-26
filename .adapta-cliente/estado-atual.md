# Estado atual — Adapta Cliente

- schema_version: adapta-cliente-state/v3
- task_id: funil-visual
- executor: agente do cliente (ETHOS)
- owner_informativo: José Linhares
- spec: 04_fase-atual/specs/spec-1-005-funil-visual.md
- analise: .adapta-cliente/analises/task-funil.md
- etapa: aguardando_teste_humano
- autorizacao_implementacao: confirmada pelo pedido "pode seguir para a SPEC-1-005" em 16/11/2026 20:33
- aguardando_teste: funil-visual — sessão da fase 1 (roteiro + questionário de produto)
- em_espera: nenhuma
- teste_humano: pendente:sessão da SPEC-1-005 com o José (até 15 min)
- verificacao_automatica: passou — QA do Skip verde, versão 0.0.22 (a11ddeb) publicada após corrigir a busca com o perfil da Magically
- aprendizado: pendente
- sistema: crm
- skip_projeto: 78281
- skip_versao: 9629e8d
- skip_publicacao: publicada:9629e8d em 2026-11-26T10:25:55.135Z
- pendente_github: nao
- ultima_acao: criterio "tem area comercial propria" entregue — Apsen 80/A, Brainfarma 60/B; corrigida a nota de maturidade que se perdia
- proxima_acao: pesquisar as contas restantes (Blau, Prati, Recol...) para cada uma ganhar o veredito de area comercial
- atualizado_em: 2026-11-26T07:25:00-03:00

## Construção da fase 1 — concluída

| SPEC | Versão | Critérios |
|---|---|---|
| SPEC-1-001 | 0a0d0f5 | CA-1-01 a CA-1-04 |
| SPEC-1-002 | fb4b1c6 | CA-1-05 a CA-1-09 |
| SPEC-1-003 | e17e436 | CA-1-10 a CA-1-15 |
| SPEC-1-004 | ed42afa | CA-1-16 a CA-1-20 |
| SPEC-1-005 | 17760be | CA-1-21 a CA-1-25 |

## Decisão de modelagem registrada

`contas.etapa` agora é a etapa do **funil** (nova, priorizada, em_pesquisa, pronta_cadencia,
descartada) e é independente de `situacao_triagem` (prioridade, fora_do_perfil, pendente_dados).
A triagem não reescreve mais a etapa: só a movimentação do José muda a coluna. Migração 0018
mapeou as contas que já existiam.

## Pendências para o cliente

- ~~**CL-003 — dados do cliente teste**~~: atendido em 25/11/2026 — Magically Brasil Ltda cadastrada, perfil aprovado e busca real rodando (prova em `05_entregas/fase-1/evidencias/DEBUG-apollo-real/prova-cl003-busca-real.txt`).
- **CL-004 — agora bloqueante**: a Apollo não devolve CNPJ e a Anvisa está fora do ar (404), então as 25 contas da busca ficam em `pendente_dados` sem nota. José vai passar os CNPJs aos poucos.
- **CL-010 — atendido** em 19/11/2026: `APOLLO_API_KEY` no cofre de preview e produção; a busca de
  empresas e a de decisores passaram a usar a Apollo real (prova em
  `05_entregas/fase-1/evidencias/DEBUG-apollo-real/`).
- **Sessão de teste da fase 1**: roteiro da SPEC-1-005 + questionário de produto.
