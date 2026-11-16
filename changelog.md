# Changelog

| Data | O que mudou |
|---|---|
| 16/11/2026 | Repositório criado com o escopo final e a fase 1 (SPECs 1-001 a 1-004, de 16/11 a 02/12). Teste do cliente só no fim da SPEC-1-004 (D-07). |
| 16/11/2026 | Fase 1 refeita como motor automático: busca de contas pelas APIs (SPEC-1-003), pesquisa automática com briefing (SPEC-1-004 nova) e funil (agora SPEC-1-005). São 25 critérios, e a validação passa para 03/12. |
| 16/11/2026 | Configuração do projeto no plugin Adapta Cliente: sistema CRM registrado em `07-sistemas/crm/plataforma.md` (Skip id 78281, "Projeto Native"), estado migrado para o formato novo. Registros locais; envio ao GitHub pendente por falta de credencial de escrita. |
| 16/11/2026 | SPEC-1-001 entregue e publicada no Skip (`0a0d0f5`): CRM com login obrigatório, coleção `acessos`, guarda no servidor em todas as coleções e cofre testado. CA-1-01 a CA-1-04 provados em `05_entregas/fase-1/`. Teste do cliente não se aplica (D-07). Pendente: CL-002 (e-mail do José) e envio ao GitHub. |
| 16/11/2026 | SPEC-1-002 entregue: carteiras `clientes_atendidos` e `perfis_ideais`, telas de Clientes e da ficha, sugestão de perfil pela IA do Skip (com simulador no plano B) e aprovação versionada. Versão publicada `fb4b1c6` em https://projeto-native-60baf.goskip.app |
| 16/11/2026 | SPEC-1-003 entregue: `contas` e `buscas`, busca por Apollo/Anvisa com idempotência por carteira, complemento de CNPJ pela BrasilAPI, nota automática (regra → pontos) e as abas Prioridade/Fora do perfil/Pendentes. Versão publicada `e17e436`. |
