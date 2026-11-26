// Migração 0021 — a Prioridade passa a respeitar a nota de corte do José em 70 (26/11/2026).
//
// Regra 9 do perfil, escrita pelo próprio José: "Score total igual ou superior a 70 (...)
// abaixo de 70 não entra na fila ativa". O motor, porém, mandava para `prioridade` qualquer
// conta com pelo menos 1 ponto — inclusive conta de nota 30 e faixa C.
//
// Aqui entra o valor novo `em_avaliacao`: a conta continua guardada com nota e motivo,
// só não aparece na fila ativa. A etapa do funil (SPEC-1-005) NÃO é tocada — ela é do José.
migrate(
  (app) => {
    const contas = app.findCollectionByNameOrId('contas')
    const campo = contas.fields.getByName('situacao_triagem')
    if (campo) {
      campo.values = ['prioridade', 'em_avaliacao', 'fora_do_perfil', 'pendente_dados']
      app.save(contas)
    }

    const registros = app.findRecordsByFilter('contas', 'situacao_triagem = "prioridade"', '', 5000, 0)
    let movidas = 0
    for (let i = 0; i < registros.length; i++) {
      const r = registros[i]
      if (r.getInt('nota') >= 70) continue
      const motivos = (() => {
        try {
          const v = JSON.parse(r.getString('motivos') || '[]')
          return v == null ? [] : v
        } catch (_) {
          return []
        }
      })()
      let jaTem = false
      for (let m = 0; m < motivos.length; m++) {
        if (String(motivos[m].regra || '').indexOf('Nota abaixo de 70') === 0) jaTem = true
      }
      if (!jaTem) motivos.push({ regra: 'Nota abaixo de 70: não entra na fila ativa', pontos: 0 })
      r.set('situacao_triagem', 'em_avaliacao')
      r.set('motivos', JSON.stringify(motivos))
      app.save(r)
      movidas++
    }
    app.logger().info('migração 0021: contas movidas para em_avaliacao', 'total', movidas)
  },
  (app) => {
    try {
      const contas = app.findCollectionByNameOrId('contas')
      const campo = contas.fields.getByName('situacao_triagem')
      if (campo) {
        campo.values = ['prioridade', 'fora_do_perfil', 'pendente_dados']
        app.save(contas)
      }
      const registros = app.findRecordsByFilter('contas', 'situacao_triagem = "em_avaliacao"', '', 5000, 0)
      for (let i = 0; i < registros.length; i++) {
        registros[i].set('situacao_triagem', 'prioridade')
        app.save(registros[i])
      }
    } catch (_) {}
  },
)
