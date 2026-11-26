// Migração 0020 — critério "tem área comercial própria" (aprovado pelo José em 26/11/2026).
//
// Por que existe: a Brainfarma pontua 70 e é faixa A pelo critério de segmento, mas é a
// fábrica do grupo Hypera — produz e vende para a controladora, sem força de vendas própria.
// Varredura de 300 pessoas no domínio achou só 2 analistas de planejamento como título
// comercial. Nota alta sem comprador é o pior tipo de lead: custa pesquisa e não fecha.
//
// Como funciona: a pesquisa da conta varre os cargos no Apollo e grava `area_comercial`
// (sim/nao) com a evidência. A triagem lê esse campo pela regra verificável `area_comercial`.
// Enquanto a conta não foi pesquisada, o critério não pontua nem penaliza — dado ausente
// não é dado negativo.
migrate(
  (app) => {
    const contas = app.findCollectionByNameOrId('contas')
    let mudou = false

    if (!contas.fields.getByName('area_comercial')) {
      contas.fields.add(
        new SelectField({
          name: 'area_comercial',
          values: ['sim', 'nao'],
          maxSelect: 1,
        }),
      )
      mudou = true
    }
    if (!contas.fields.getByName('area_comercial_evidencia')) {
      contas.fields.add(
        new TextField({
          name: 'area_comercial_evidencia',
          max: 500,
        }),
      )
      mudou = true
    }
    if (mudou) app.save(contas)

    // Acrescenta o critério ao perfil aprovado, redistribuindo os pesos para caber em 100:
    // segmento 30 + receita 25 + área comercial 25 + manual 20.
    const perfis = app.findRecordsByFilter('perfis_ideais', 'status = "aprovado"', '-versao', 1, 0)
    if (!perfis || perfis.length === 0) return
    const perfil = perfis[0]

    let prioridade = []
    try {
      prioridade = JSON.parse(perfil.getString('prioridade') || '[]') || []
    } catch (_) {
      prioridade = []
    }

    // Reajusta os pontos das regras já existentes para o novo total de 100.
    for (let i = 0; i < prioridade.length; i++) {
      const item = prioridade[i] || {}
      if (!item.regra) continue
      if (item.regra.campo === 'cnae') item.regra.pontos = 30
      if (item.regra.campo === 'capital_social') item.regra.pontos = 25
      prioridade[i] = item
    }

    const jaTem = (() => {
      for (let i = 0; i < prioridade.length; i++) {
        const r = (prioridade[i] || {}).regra
        if (r && r.campo === 'area_comercial') return true
      }
      return false
    })()

    if (!jaTem) {
      prioridade.push({
        valor: 'Tem área comercial própria (vende com força de campo, não só produz)',
        fonte: 'jose',
        regra: { campo: 'area_comercial', pontos: 25 },
      })
    }

    perfil.set('prioridade', JSON.stringify(prioridade))
    app.save(perfil)
  },
  (app) => {
    try {
      const perfis = app.findRecordsByFilter(
        'perfis_ideais',
        'status = "aprovado"',
        '-versao',
        1,
        0,
      )
      if (perfis && perfis.length > 0) {
        const perfil = perfis[0]
        let prioridade = JSON.parse(perfil.getString('prioridade') || '[]') || []
        const nova = []
        for (let i = 0; i < prioridade.length; i++) {
          const r = (prioridade[i] || {}).regra
          if (r && r.campo === 'area_comercial') continue
          if (r && r.campo === 'cnae') r.pontos = 40
          if (r && r.campo === 'capital_social') r.pontos = 30
          nova.push(prioridade[i])
        }
        perfil.set('prioridade', JSON.stringify(nova))
        app.save(perfil)
      }
    } catch (_) {}

    try {
      const contas = app.findCollectionByNameOrId('contas')
      contas.fields.removeByName('area_comercial')
      contas.fields.removeByName('area_comercial_evidencia')
      app.save(contas)
    } catch (_) {}
  },
)
