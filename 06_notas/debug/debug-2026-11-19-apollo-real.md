## Debug Summary
**Task e problema:** task `chave-apollo` + tasks de decisores (SPEC-1-003 CA-1-10..15 e SPEC-1-004 CA-1-18). Com a chave real da Apollo no cofre, a busca de empresas e a de decisores não traziam nada.
**Reprodução:** chamada real com `APOLLO_API_KEY` contra `mixed_people/search` e `organizations/search` com os parâmetros do hook.
**Causa raiz:** três defeitos no código, escondidos pelo simulador.
1. `pesquisa_conta.js` chamava `https://api.apollo.io/v1/mixed_people/search` — endpoint antigo que a Apollo não libera mais (403 `API_INACCESSIBLE`). O endpoint válido é `mixed_people/api_search`.
2. O mesmo hook lia `p.name` e `p.seniority`; a busca devolve `first_name` + `last_name_obfuscated` e não devolve `seniority`. Resultado: zero decisores mesmo com HTTP 200.
3. `contas_api.js` mandava `q_organization_keyword_tags: [<frase inteira do perfil>]` e `organization_num_employees_ranges: [<texto do porte>]`. A Apollo só casa etiqueta curta de segmento e faixa numérica; a frase inteira devolvia 0-1 resultado e o texto do porte era ignorado.
**Correção:**
- endpoint trocado para `mixed_people/api_search`; domínio limpo (sem protocolo/www/caminho); filtro por `person_seniorities` (owner, founder, c_suite, partner, vp, head, director); até 25 pessoas lidas e ordenadas por peso do cargo antes de gravar 5.
- nome montado de `first_name` + `last_name_obfuscated`; senioridade derivada do cargo.
- etiquetas derivadas do perfil: quebra por vírgula/barra/"e"/"ou", remove palavras genéricas, mantém até 3 palavras por etiqueta; porte traduzido para faixas numéricas da Apollo; `organization_locations: ["Brazil"]`; `per_page: 25`.
**Verificação automática:** `skip_project_apply_changes` verde (setup, estático, build, integrações); publicado `b97697c` (0.0.21). Prova real em `05_entregas/fase-1/evidencias/DEBUG-apollo-real/prova-apollo.txt`: empresas 1354 e 2686 encontradas para dois perfis; decisores de natura.com.br com CEO e diretores na ordem certa.
**Situação:** de volta ao ciclo — falta a busca real rodar na tela com o perfil do cliente teste (depende de CL-003).
