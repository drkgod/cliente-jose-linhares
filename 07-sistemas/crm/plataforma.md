# CRM (Projeto Native) — plataforma de construção

- plataforma: Skip
- projeto_id: 78281
- nome_no_skip: Projeto Native
- url_producao: https://projeto-native-60baf.goskip.app
- url_preview: https://projeto-native-60baf--preview.goskip.app
- skip_cloud: projeto-native-60baf (banco, login e automações de servidor provisionados)
- versao_aplicada: 0a0d0f5 (0.0.7)
- versao_publicada: 0a0d0f5 em 2026-11-16T13:29:21.938Z
- ultima_task: SPEC-1-001 (CA-1-01 a CA-1-04)
- registrado_em: 2026-11-16
- observacao_de_nome: `STATUS.md` e `04_fase-atual/fase.md` citam o projeto "JLA — CRM de prospecção" no Skip. Em 16/11/2026 o José decidiu construir o sistema no projeto "Projeto Native" (id 78281); este arquivo é a fonte da verdade sobre onde o sistema roda.
- segredos_usados: `CRM_ADMIN_EMAIL`, `CRM_ADMIN_SENHA` (criação do administrador). A senha vive só no cofre do Skip, nos dois ambientes (preview e produção).
- espelho: `codigo/` guarda a última versão de cada arquivo alterado pelas tasks. É cópia de
  consulta; a fonte executável é o Skip. Nunca edite o espelho para mudar o sistema. (Espelho da
  primeira entrega pendente.)

## Histórico de entregas

| Data | Task | Versão publicada | Arquivos alterados |
|---|---|---|---|
| 16/11/2026 | configuração (sem task) | não publicada | nenhum — projeto criado em branco |
| 16/11/2026 | SPEC-1-001 — acesso restrito | 0a0d0f5 | migrations 0001–0008, hooks `acesso_guard_lista.js` e `acesso_guard_registro.js`, `src/App.tsx`, `src/components/Layout.tsx`, `src/components/ProtecaoAcesso.tsx`, `src/pages/Index.tsx`, `src/pages/Login.tsx`, `src/pages/Areas.tsx`, `src/pages/EmConstrucao.tsx`, `src/services/acessos.ts`, `src/lib/mensagens-erro.ts`, `index.html` |
