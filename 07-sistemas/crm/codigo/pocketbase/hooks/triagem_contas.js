// Triagem e nota (RN-09 a RN-12). Roda a cada conta criada ou atualizada.
// Regra de ouro: a nota é a SOMA dos motivos, e cada motivo é "regra → pontos".
onRecordAfterCreateSuccess((e) => {
  const conta = e.record
  const clienteId = conta.getString('cliente')
  const cnpj = String(conta.getString('cnpj') || '').replace(/[^0-9]/g, '')

  // Completa os dados abertos do CNPJ (CA-1-12). Falha não descarta a conta (RN-09).
  let completou = false
  if (cnpj.length === 14 && !conta.getString('consultado_em')) {
    try {
      const res = $http.send({
        url: 'https://brasilapi.com.br/api/cnpj/v1/' + cnpj,
        method: 'GET',
        timeout: 15,
      })
      if (res.statusCode === 200 && res.json) {
        const d = res.json
        const atual = $app.findRecordById('contas', conta.id)
        atual.set('porte', String(d.descricao_porte || d.porte || ''))
        atual.set(
          'cnae',
          String(
            (d.cnae_fiscal_descricao || '') + (d.cnae_fiscal ? ' (' + d.cnae_fiscal + ')' : ''),
          ),
        )
        atual.set('situacao', String(d.descricao_situacao_cadastral || ''))
        atual.set('municipio', String(d.municipio || ''))
        atual.set(
          'uf',
          String(d.uf || '')
            .toUpperCase()
            .slice(0, 2),
        )
        atual.set('abertura', String(d.data_inicio_atividade || ''))
        atual.set(
          'capital_social',
          typeof d.capital_social === 'number' ? d.capital_social : Number(d.capital_social || 0),
        )
        atual.set('consultado_em', new Date().toISOString())
        if (!atual.getString('dominio') && d.qsa == null) {
          // nada a fazer: mantém o domínio que veio da fonte
        }
        $app.save(atual)
        completou = true
      }
    } catch (_err) {
      completou = false
    }
  }

  // Recalcula a triagem com o registro (já completo quando o CNPJ respondeu).
  let alvo = null
  try {
    alvo = $app.findRecordById('contas', conta.id)
  } catch (_) {
    return e.next()
  }

  const perfis = $app.findRecordsByFilter(
    'perfis_ideais',
    'cliente = {:c} && status = "aprovado"',
    '-versao',
    1,
    0,
    { c: clienteId },
  )
  const perfil = perfis && perfis.length > 0 ? perfis[0] : null

  const lerLista = (registro, campo) => {
    if (!registro) return []
    const bruto = registro.getString(campo)
    if (!bruto) return []
    try {
      const v = JSON.parse(bruto)
      return v == null ? [] : v
    } catch (_) {
      return []
    }
  }

  const exclusoes = lerLista(perfil, 'exclusoes')
  const prioridade = lerLista(perfil, 'prioridade')

  const situacao = String(alvo.getString('situacao') || '').toUpperCase()
  const texto = [
    alvo.getString('empresa'),
    alvo.getString('cnae'),
    alvo.getString('porte'),
    alvo.getString('municipio'),
    alvo.getString('uf'),
  ]
    .join(' ')
    .toLowerCase()

  // Regra verificável do perfil (opção A): mede só o que o cadastro da Receita prova.
  // Formatos aceitos em prioridade[i].regra:
  //   {campo:'cnae', prefixos:['2121'], pontos:35}
  //   {campo:'capital_social', min:10000000, pontos:30}
  //   {campo:'uf', valores:['SP','RJ'], pontos:20}
  //   {campo:'anos_atividade', min:3, max:null, pontos:15}
  //   {campo:'porte', valores:['DEMAIS'], pontos:10}
  const avaliarRegraPerfil = function (regra, reg) {
    const campo = String((regra && regra.campo) || '')
    if (campo === 'cnae') {
      const bruto = String(reg.getString('cnae') || '')
      const achado = bruto.match(/\((\d{7})\)/)
      const codigo = achado ? achado[1] : bruto.replace(/[^0-9]/g, '')
      if (codigo.length < 4) return false
      const prefixos = regra.prefixos || []
      for (let i = 0; i < prefixos.length; i++) {
        if (codigo.indexOf(String(prefixos[i])) === 0) return true
      }
      return false
    }
    if (campo === 'capital_social') {
      const valor = Number(reg.get('capital_social') || 0)
      if (regra.min != null && valor < Number(regra.min)) return false
      if (regra.max != null && valor > Number(regra.max)) return false
      return true
    }
    if (campo === 'uf') {
      const uf = String(reg.getString('uf') || '').toUpperCase()
      const valores = regra.valores || []
      for (let i = 0; i < valores.length; i++) {
        if (uf === String(valores[i]).toUpperCase()) return true
      }
      return false
    }
    if (campo === 'anos_atividade') {
      const bruto = String(reg.getString('abertura') || '')
      const achado = bruto.match(/(\d{4})/)
      if (!achado) return false
      const anos = new Date().getFullYear() - Number(achado[1])
      if (regra.min != null && anos < Number(regra.min)) return false
      if (regra.max != null && anos > Number(regra.max)) return false
      return true
    }
    if (campo === 'porte') {
      const porte = String(reg.getString('porte') || '').toUpperCase()
      const valores = regra.valores || []
      for (let i = 0; i < valores.length; i++) {
        if (porte.indexOf(String(valores[i]).toUpperCase()) >= 0) return true
      }
      return false
    }
    if (campo === 'area_comercial') {
      // Só a pesquisa da conta descobre isto (varrendo os cargos no Apollo), então o
      // resultado dela manda: 'sim' pontua, 'nao' não pontua. Enquanto ninguém pesquisou,
      // a conta não é penalizada nem premiada por um dado que ainda não existe.
      if (!reg.getString('consultado_em')) return false
      return reg.getString('area_comercial') === 'sim'
    }
    return false
  }

  const motivos = []
  let triagem = 'prioridade'
  let nota = 0

  // RN-09 — sem CNPJ ou sem retorno da consulta: pendente de dados, nunca descartada.
  if (cnpj.length !== 14 || !alvo.getString('consultado_em')) {
    triagem = 'pendente_dados'
    motivos.push({ regra: 'Sem dados do CNPJ', pontos: 0 })
  } else if (situacao && situacao.indexOf('ATIVA') < 0) {
    // RN-10 — situação cadastral diferente de ativa.
    triagem = 'fora_do_perfil'
    motivos.push({ regra: 'CNPJ não ativo (' + situacao + ')', pontos: 0 })
  } else {
    // RN-11 — exclusão do perfil.
    let excluida = null
    for (let i = 0; i < exclusoes.length; i++) {
      const item = exclusoes[i] || {}
      const valor = String(item.valor || '')
        .toLowerCase()
        .trim()
      if (!valor) continue
      // Exclusão marcada `manual` só o José aplica: nenhum dado do cadastro a comprova.
      // Antes ela entrava na comparação de texto e nunca casava — agora fica explícita.
      if (item.manual === true) continue
      if (item.regra) {
        if (avaliarRegraPerfil(item.regra, alvo)) {
          excluida = item.valor
          break
        }
        continue
      }
      const palavras = valor.split(/\s+/)
      let casou = palavras.length > 0
      for (let p = 0; p < palavras.length; p++) {
        if (palavras[p].length > 3 && texto.indexOf(palavras[p]) < 0) {
          casou = false
          break
        }
      }
      if (casou) {
        excluida = item.valor
        break
      }
    }
    if (excluida) {
      triagem = 'fora_do_perfil'
      motivos.push({ regra: 'Exclusão do perfil: ' + excluida, pontos: 0 })
    } else if (prioridade.length > 0) {
      // RN-12 — cada critério que casa soma os pontos da regra (ou uma fatia igual de 100).
      // Critério com `regra` é verificável no cadastro; sem regra, cai na comparação de texto.
      const fatia = Math.floor(100 / prioridade.length)
      for (let i = 0; i < prioridade.length; i++) {
        const item = prioridade[i] || {}
        const valor = String(item.valor || '').trim()
        if (!valor) continue
        if (item.regra) {
          if (avaliarRegraPerfil(item.regra, alvo)) {
            const pontos = Number(item.regra.pontos) || fatia
            motivos.push({ regra: valor, pontos: pontos })
            nota += pontos
          }
          continue
        }
        const palavras = valor.toLowerCase().split(/\s+/)
        let casou = palavras.length > 0
        for (let p = 0; p < palavras.length; p++) {
          if (palavras[p].length > 3 && texto.indexOf(palavras[p]) < 0) {
            casou = false
            break
          }
        }
        if (casou) {
          motivos.push({ regra: valor, pontos: fatia })
          nota += fatia
        }
      }
      if (nota === 0) {
        motivos.push({ regra: 'Nenhum critério do perfil encontrado', pontos: 0 })
        triagem = 'fora_do_perfil'
      }
    } else {
      motivos.push({ regra: 'Perfil sem critérios de prioridade', pontos: 0 })
      triagem = 'fora_do_perfil'
    }
  }

  // Os pontos de maturidade digital vêm da pesquisa da conta (RN-17). A triagem não os
  // recalcula, mas precisa PRESERVÁ-LOS: antes ela reescrevia nota e motivos do zero e o
  // +5 da maturidade sumia no primeiro update da conta (75 voltava para 70).
  let somaMaturidade = 0
  try {
    const anteriores = JSON.parse(alvo.getString('motivos') || '[]')
    if (anteriores && anteriores.length) {
      for (let i = 0; i < anteriores.length; i++) {
        if (String(anteriores[i].regra || '').indexOf('Maturidade digital') === 0) {
          somaMaturidade += Number(anteriores[i].pontos) || 0
        }
      }
    }
  } catch (_) {
    somaMaturidade = 0
  }
  if (somaMaturidade > 0 && triagem === 'prioridade') {
    motivos.push({ regra: 'Maturidade digital: já usa automação', pontos: somaMaturidade })
    nota = Math.min(100, nota + somaMaturidade)
  }

  // Regra 9 do José: "abaixo de 70 não entra na fila ativa".
  // A conta continua no sistema com a nota e o motivo — só não é prioridade.
  if (triagem === 'prioridade' && nota < 70) {
    triagem = 'em_avaliacao'
    motivos.push({ regra: 'Nota abaixo de 70: não entra na fila ativa', pontos: 0 })
  }

  const faixa = nota >= 70 ? 'A' : nota >= 40 ? 'B' : 'C'

  alvo.set('nota', nota)
  alvo.set('faixa', faixa)
  alvo.set('motivos', JSON.stringify(motivos))
  alvo.set('situacao_triagem', triagem)
  // A etapa do funil (SPEC-1-005) só muda por movimentação do José.
  // Na criação, a conta nasce em "nova"; a triagem não a reescreve.
  if (!alvo.getString('etapa')) {
    alvo.set('etapa', triagem === 'prioridade' ? 'priorizada' : 'nova')
  }
  if (perfil) alvo.set('perfil_versao', perfil.getInt('versao'))
  $app.save(alvo)

  return e.next()
}, 'contas')

// Conta atualizada (perfil novo, correção manual): refaz a triagem.
onRecordAfterUpdateSuccess((e) => {
  let conta = e.record
  const clienteId = conta.getString('cliente')
  const cnpj = String(conta.getString('cnpj') || '').replace(/[^0-9]/g, '')

  // O CNPJ pode chegar depois (lista enviada aos poucos, planilha, correção à mão).
  // Sem isto, a conta gravada pela Apollo ficaria em "pendente de dados" para sempre.
  if (cnpj.length === 14 && !conta.getString('consultado_em')) {
    try {
      const res = $http.send({
        url: 'https://brasilapi.com.br/api/cnpj/v1/' + cnpj,
        method: 'GET',
        timeout: 15,
      })
      if (res.statusCode === 200 && res.json) {
        const d = res.json
        const completo = $app.findRecordById('contas', conta.id)
        completo.set('porte', String(d.descricao_porte || d.porte || ''))
        completo.set(
          'cnae',
          String(
            (d.cnae_fiscal_descricao || '') + (d.cnae_fiscal ? ' (' + d.cnae_fiscal + ')' : ''),
          ),
        )
        completo.set('situacao', String(d.descricao_situacao_cadastral || ''))
        completo.set('municipio', String(d.municipio || ''))
        completo.set(
          'uf',
          String(d.uf || '')
            .toUpperCase()
            .slice(0, 2),
        )
        completo.set('abertura', String(d.data_inicio_atividade || ''))
        completo.set(
          'capital_social',
          typeof d.capital_social === 'number' ? d.capital_social : Number(d.capital_social || 0),
        )
        completo.set('consultado_em', new Date().toISOString())
        $app.save(completo)
        // Segue para a triagem com o registro já completo.
        conta = completo
      }
    } catch (_err) {
      // Falha na consulta: a conta continua pendente de dados e tenta de novo depois.
    }
  }

  const perfis = $app.findRecordsByFilter(
    'perfis_ideais',
    'cliente = {:c} && status = "aprovado"',
    '-versao',
    1,
    0,
    { c: clienteId },
  )
  const perfil = perfis && perfis.length > 0 ? perfis[0] : null
  if (!perfil) return e.next()

  const lerLista = (campo) => {
    const bruto = perfil.getString(campo)
    if (!bruto) return []
    try {
      const v = JSON.parse(bruto)
      return v == null ? [] : v
    } catch (_) {
      return []
    }
  }

  const exclusoes = lerLista('exclusoes')
  const prioridade = lerLista('prioridade')
  const situacao = String(conta.getString('situacao') || '').toUpperCase()
  const texto = [
    conta.getString('empresa'),
    conta.getString('cnae'),
    conta.getString('porte'),
    conta.getString('municipio'),
    conta.getString('uf'),
  ]
    .join(' ')
    .toLowerCase()

  // Regra verificável do perfil (opção A): mede só o que o cadastro da Receita prova.
  const avaliarRegraPerfil = function (regra, reg) {
    const campo = String((regra && regra.campo) || '')
    if (campo === 'cnae') {
      const bruto = String(reg.getString('cnae') || '')
      const achado = bruto.match(/\((\d{7})\)/)
      const codigo = achado ? achado[1] : bruto.replace(/[^0-9]/g, '')
      if (codigo.length < 4) return false
      const prefixos = regra.prefixos || []
      for (let i = 0; i < prefixos.length; i++) {
        if (codigo.indexOf(String(prefixos[i])) === 0) return true
      }
      return false
    }
    if (campo === 'capital_social') {
      const valor = Number(reg.get('capital_social') || 0)
      if (regra.min != null && valor < Number(regra.min)) return false
      if (regra.max != null && valor > Number(regra.max)) return false
      return true
    }
    if (campo === 'uf') {
      const uf = String(reg.getString('uf') || '').toUpperCase()
      const valores = regra.valores || []
      for (let i = 0; i < valores.length; i++) {
        if (uf === String(valores[i]).toUpperCase()) return true
      }
      return false
    }
    if (campo === 'anos_atividade') {
      const bruto = String(reg.getString('abertura') || '')
      const achado = bruto.match(/(\d{4})/)
      if (!achado) return false
      const anos = new Date().getFullYear() - Number(achado[1])
      if (regra.min != null && anos < Number(regra.min)) return false
      if (regra.max != null && anos > Number(regra.max)) return false
      return true
    }
    if (campo === 'porte') {
      const porte = String(reg.getString('porte') || '').toUpperCase()
      const valores = regra.valores || []
      for (let i = 0; i < valores.length; i++) {
        if (porte.indexOf(String(valores[i]).toUpperCase()) >= 0) return true
      }
      return false
    }
    if (campo === 'area_comercial') {
      if (!reg.getString('consultado_em')) return false
      return reg.getString('area_comercial') === 'sim'
    }
    return false
  }

  const motivos = []
  let triagem = 'prioridade'
  let nota = 0

  if (cnpj.length !== 14 || !conta.getString('consultado_em')) {
    triagem = 'pendente_dados'
    motivos.push({ regra: 'Sem dados do CNPJ', pontos: 0 })
  } else if (situacao && situacao.indexOf('ATIVA') < 0) {
    triagem = 'fora_do_perfil'
    motivos.push({ regra: 'CNPJ não ativo (' + situacao + ')', pontos: 0 })
  } else {
    let excluida = null
    for (let i = 0; i < exclusoes.length; i++) {
      const item = exclusoes[i] || {}
      const valor = String(item.valor || '')
        .toLowerCase()
        .trim()
      if (!valor) continue
      if (item.manual === true) continue
      if (item.regra) {
        if (avaliarRegraPerfil(item.regra, conta)) {
          excluida = item.valor
          break
        }
        continue
      }
      const palavras = valor.split(/\s+/)
      let casou = palavras.length > 0
      for (let p = 0; p < palavras.length; p++) {
        if (palavras[p].length > 3 && texto.indexOf(palavras[p]) < 0) {
          casou = false
          break
        }
      }
      if (casou) {
        excluida = item.valor
        break
      }
    }
    if (excluida) {
      triagem = 'fora_do_perfil'
      motivos.push({ regra: 'Exclusão do perfil: ' + excluida, pontos: 0 })
    } else if (prioridade.length > 0) {
      const fatia = Math.floor(100 / prioridade.length)
      for (let i = 0; i < prioridade.length; i++) {
        const item = prioridade[i] || {}
        const valor = String(item.valor || '').trim()
        if (!valor) continue
        if (item.regra) {
          if (avaliarRegraPerfil(item.regra, conta)) {
            const pontos = Number(item.regra.pontos) || fatia
            motivos.push({ regra: valor, pontos: pontos })
            nota += pontos
          }
          continue
        }
        const palavras = valor.toLowerCase().split(/\s+/)
        let casou = palavras.length > 0
        for (let p = 0; p < palavras.length; p++) {
          if (palavras[p].length > 3 && texto.indexOf(palavras[p]) < 0) {
            casou = false
            break
          }
        }
        if (casou) {
          motivos.push({ regra: valor, pontos: fatia })
          nota += fatia
        }
      }
      if (nota === 0) {
        motivos.push({ regra: 'Nenhum critério do perfil encontrado', pontos: 0 })
        triagem = 'fora_do_perfil'
      }
    } else {
      triagem = 'fora_do_perfil'
      motivos.push({ regra: 'Perfil sem critérios de prioridade', pontos: 0 })
    }
  }

  // Preserva os pontos de maturidade digital que a pesquisa já tinha somado (RN-17).
  // Sem isto, qualquer update da conta apagava o ajuste: 75 voltava para 70.
  let somaMaturidade = 0
  try {
    const anteriores = JSON.parse(conta.getString('motivos') || '[]')
    if (anteriores && anteriores.length) {
      for (let i = 0; i < anteriores.length; i++) {
        if (String(anteriores[i].regra || '').indexOf('Maturidade digital') === 0) {
          somaMaturidade += Number(anteriores[i].pontos) || 0
        }
      }
    }
  } catch (_) {
    somaMaturidade = 0
  }
  if (somaMaturidade > 0 && triagem === 'prioridade') {
    motivos.push({ regra: 'Maturidade digital: já usa automação', pontos: somaMaturidade })
    nota = Math.min(100, nota + somaMaturidade)
  }

  // Regra 9 do José: "abaixo de 70 não entra na fila ativa".
  if (triagem === 'prioridade' && nota < 70) {
    triagem = 'em_avaliacao'
    motivos.push({ regra: 'Nota abaixo de 70: não entra na fila ativa', pontos: 0 })
  }

  const atual = $app.findRecordById('contas', conta.id)
  const notaAtual = atual.getInt('nota')
  const triagemAtual = atual.getString('situacao_triagem')
  if (notaAtual === nota && triagemAtual === triagem) return e.next()

  atual.set('nota', nota)
  atual.set('faixa', nota >= 70 ? 'A' : nota >= 40 ? 'B' : 'C')
  atual.set('motivos', JSON.stringify(motivos))
  atual.set('situacao_triagem', triagem)
  atual.set('perfil_versao', perfil.getInt('versao'))
  $app.save(atual)

  return e.next()
}, 'contas')

// RN-13 — perfil novo aprovado: busca de novo e recalcula as notas da carteira.
onRecordAfterUpdateSuccess((e) => {
  if (e.record.getString('status') !== 'aprovado') return e.next()
  const clienteId = e.record.getString('cliente')
  const versao = e.record.getInt('versao')

  const contas = $app.findRecordsByFilter('contas', 'cliente = {:c}', '-created', 500, 0, {
    c: clienteId,
  })
  for (let i = 0; i < contas.length; i++) {
    const conta = contas[i]
    if (conta.getInt('perfil_versao') === versao) continue
    // Reescreve a versão para o hook de atualização refazer a triagem.
    const atual = $app.findRecordById('contas', conta.id)
    atual.set('perfil_versao', versao)
    $app.save(atual)
  }

  return e.next()
}, 'perfis_ideais')
