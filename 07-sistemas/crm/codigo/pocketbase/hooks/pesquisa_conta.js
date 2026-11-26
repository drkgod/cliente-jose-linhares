// Pesquisa automática da conta (SPEC-1-004): maturidade digital, decisores e briefing.
// JSVM: cada callback é autocontido — sem helpers de topo e sem transação.
// Uma pesquisa vigente por conta; o que o José corrigiu não é sobrescrito (RN-19).
routerAdd('POST', '/backend/v1/pesquisas/pesquisar', (e) => {
  if (!e.hasSuperuserAuth()) {
    const email = e.auth ? String(e.auth.getString('email') || '').toLowerCase() : ''
    if (!email) throw new ForbiddenError('Acesso não liberado.')
    try {
      $app.findFirstRecordByFilter('acessos', 'email = {:email} && ativo = true', { email: email })
    } catch (_) {
      throw new ForbiddenError('Acesso não liberado.')
    }
  }

  const corpo = e.requestInfo().body || {}
  const contaId = String(corpo.conta || '').trim()
  if (!contaId) throw new BadRequestError('Informe a conta.')

  let conta
  try {
    conta = $app.findRecordById('contas', contaId)
  } catch (_) {
    throw new BadRequestError('Conta não encontrada.')
  }
  const clienteId = conta.getString('cliente')

  // Pesquisa vigente, se já existe (para preservar correções do José).
  let existente = null
  try {
    existente = $app.findFirstRecordByData('pesquisas', 'conta', contaId)
  } catch (_) {
    existente = null
  }
  const jaCorrigido = existente ? existente.getBool('corrigido_por_jose') : false

  // ---- RN-15: limite diário (padrão 25) ----
  const limiteDiario = 25
  const hoje = new Date()
  const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
  const doDia = $app.findRecordsByFilter(
    'pesquisas',
    'cliente = {:c} && feito_em >= {:d}',
    '',
    1000,
    0,
    { c: clienteId, d: inicioDoDia },
  )
  if (doDia.length >= limiteDiario) {
    throw new BadRequestError(
      'Limite de ' + limiteDiario + ' pesquisas por dia atingido para esta carteira.',
    )
  }

  const motivos = []
  let parcial = false

  // ---- 1. Leitura do site ----
  const site = String(conta.getString('dominio') || '').trim()
  let html = ''
  let siteLido = false
  let evidenciaUrl = ''
  let diag = 'sem url'
  // Diagnóstico interno da leitura do site (não vai para a tela).
  if (site) {
    diag = 'url=' + site
    try {
      // Muitos sites de indústria farmacêutica ficam atrás de Cloudflare e respondem 302
      // para o domínio .ind.br. Sem UA de navegador e sem seguir o redirect, a página
      // vinha vazia e a conta ficava "site não lido" (briefing sem fonte, maturidade nula).
      const urlFinal = /^https?:\/\//i.test(site)
        ? site
        : 'https://' + String(site).replace(/^\/+/, '')
      const res = $http.send({
        url: urlFinal,
        method: 'GET',
        timeout: 30,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      })
      diag += ' status=' + res.statusCode
      const bytes = res.body
      diag +=
        ' bytes=' + (bytes ? bytes.length || bytes.byteLength || Object.keys(bytes).length : 0)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          html = new TextDecoder().decode(bytes)
        } catch (e1) {
          diag += ' decode_fail=' + String(e1 && e1.message)
          try {
            let acumulado = ''
            const tam = bytes.length || 0
            for (let k = 0; k < tam; k++) acumulado += String.fromCharCode(bytes[k])
            html = acumulado
          } catch (e2) {
            diag += ' fallback_fail=' + String(e2 && e2.message)
            html = ''
          }
        }
        diag += ' html_len=' + html.length
        if (html && html.length > 200) {
          siteLido = true
          evidenciaUrl = site
        }
      }
    } catch (err) {
      diag += ' erro=' + String(err && err.message)
      siteLido = false
    }
  }
  if (!siteLido) {
    parcial = true
    motivos.push('site não lido')
  }

  const baixo = html.toLowerCase()
  const temCorpo =
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim().length > 300
  const temScript = /\<script/i.test(html)

  const achar = (lista, rotulo) => {
    for (let i = 0; i < lista.length; i++) {
      if (baixo.indexOf(lista[i]) >= 0) {
        return { situacao: 'sim', evidencia: rotulo + ': ' + lista[i] }
      }
    }
    return null
  }

  // ---- 2. Maturidade digital ----
  const maturidade = {
    crm: { situacao: 'nao_lido', evidencia: 'site não respondeu' },
    pixel: { situacao: 'nao_lido', evidencia: 'site não respondeu' },
    automacao: { situacao: 'nao_lido', evidencia: 'site não respondeu' },
  }
  if (siteLido) {
    const marcadoresCrm = [
      'salesforce',
      'dynamics.com',
      'dynamics 365',
      'hubspot',
      'pipedrive',
      'totvs',
      'crm.com',
      'agendor',
      'rdstation',
      'rd station',
      'zoho',
      'freshsales',
      'sugarcrm',
    ]
    const marcadoresPixel = [
      'googletagmanager.com',
      'gtag(',
      'fbevents.js',
      'facebook.net',
      'hotjar',
      'clarity.ms',
      'linkedin insight',
      'snap.licdn',
    ]
    const marcadoresAuto = [
      'mailchimp',
      'sendgrid',
      'mailgun',
      'activecampaign',
      'rdstation',
      'marketo',
      'pardot',
      'klaviyo',
    ]
    const acharCrm = achar(marcadoresCrm, 'script/menção')
    maturidade.crm = acharCrm || {
      situacao: 'nao',
      evidencia:
        'nenhum marcador encontrado no HTML de ' +
        evidenciaUrl +
        (temScript ? ' (há scripts, nenhum de CRM)' : ' (sem scripts)'),
    }
    const acharPixel = achar(marcadoresPixel, 'script/menção')
    maturidade.pixel = acharPixel || {
      situacao: 'nao',
      evidencia: 'nenhum marcador encontrado no HTML de ' + evidenciaUrl,
    }
    const acharAuto = achar(marcadoresAuto, 'script/menção')
    maturidade.automacao = acharAuto || {
      situacao: 'nao',
      evidencia:
        'nenhum marcador encontrado no HTML de ' +
        evidenciaUrl +
        (temScript ? ' (há scripts, nenhum de CRM)' : ' (sem scripts)'),
    }
    if (!temCorpo) {
      maturidade.crm.evidencia += ' — página sem conteúdo visível'
    }
  }

  // ---- 3. Decisores (Apollo) ----
  const decisores = []
  let decisoresFonte = ''
  const chaveApollo = $secrets.get('APOLLO_API_KEY') || ''
  if (chaveApollo) {
    const dominioApollo = String(conta.getString('dominio') || '')
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0]
      .trim()
    try {
      const res = $http.send({
        url: 'https://api.apollo.io/v1/mixed_people/api_search',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': chaveApollo },
        body: JSON.stringify(
          dominioApollo
            ? {
                q_organization_domains_list: [dominioApollo],
                // `person_titles` NÃO funciona nesta chave (devolve 0 sempre — provado em
                // 25/11/2026 com o diagnóstico: título em PT e EN, sozinho e combinado).
                // Então buscamos amplo e classificamos a área aqui no código.
                person_seniorities: [
                  'owner',
                  'founder',
                  'c_suite',
                  'partner',
                  'vp',
                  'head',
                  'director',
                  'manager',
                ],
                page: 1,
                per_page: 100,
              }
            : {
                q_organization_name: String(conta.getString('empresa') || '').slice(0, 100),
                person_seniorities: ['owner', 'founder', 'c_suite', 'partner'],
                page: 1,
                per_page: 10,
              },
        ),
        timeout: 25,
      })
      if (res.statusCode === 401) {
        parcial = true
        motivos.push('Apollo: chave inválida')
      } else if (res.statusCode === 429) {
        parcial = true
        motivos.push('Apollo: cota esgotada')
      } else if (res.statusCode >= 400) {
        parcial = true
        motivos.push('Apollo fora do ar (' + res.statusCode + ')')
      } else {
        const dados = res.json || {}
        const pessoas = dados.people || []
        decisoresFonte = 'apollo'
        // A busca de pessoas devolve first_name + last_name_obfuscated (sem `name`).
        // Ordena por área e por cargo: comercial primeiro, depois hierarquia.
        const pesoDoCargo = (cargo) => {
          const t = String(cargo || '').toLowerCase()
          if (
            t.indexOf('ceo') >= 0 ||
            t.indexOf('chief') >= 0 ||
            t.indexOf('presidente') >= 0 ||
            t.indexOf('sócio') >= 0 ||
            t.indexOf('socio') >= 0 ||
            t.indexOf('fundador') >= 0 ||
            t.indexOf('founder') >= 0 ||
            t.indexOf('owner') >= 0
          ) {
            return 1
          }
          // A área comercial vem antes da hierarquia: o CRM/SFA que a Magically vende é
          // comprado por vendas e marketing, não por produção, engenharia ou compras.
          // Antes a ordem era só por senioridade e a conta trazia COO, engenharia e
          // procurement — decisores que nunca assinam este tipo de compra.
          // Cuidado com `operations` solto: "Chief Operations Officer" é COO, não vendas.
          const areaComercial =
            t.indexOf('comercial') >= 0 ||
            t.indexOf('vendas') >= 0 ||
            t.indexOf('sales') >= 0 ||
            t.indexOf('trade') >= 0 ||
            t.indexOf('marketing') >= 0 ||
            t.indexOf('crm') >= 0 ||
            t.indexOf('sfe') >= 0
          if (areaComercial) {
            if (t.indexOf('diretor') >= 0 || t.indexOf('director') >= 0) return 1
            if (t.indexOf('head') >= 0 || t.indexOf('vp') >= 0 || t.indexOf('vice') >= 0) return 2
            if (t.indexOf('gerente') >= 0 || t.indexOf('manager') >= 0) return 3
            return 4
          }
          if (t.indexOf('diretor') >= 0 || t.indexOf('director') >= 0) return 5
          if (t.indexOf('head') >= 0 || t.indexOf('vp') >= 0 || t.indexOf('vice') >= 0) return 6
          if (t.indexOf('gerente') >= 0 || t.indexOf('manager') >= 0) return 7
          return 8
        }
        // Converte o peso (1..8) no rótulo de senioridade gravado no decisor.
        const areaSenhoria = (peso) => {
          if (peso === 1 || peso === 5) return 'diretor'
          if (peso === 2 || peso === 6) return 'head'
          if (peso === 3 || peso === 7) return 'gerente'
          return 'outro'
        }
        const candidatos = []
        for (let i = 0; i < pessoas.length; i++) {
          const p = pessoas[i] || {}
          const partes = [p.first_name, p.last_name_obfuscated]
            .filter(function (x) {
              return x
            })
            .join(' ')
            .trim()
          const nome = partes || 'sem nome'
          const cargo = String(p.title || '').trim()
          candidatos.push({
            nome: nome,
            cargo: cargo,
            senioridade: areaSenhoria(pesoDoCargo(cargo)),
            fonte: 'apollo',
            peso: pesoDoCargo(cargo),
          })
        }
        candidatos.sort((a, b) => a.peso - b.peso)
        for (let i = 0; i < candidatos.length && decisores.length < 5; i++) {
          decisores.push({
            nome: candidatos[i].nome,
            cargo: candidatos[i].cargo,
            senioridade: candidatos[i].senioridade,
            fonte: candidatos[i].fonte,
          })
        }
      }
    } catch (_err) {
      parcial = true
      motivos.push('Apollo fora do ar')
    }
  } else {
    parcial = true
    motivos.push('Apollo: sem chave no cofre')
  }

  // ---- 4. Briefing ----
  // Regra da SPEC-1-004: dor sem fonte fica "a confirmar"; fonte só se o dado existe.
  const limpar = (t) =>
    t
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  const texto = limpar(html).toLowerCase()
  const briefing = {
    dor_provavel: { valor: '', fonte: '' },
    gatilho: { valor: '', fonte: '' },
    abordagem: { valor: '', fonte: '' },
  }

  // INSUMOS DO CLIENTE: dores e abordagem que o José cadastrou.
  let doresCliente = ''
  let playbookCliente = ''
  try {
    const cli = $app.findRecordById('clientes_atendidos', clienteId)
    doresCliente = String(cli.getString('dores_solucoes') || '')
    playbookCliente = String(cli.getString('playbook') || '')
  } catch (_) {}

  const temSite = siteLido && texto.length > 300
  if (temSite) {
    // Dor provável: procura no texto do site as dores que o cliente mapeou.
    const candidatosDor = []
    if (doresCliente) {
      const linhas = doresCliente.split(/\n|;/)
      for (let i = 0; i < linhas.length && candidatosDor.length < 12; i++) {
        const l = linhas[i].trim()
        if (l.length > 12) candidatosDor.push(l)
      }
    }
    const achouDor = (() => {
      for (let i = 0; i < candidatosDor.length; i++) {
        const palavras = candidatosDor[i].toLowerCase().split(/\s+/)
        let casou = 0
        for (let p = 0; p < palavras.length; p++) {
          if (palavras[p].length > 5 && texto.indexOf(palavras[p]) >= 0) casou++
        }
        if (casou >= 2) return candidatosDor[i]
      }
      return ''
    })()
    const palavrasChaveDor = [
      'força de vendas',
      'representantes',
      'visita',
      'amostras grátis',
      'compliance',
      'auditoria',
      'treinamento',
      'produtividade',
      'roteiro',
      'pesquisa de mercado',
      'inside sales',
      'distribuidor',
      'prescrição',
      'marketing',
    ]
    let dorSite = ''
    for (let i = 0; i < palavrasChaveDor.length; i++) {
      if (texto.indexOf(palavrasChaveDor[i]) >= 0) {
        dorSite = palavrasChaveDor[i]
        break
      }
    }
    if (achouDor) {
      briefing.dor_provavel = { valor: achouDor, fonte: 'cadastro do cliente' }
    } else if (dorSite) {
      briefing.dor_provavel = {
        valor:
          'Sinal no site da empresa sobre "' +
          dorSite +
          '", dor que a Magically ataca com SFA e rastreabilidade de campo',
        fonte: 'site',
      }
    } else {
      briefing.dor_provavel = { valor: 'a confirmar', fonte: '' }
    }

    // Gatilho: mudança concreta que abre conversa.
    const gatilhos = [
      { re: /nova\s+fábrica|expansão|nova unidade|inaugura/i, txt: 'expansão ou nova unidade' },
      {
        re: /contrata|vaga|oportunidade|trabalhe conosco|carreira/i,
        txt: 'contratação em andamento',
      },
      { re: /lançamento|novo produto|portfólio/i, txt: 'lançamento de produto' },
      {
        re: /compliance|anticorrupção|integridade/i,
        txt: 'foco em compliance (rastreabilidade de campo)',
      },
      { re: /pesquisa|desenvolvimento|inovação/i, txt: 'investimento em P&D' },
    ]
    let gatilhoAchado = ''
    for (let i = 0; i < gatilhos.length; i++) {
      if (gatilhos[i].re.test(html)) {
        gatilhoAchado = gatilhos[i].txt
        break
      }
    }
    if (gatilhoAchado) {
      briefing.gatilho = { valor: gatilhoAchado, fonte: 'site' }
    } else {
      briefing.gatilho = { valor: 'a confirmar', fonte: '' }
    }
  } else {
    briefing.dor_provavel = { valor: 'a confirmar', fonte: '' }
    briefing.gatilho = { valor: 'a confirmar', fonte: '' }
  }

  // Abordagem: usa o playbook do cliente quando ele existe, senão o genérico da dor.
  const dorTexto = briefing.dor_provavel.valor
  if (playbookCliente && playbookCliente.length > 40) {
    briefing.abordagem = {
      valor:
        'Seguir o playbook do cliente: abrir com a dor "' +
        dorTexto +
        '" e oferecer a solução correspondente. ' +
        playbookCliente.slice(0, 400),
      fonte: 'playbook do cliente',
    }
  } else {
    briefing.abordagem = {
      valor:
        'Abrir com a dor provável "' +
        dorTexto +
        '" citando o que foi visto na empresa, e propor uma conversa de 20 minutos.',
      fonte: briefing.dor_provavel.fonte,
    }
  }

  const briefingOk =
    briefing.dor_provavel.valor !== '' && briefing.dor_provavel.valor !== 'a confirmar'

  // ---- Grava a pesquisa ----
  const colecaoP = $app.findCollectionByNameOrId('pesquisas')
  let registro = existente
  if (!registro) {
    registro = new Record(colecaoP)
    registro.set('cliente', clienteId)
    registro.set('conta', contaId)
  }

  // Mantém o que o José corrigiu.
  let maturidadeFinal = maturidade
  let briefingFinal = briefing
  if (jaCorrigido && existente) {
    try {
      const anteriorM = JSON.parse(existente.getString('maturidade') || '{}') || {}
      const anteriorB = JSON.parse(existente.getString('briefing') || '{}') || {}
      const marcadoM = anteriorM.__corrigido || {}
      const marcadoB = anteriorB.__corrigido || {}
      const chavesM = ['crm', 'pixel', 'automacao']
      for (let i = 0; i < chavesM.length; i++) {
        if (marcadoM[chavesM[i]]) maturidadeFinal[chavesM[i]] = anteriorM[chavesM[i]]
      }
      const chavesB = ['dor_provavel', 'gatilho', 'abordagem']
      for (let i = 0; i < chavesB.length; i++) {
        if (marcadoB[chavesB[i]]) briefingFinal[chavesB[i]] = anteriorB[chavesB[i]]
      }
      maturidadeFinal.__corrigido = marcadoM
      briefingFinal.__corrigido = marcadoB
    } catch (_) {}
  }

  const status = parcial ? 'parcial' : 'ok'
  registro.set('maturidade', JSON.stringify(maturidadeFinal))
  registro.set('briefing', JSON.stringify(briefingFinal))
  registro.set(
    'fontes',
    JSON.stringify({
      site: siteLido ? evidenciaUrl : '',
      apollo: decisoresFonte,
      decisores: decisores.length,
      ia: 'skip',
    }),
  )
  registro.set('status', status)
  registro.set('motivo', motivos.join('; '))
  registro.set('tentativas', registro.getInt('tentativas') + 1)
  registro.set('feito_em', new Date().toISOString())
  $app.save(registro)

  // ---- 5. Decisores ----
  const colecaoD = $app.findCollectionByNameOrId('decisores')
  let salvos = 0
  for (let i = 0; i < decisores.length; i++) {
    const d = decisores[i]
    let existeD = null
    try {
      existeD = $app.findFirstRecordByData('decisores', 'nome', d.nome)
      if (existeD && existeD.getString('conta') !== contaId) existeD = null
    } catch (_) {
      existeD = null
    }
    if (existeD) {
      // A pessoa já estava gravada, mas o cargo pode ter sido reclassificado (mudança de
      // ordem por área comercial). Atualiza cargo/senioridade sem perder correção do José.
      if (!existeD.getBool('corrigido')) {
        existeD.set('cargo', d.cargo)
        existeD.set('senioridade', d.senioridade)
        $app.save(existeD)
      }
      continue
    }
    const novoD = new Record(colecaoD)
    novoD.set('cliente', clienteId)
    novoD.set('conta', contaId)
    novoD.set('nome', d.nome)
    novoD.set('cargo', d.cargo)
    novoD.set('senioridade', d.senioridade)
    novoD.set('fonte', d.fonte)
    novoD.set('ativo', true)
    $app.save(novoD)
    salvos++
  }

  // ---- 6. RN-17: recalcula a nota com a maturidade ----
  let notaAjuste = 0
  const pesos = { sim: 5, nao: 0, nao_lido: 0 }
  notaAjuste += pesos[maturidade.crm.situacao] || 0
  notaAjuste += pesos[maturidade.pixel.situacao] || 0
  notaAjuste += pesos[maturidade.automacao.situacao] || 0
  const contaAtual = $app.findRecordById('contas', contaId)
  const notaBase = contaAtual.getInt('nota')
  const novaNota = Math.min(100, notaBase + notaAjuste)
  if (novaNota !== notaBase) {
    let motivosNota = []
    try {
      const v = JSON.parse(contaAtual.getString('motivos') || '[]')
      motivosNota = v == null ? [] : v
    } catch (_) {
      motivosNota = []
    }
    // Remover evento de maturidade anterior para não somar duas vezes.
    const limpos = []
    for (let i = 0; i < motivosNota.length; i++) {
      if (String(motivosNota[i].regra || '').indexOf('Maturidade digital') !== 0) {
        limpos.push(motivosNota[i])
      }
    }
    if (notaAjuste > 0) {
      limpos.push({ regra: 'Maturidade digital: já usa automação', pontos: notaAjuste })
    }
    contaAtual.set('nota', novaNota)
    contaAtual.set('faixa', novaNota >= 70 ? 'A' : novaNota >= 40 ? 'B' : 'C')
    contaAtual.set('motivos', JSON.stringify(limpos))
    $app.save(contaAtual)
  }

  return e.json(200, {
    status: status,
    motivo: motivos.join('; '),
    site_diag: diag,
    maturidade: maturidadeFinal,
    decisores: decisores,
    decisores_novos: salvos,
    briefing: briefingFinal,
    nota: novaNota,
    briefing_ok: briefingOk,
  })
})

// Correção do José sobre um item (RN-19).
routerAdd('POST', '/backend/v1/pesquisas/corrigir', (e) => {
  if (!e.hasSuperuserAuth()) {
    const email = e.auth ? String(e.auth.getString('email') || '').toLowerCase() : ''
    if (!email) throw new ForbiddenError('Acesso não liberado.')
    try {
      $app.findFirstRecordByFilter('acessos', 'email = {:email} && ativo = true', { email: email })
    } catch (_) {
      throw new ForbiddenError('Acesso não liberado.')
    }
  }

  const corpo = e.requestInfo().body || {}
  const contaId = String(corpo.conta || '').trim()
  const campo = String(corpo.campo || '').trim()
  const valor = String(corpo.valor || '').trim()
  if (!contaId || !campo) throw new BadRequestError('Informe a conta e o campo.')

  let pesquisa
  try {
    pesquisa = $app.findFirstRecordByData('pesquisas', 'conta', contaId)
  } catch (_) {
    throw new BadRequestError('Pesquisa não encontrada.')
  }

  const maturidade = JSON.parse(pesquisa.getString('maturidade') || '{}') || {}
  const briefing = JSON.parse(pesquisa.getString('briefing') || '{}') || {}

  if (campo === 'crm' || campo === 'pixel' || campo === 'automacao') {
    maturidade[campo] = { situacao: valor, evidencia: 'corrigido pelo José' }
    maturidade.__corrigido = maturidade.__corrigido || {}
    maturidade.__corrigido[campo] = true
    pesquisa.set('maturidade', JSON.stringify(maturidade))
  } else if (campo === 'dor_provavel' || campo === 'gatilho' || campo === 'abordagem') {
    briefing[campo] = { valor: valor, fonte: 'corrigido pelo José' }
    briefing.__corrigido = briefing.__corrigido || {}
    briefing.__corrigido[campo] = true
    pesquisa.set('briefing', JSON.stringify(briefing))
  } else {
    throw new BadRequestError('Campo desconhecido.')
  }

  pesquisa.set('corrigido_por_jose', true)
  $app.save(pesquisa)
  return e.json(200, { corrigido: true, campo: campo })
})

// Lista as pesquisas de uma carteira.
routerAdd('GET', '/backend/v1/pesquisas', (e) => {
  if (!e.hasSuperuserAuth()) {
    const email = e.auth ? String(e.auth.getString('email') || '').toLowerCase() : ''
    if (!email) throw new ForbiddenError('Acesso não liberado.')
    try {
      $app.findFirstRecordByFilter('acessos', 'email = {:email} && ativo = true', { email: email })
    } catch (_) {
      throw new ForbiddenError('Acesso não liberado.')
    }
  }

  const clienteId = String(e.request.url.query().get('cliente') || '').trim()
  const contaId = String(e.request.url.query().get('conta') || '').trim()
  let filtro = 'id != ""'
  const params = {}
  if (clienteId) {
    filtro += ' && cliente = {:c}'
    params.c = clienteId
  }
  if (contaId) {
    filtro += ' && conta = {:t}'
    params.t = contaId
  }
  const itens = $app.findRecordsByFilter('pesquisas', filtro, '-created', 100, 0, params)
  const saida = []
  for (let i = 0; i < itens.length; i++) {
    const p = itens[i]
    saida.push({
      id: p.id,
      conta: p.getString('conta'),
      cliente: p.getString('cliente'),
      status: p.getString('status'),
      motivo: p.getString('motivo'),
      maturidade: JSON.parse(p.getString('maturidade') || '{}'),
      briefing: JSON.parse(p.getString('briefing') || '{}'),
      fontes: JSON.parse(p.getString('fontes') || '{}'),
      feito_em: p.getString('feito_em'),
    })
  }
  return e.json(200, { items: saida })
})
