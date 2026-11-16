# SPEC-1-001 — provas da entrega

**Sistema:** CRM da JLA (Skip "Projeto Native", id 78281)
**Versão publicada:** `0a0d0f5` em 16/11/2026
**Endereço:** https://projeto-native-60baf.goskip.app
**Teste do cliente:** não se aplica (D-07) — a SPEC fecha pela prova automática.

## Critérios de aceite

| Critério | Prova | Resultado |
|---|---|---|
| CA-1-01 — sem login, nada de dados | `evidencias/SPEC-1-001/green-acesso.txt` (anônimo em `acessos` e `teste_acesso`) | 403 "Acesso não liberado." nos dois casos |
| CA-1-02 — conta fora de `acessos` é recusada | `evidencias/SPEC-1-001/green-acesso.txt` (login válido da conta de teste) | 403 "Acesso não liberado.", zero dados |
| CA-1-03 — administrador entra e vê o menu | `evidencias/SPEC-1-001/green-admin.txt` (login + leitura de `acessos`) | login aceito, 1 registro admin devolvido |
| CA-1-04 — cofre lido pelo servidor, valor nunca exposto | `evidencias/SPEC-1-001/green-cofre.txt` | `{"configurado":true,"tamanho":31}`, valor ausente do código e dos logs |

## TDD

| # | Etapa | Prova | Resultado |
|---|---|---|---|
| 1 | RED | `red.txt` — leitura anônima de `teste_acesso` antes da RN-03 | devolveu o registro fictício (vazava) |
| 2 | GREEN | `green-acesso.txt` — anônimo e conta de teste | 403 nos dois (CA-1-01, CA-1-02) |
| 3 | GREEN | `green-admin.txt` — login do admin | token obtido, menu com Clientes, Contas e Funil |
| 4 | GREEN | `green-cofre.txt` — rota do servidor | leu o segredo, devolveu só o tamanho |
| 5 | REGRESSÃO | `regressao.txt` | coleção de teste 404, conta de teste 400 no login, rota do cofre 404, admin 200, produção 200 |

## O que foi construído

- Coleção `acessos` (e-mail, papel, ativo, criado_em) com leitura só do próprio registro ativo;
  escrita apenas por superusuário, pelo painel do Skip.
- Cadastro público de `users` fechado (`create` = superusuário).
- Guarda no servidor em toda coleção: lista e registro exigem login + registro ativo em `acessos`.
- Login, cabeçalho com o nome do sistema, menu Clientes / Contas / Funil e tela inicial.
- As três áreas abrem uma página "Em construção" apontando a SPEC que as entrega.
- Conta de administrador criada a partir de segredos do Skip (nenhuma senha no código).

## Limpeza obrigatória (TDD 5)

- Coleção `teste_acesso` removida (migração 0007).
- Conta de teste removida (migração 0008).
- Rota e segredo `TESTE_COFRE` removidos; `green-cofre.txt` guarda a prova da leitura antes da remoção.

## Pendências registradas

- **CL-002 (e-mail do José no Skip):** o administrador hoje é `admin.jla@jla-teste.com.br`, conta
  provisória criada conforme a SPEC ("use a conta de teste como admin"). Quando o e-mail do José
  chegar, a conta dele é criada e a provisória removida.
- **Espelho de código** em `07-sistemas/crm/codigo/`: pendente; a fonte executável é o Skip.
- **Envio ao GitHub:** pendente por falta de credencial de escrita; registros commitados localmente.
