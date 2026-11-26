# CRM (Projeto Native) — plataforma de construção

- plataforma: Skip
- projeto_id: 78281
- nome_no_skip: Projeto Native
- url_producao: https://projeto-native-60baf.goskip.app
- url_preview: https://projeto-native-60baf--preview.goskip.app
- skip_cloud: projeto-native-60baf (banco, login e automações de servidor provisionados)
- versao_aplicada: eed24e5 (0.0.37)
- versao_publicada: eed24e5 em 2026-11-26T14:43:59.278Z
- ultima_task: CL-003 (cliente teste Magically Brasil) + corrigir a tradução do perfil para a busca
- registrado_em: 2026-11-16
- observacao_de_nome: `STATUS.md` e `04_fase-atual/fase.md` citam o projeto "JLA — CRM de prospecção" no Skip. Em 16/11/2026 o José decidiu construir o sistema no projeto "Projeto Native" (id 78281); este arquivo é a fonte da verdade sobre onde o sistema roda.
- segredos_usados: `CRM_ADMIN_EMAIL`, `CRM_ADMIN_SENHA` (criação do administrador) e `APOLLO_API_KEY` (busca de empresas e de decisores), nos dois ambientes (preview e produção).
- apollo_endpoints: `POST /v1/organizations/search` (busca de empresas) e `POST /v1/mixed_people/api_search` (decisores). A chave do José não libera `people/match`, `people/bulk_match` nem `mixed_companies/search` — o sistema não usa nenhum desses nesta fase.
- espelho: `codigo/` guarda a última versão de cada arquivo alterado pelas tasks. É cópia de
  consulta; a fonte executável é o Skip. Nunca edite o espelho para mudar o sistema. (Espelho da
  primeira entrega pendente.)

## Histórico de entregas

| Data | Task | Versão publicada | Arquivos alterados |
|---|---|---|---|
| 16/11/2026 | configuração (sem task) | não publicada | nenhum — projeto criado em branco |
| 16/11/2026 | SPEC-1-001 — acesso restrito | 0a0d0f5 | migrations 0001–0008, hooks `acesso_guard_lista.js` e `acesso_guard_registro.js`, `src/App.tsx`, `src/components/Layout.tsx`, `src/components/ProtecaoAcesso.tsx`, `src/pages/Index.tsx`, `src/pages/Login.tsx`, `src/pages/Areas.tsx`, `src/pages/EmConstrucao.tsx`, `src/services/acessos.ts`, `src/lib/mensagens-erro.ts`, `index.html` |
| 19/11/2026 | debug da Apollo (chave real) | b97697c | `pocketbase/hooks/contas_api.js`, `pocketbase/hooks/pesquisa_conta.js` |
| 25/11/2026 | CL-003 + busca real (sem task) | a11ddeb | `pocketbase/hooks/contas_api.js` |
| 25/11/2026 | debug CNPJ + triagem | cfd739d | `pocketbase/hooks/triagem_contas.js` |
| 25/11/2026 | regras verificáveis + fonte Receita (apipj) | a63e651 | `triagem_contas.js`, `contas_api.js`, migração `0019_regras_verificaveis.js` |
| 25/11/2026 | roteiro do funil (pesquisa/decisores/briefing) | 610516e | `pesquisa_conta.js` |
| 26/11/2026 | critério área comercial própria | 9629e8d | `triagem_contas.js`, `pesquisa_conta.js`, migração `0020_area_comercial.js` |
| 26/11/2026 | nota de corte 70 + aba Em avaliação | cdec787 | `triagem_contas.js`, `contas_api.js`, `Contas.tsx`, `contas.ts`, migração `0021_nota_de_corte.js` |
| 26/11/2026 | fonte CNPJá + domínio/e-mail em massa | eed24e5 | `contas_api.js`, `pesquisa_conta.js` |
