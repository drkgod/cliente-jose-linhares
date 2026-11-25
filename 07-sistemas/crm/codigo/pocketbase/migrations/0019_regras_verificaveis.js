// Migração 0019 — critérios de prioridade em forma verificável (opção A, aprovada pelo José).
//
// Problema que isto resolve: a triagem comparava PALAVRA POR PALAVRA a frase inteira do critério
// com o texto da conta. Critério escrito como frase ("Acesso ao decisor de vendas (VP ou Diretor
// Comercial)") exige `acesso` e `decisor`, que não existem em cadastro de empresa: nenhum critério
// casava, toda conta ficava com nota 0 e caía em "fora do perfil" — inclusive a Apsen.
//
// Agora cada critério guarda o texto do José (campo `valor`, a fonte dele, inalterada) e, quando o
// dado público permite provar, um `regra` que o motor avalia. O que o cadastro da Receita não
// prova fica com `manual: true`: não pontua e não exclui sozinho, fica para o José decidir.
//
// Só a nota das contas pode ser refeita por aqui: a etapa do funil continua sendo do José (SPEC-1-005).
migrate(
  (app) => {
    const perfis = app.findRecordsByFilter('perfis_ideais', 'status = "aprovado"', '-versao', 1, 0)
    if (!perfis || perfis.length === 0) return
    const perfil = perfis[0]

    // Pesos somam 100: segmento 40 + porte econômico 30 + três critérios manuais de 10.
    const prioridade = [
      {
        valor: 'Segmento farmacêutico, biotech ou distribuidora',
        fonte: 'jose',
        regra: {
          campo: 'cnae',
          prefixos: ['2121', '2122', '2110', '2063', '4644', '7210'],
          pontos: 40,
        },
      },
      {
        valor: 'Receita anual acima de R$ 50 milhões',
        fonte: 'jose',
        regra: { campo: 'capital_social', min: 5000000, pontos: 30 },
      },
      {
        valor: 'Equipe de vendas externa com 5 ou mais representantes',
        fonte: 'jose',
        manual: true,
        regra: null,
      },
      {
        valor: 'Sinal concreto de investimento em tecnologia (CRM Manager ou Sales Operations)',
        fonte: 'jose',
        manual: true,
        regra: null,
      },
      {
        valor: 'Acesso ao decisor certo (VP ou Diretor de Vendas)',
        fonte: 'jose',
        manual: true,
        regra: null,
      },
    ]

    // As três exclusões dependem de dado que a Receita não publica (tamanho da equipe, modelo de
    // vendas). Ficam marcadas como manuais para não travar conta nenhuma por engano.
    const exclusoes = [
      {
        valor: 'Operação com menos de 5 representantes externos',
        fonte: 'jose',
        manual: true,
        regra: null,
      },
      {
        valor: 'Modelo pure inside sales sem força de campo',
        fonte: 'jose',
        manual: true,
        regra: null,
      },
      {
        valor: 'Ausência de investimento demonstrado em tecnologia de vendas',
        fonte: 'jose',
        manual: true,
        regra: null,
      },
    ]

    // CNAEs que a busca usa na base da Receita (apipj) para as contas já nascerem com CNPJ.
    const fontes = {
      tipo_empresa: 'cadastro',
      porte: 'cadastro',
      cnaes_busca: ['2121101', '2122000', '4644301'],
    }

    perfil.set('prioridade', JSON.stringify(prioridade))
    perfil.set('exclusoes', JSON.stringify(exclusoes))
    perfil.set('fontes', JSON.stringify(fontes))
    perfil.set(
      'observacao',
      'Critérios reescritos em regra verificável (opção A aprovada em 25/11/2026): segmento 40 pontos por CNAE, porte econômico 30 pontos por capital social. Os três critérios que a Receita não prova ficaram marcados como manuais e não pontuam sozinhos.',
    )
    app.save(perfil)
  },
  (app) => {
    // Reverte para os critérios originais em texto livre.
    try {
      const perfis = app.findRecordsByFilter(
        'perfis_ideais',
        'status = "aprovado"',
        '-versao',
        1,
        0,
      )
      if (!perfis || perfis.length === 0) return
      const perfil = perfis[0]
      perfil.set(
        'prioridade',
        JSON.stringify([
          { fonte: 'jose', valor: 'Equipe de vendas externa com 15 ou mais representantes' },
          { valor: 'Receita anual acima de R$ 100 milhões', fonte: 'jose' },
          { valor: 'Segmento farmacêutico ou biotech', fonte: 'jose' },
          {
            valor: 'Sinal de investimento em tecnologia (ex.: contratação de CRM Manager)',
            fonte: 'jose',
          },
          { valor: 'Acesso ao decisor de vendas (VP ou Diretor Comercial)', fonte: 'jose' },
        ]),
      )
      perfil.set(
        'exclusoes',
        JSON.stringify([
          { valor: 'Operação com menos de 5 representantes externos', fonte: 'jose' },
          { valor: 'Modelo pure inside sales sem força de campo', fonte: 'jose' },
          {
            valor: 'Ausência de investimento demonstrado em tecnologia de vendas',
            fonte: 'jose',
          },
        ]),
      )
      app.save(perfil)
    } catch (_) {}
  },
)
