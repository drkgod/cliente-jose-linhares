// Busca automática de contas (SPEC-1-003). Cada rota e cada hook é autocontido: o JSVM
// do PocketBase roda callbacks em outro pool e não enxerga helpers de topo.
// Fontes: planilha/CNPJ, Apollo (com chave no cofre ou simulador) e Anvisa.
// Idempotência: chave única por carteira — CNPJ só dígitos, senão domínio, senão nome.

routerAdd('POST', '/backend/v1/contas/buscar', (e) => {
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
  const clienteId = String(corpo.cliente || '').trim()
  const gatilho = String(corpo.gatilho || 'botao').trim()
  if (!clienteId) throw new BadRequestError('Informe a carteira.')

  let cliente
  try {
    cliente = $app.findRecordById('clientes_atendidos', clienteId)
  } catch (_) {
    throw new BadRequestError('Carteira não encontrada.')
  }

  const perfis = $app.findRecordsByFilter(
    'perfis_ideais',
    'cliente = {:c} && status = "aprovado"',
    '-versao',
    1,
    0,
    { c: clienteId },
  )
  if (!perfis || perfis.length === 0) {
    throw new BadRequestError('Aprove o perfil ideal antes de buscar contas.')
  }
  const perfil = perfis[0]
  const perfilVersao = perfil.getInt('versao')

  const lerLista = (registro, campo) => {
    const bruto = registro.getString(campo)
    if (!bruto) return []
    try {
      const valor = JSON.parse(bruto)
      return valor == null ? [] : valor
    } catch (_) {
      return []
    }
  }

  const prioridade = lerLista(perfil, 'prioridade')
  const exclusoes = lerLista(perfil, 'exclusoes')
  const cargos = lerLista(perfil, 'cargos')
  const tipoEmpresa = perfil.getString('tipo_empresa')
  const porte = perfil.getString('porte')

  const normalizarChave = (cnpj, dominio, empresa) => {
    const digitos = String(cnpj || '').replace(/[^0-9]/g, '')
    if (digitos.length === 14) return digitos
    const dom = String(dominio || '')
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .trim()
    if (dom) return 'dominio:' + dom
    return (
      'nome:' +
      String(empresa || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
    )
  }

  const resumos = []

  // ---------- Fonte 1: Apollo (chave no cofre; sem chave, simulador do mesmo formato) ----------
  const inicioApollo = new Date().toISOString()
  let candApollo = []
  let falhasApollo = 0
  let erroApollo = ''
  let cotaApollo = 0
  const chaveApollo = $secrets.get('APOLLO_API_KEY') || ''
  if (chaveApollo) {
    // A busca de empresas só casa etiqueta curta de segmento ("cosmeticos"), não a frase do
    // perfil, e a faixa de funcionários tem de ser numérica ("51,200"), nunca o texto do porte.
    const semAcento = (texto) => {
      let t = String(texto || '').toLowerCase()
      const mapa = {
        á: 'a',
        à: 'a',
        â: 'a',
        ã: 'a',
        ä: 'a',
        é: 'e',
        è: 'e',
        ê: 'e',
        ë: 'e',
        í: 'i',
        ì: 'i',
        î: 'i',
        ï: 'i',
        ó: 'o',
        ò: 'o',
        ô: 'o',
        õ: 'o',
        ö: 'o',
        ú: 'u',
        ù: 'u',
        û: 'u',
        ü: 'u',
        ç: 'c',
        ñ: 'n',
      }
      const chaves = Object.keys(mapa)
      for (let i = 0; i < chaves.length; i++) t = t.split(chaves[i]).join(mapa[chaves[i]])
      return t
    }
    const genericas = [
      'industria',
      'industrias',
      'industriais',
      'empresa',
      'empresas',
      'fabricante',
      'fabricantes',
      'comercio',
      'comercial',
      'distribuidora',
      'distribuidores',
      'produtora',
      'produtores',
      'do',
      'da',
      'de',
      'dos',
      'das',
      'e',
      'ou',
      'no',
      'na',
      'em',
      'para',
      'com',
      'que',
      'tipo',
      'tipos',
      'segmento',
      'setor',
      'area',
      'atuacao',
      'negocio',
      'negocios',
      'nacional',
      'brasil',
    ]
    // A Apollo indexa o setor da empresa em inglês: "farmaceutica" em português não casa com
    // nada. Traduzimos o segmento do perfil e, quando o perfil diz receita (R$ 50M a R$ 500M),
    // usamos revenue_range — que é o dado real de receita, não uma dedução de funcionários.
    const segmentos = [
      { padrao: /farmac|farma\b|medicament/, etiqueta: 'pharmaceutical' },
      { padrao: /biotecnolog|biotech/, etiqueta: 'biotechnology' },
      { padrao: /veterinar|saude animal|pet\b/, etiqueta: 'veterinary' },
      { padrao: /cosmetic|perfumaria|beleza|higiene pessoal/, etiqueta: 'cosmetics' },
      { padrao: /distribuidor.*medicament|distribuidora/, etiqueta: 'wholesale' },
      { padrao: /laborator/, etiqueta: 'research' },
      { padrao: /hospital|clinica|saude/, etiqueta: 'hospital & health care' },
    ]
    const tipoBaixo = semAcento(tipoEmpresa)
    const etiquetas = []
    for (let s = 0; s < segmentos.length; s++) {
      if (segmentos[s].padrao.test(tipoBaixo) && etiquetas.indexOf(segmentos[s].etiqueta) < 0) {
        etiquetas.push(segmentos[s].etiqueta)
      }
    }
    // No máximo duas etiquetas: cada etiqueta a mais amplia o resultado e traz ruído.
    if (etiquetas.length > 2) etiquetas.length = 2
    // Segmento não reconhecido: usa as palavras do perfil como etiqueta (melhor que nada).
    if (etiquetas.length === 0) {
      const partes = tipoBaixo.split(/[,;/&]|\bou\b|\be\b/)
      for (let i = 0; i < partes.length; i++) {
        const palavras = partes[i].split(/\s+/).filter(function (pal) {
          return pal && genericas.indexOf(pal) < 0
        })
        const frase = palavras.slice(0, 2).join(' ').trim()
        if (frase.length >= 4 && etiquetas.indexOf(frase) < 0) etiquetas.push(frase)
      }
    }

    // Receita: "R$ 50M a R$ 500M", "entre R$ 50 e 100 milhões", "acima de R$ 50 milhões".
    // A unidade vem uma vez por faixa ("100 a 200 milhões"), então tratamos a faixa primeiro.
    const p = semAcento(porte)
    const multiplicadorDe = function (unidade) {
      return /^b|bilh/.test(unidade) ? 1000000000 : 1000000
    }
    const receitas = []
    const faixa =
      /(\d+(?:[.,]\d+)?)\s*(?:a|e|ate|-)\s*(\d+(?:[.,]\d+)?)\s*(milhoes|milhao|m\b|bilhao|bilhoes|bi\b|b\b)/g
    let achado = faixa.exec(p)
    while (achado !== null) {
      const mult = multiplicadorDe(achado[3])
      receitas.push(parseFloat(String(achado[1]).replace(',', '.')) * mult)
      receitas.push(parseFloat(String(achado[2]).replace(',', '.')) * mult)
      achado = faixa.exec(p)
    }
    const isolados =
      p.match(/(\d+(?:[.,]\d+)?)\s*(milhoes|milhao|m\b|bilhao|bilhoes|bi\b|b\b)/g) || []
    for (let i = 0; i < isolados.length; i++) {
      const par = isolados[i].match(
        /(\d+(?:[.,]\d+)?)\s*(milhoes|milhao|m\b|bilhao|bilhoes|bi\b|b\b)/,
      )
      if (!par) continue
      receitas.push(parseFloat(String(par[1]).replace(',', '.')) * multiplicadorDe(par[2]))
    }
    const consulta = { page: 1, per_page: 25, organization_locations: ['Brazil'] }
    if (etiquetas.length > 0) consulta.q_organization_keyword_tags = etiquetas
    if (receitas.length > 0) {
      let menor = receitas[0]
      let maior = receitas[0]
      for (let i = 1; i < receitas.length; i++) {
        if (receitas[i] < menor) menor = receitas[i]
        if (receitas[i] > maior) maior = receitas[i]
      }
      // "R$ 200 milhões ou mais" e "acima de R$ 50 milhões": só o piso, sem teto.
      if (menor === maior) {
        consulta.revenue_range = { min: Math.round(menor) }
      } else {
        consulta.revenue_range = { min: Math.round(menor), max: Math.round(maior) }
      }
      consulta.organization_num_employees_ranges = undefined
    } else {
      // Sem receita no perfil: usa a faixa de funcionários. Primeiro tenta o tamanho de equipe
      // escrito no perfil ("equipe de 15 a 300 pessoas"); senão, o texto do porte.
      const faixas = []
      if (/pessoa|representante|funcionari|vendedor|colaborador/.test(p)) {
        const equipe = /(\d+)\s*(?:a|e|ate|-)\s*(\d+)/.exec(p)
        if (equipe) {
          const de = parseInt(equipe[1], 10)
          const ate = parseInt(equipe[2], 10)
          if (de <= 10) faixas.push('1,10')
          if (de <= 50) faixas.push('11,50')
          if (ate >= 50) faixas.push('51,200')
          if (ate >= 200) faixas.push('201,500')
          if (ate >= 1000) faixas.push('501,1000')
        }
      }
      if (faixas.length === 0) {
        if (/micro|pequen/.test(p)) faixas.push('1,10')
        if (/pequen|medi|medio/.test(p)) faixas.push('11,50')
        if (/medi|medio/.test(p)) faixas.push('51,200')
        if (/medi|medio|grande/.test(p)) faixas.push('201,500')
        if (/grande/.test(p)) faixas.push('501,1000')
      }
      if (faixas.length > 0) consulta.organization_num_employees_ranges = faixas
    }
    try {
      const res = $http.send({
        url: 'https://api.apollo.io/v1/organizations/search',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': chaveApollo },
        body: JSON.stringify(consulta),
        timeout: 20,
      })
      cotaApollo = 1
      if (res.statusCode === 401) {
        erroApollo = 'chave inválida'
        falhasApollo = 1
      } else if (res.statusCode === 429) {
        erroApollo = 'cota esgotada'
        falhasApollo = 1
      } else if (res.statusCode >= 400) {
        erroApollo = 'fonte fora do ar (' + res.statusCode + ')'
        falhasApollo = 1
      } else {
        const dados = res.json || {}
        const orgs = dados.organizations || dados.accounts || []
        for (let i = 0; i < orgs.length; i++) {
          const org = orgs[i] || {}
          const nome = String(org.name || '').trim()
          if (!nome) continue
          candApollo.push({
            empresa: nome,
            dominio: String(org.primary_domain || org.website_url || ''),
            cnpj: '',
            fontes: ['apollo'],
          })
        }
      }
    } catch (_err) {
      erroApollo = 'fonte fora do ar'
      falhasApollo = 1
    }
  } else {
    // Simulador previsto na SPEC enquanto CL-010 não chega.
    const simulado = [
      { name: 'Laboratorios Aurora Cosmeticos Ltda', primary_domain: 'aurora-cosmeticos.com.br' },
      { name: 'Bella Pele Industria e Comercio SA', primary_domain: 'bellapele.com.br' },
      { name: 'VitaForm Manipulacao Ltda', primary_domain: 'vitaform.com.br' },
    ]
    for (let i = 0; i < simulado.length; i++) {
      candApollo.push({
        empresa: simulado[i].name,
        dominio: simulado[i].primary_domain,
        cnpj: '',
        fontes: ['apollo_simulado'],
      })
    }
  }
  resumos.push({
    fonte: chaveApollo ? 'apollo' : 'apollo_simulado',
    encontradas: candApollo.length,
    falhas: falhasApollo,
    cota: cotaApollo,
    erro: erroApollo,
    inicio: inicioApollo,
  })

  // ---------- Fonte 2: Anvisa (dados abertos) ----------
  const inicioAnvisa = new Date().toISOString()
  let candAnvisa = []
  let falhasAnvisa = 0
  let erroAnvisa = ''
  try {
    const res = $http.send({
      url: 'https://dados.anvisa.gov.br/dados/TA_COSMETICO_PRODUTO_REGULARIZADO.CSV',
      method: 'GET',
      timeout: 20,
    })
    if (res.statusCode >= 400) {
      erroAnvisa = 'fonte fora do ar (' + res.statusCode + ')'
      falhasAnvisa = 1
    } else {
      let texto = ''
      try {
        texto = new TextDecoder().decode(res.body)
      } catch (_e) {
        texto = ''
      }
      const linhas = texto.split('\n')
      if (linhas.length < 2 || (texto.indexOf(';') < 0 && texto.indexOf(',') < 0)) {
        erroAnvisa = 'arquivo fora do formato'
        falhasAnvisa = 1
      } else {
        const vistos = {}
        for (let i = 1; i < linhas.length && candAnvisa.length < 10; i++) {
          const partes = linhas[i].split(';')
          if (partes.length < 3) continue
          const razao = String(partes[1] || '')
            .replace(/"/g, '')
            .trim()
          const cnpjBruto = String(partes[2] || '')
            .replace(/"/g, '')
            .replace(/[^0-9]/g, '')
          if (!razao || razao.length < 4) continue
          const chaveLocal = cnpjBruto || razao.toLowerCase()
          if (vistos[chaveLocal]) continue
          vistos[chaveLocal] = true
          candAnvisa.push({
            empresa: razao,
            dominio: '',
            cnpj: cnpjBruto.length === 14 ? cnpjBruto : '',
            fontes: ['anvisa'],
          })
        }
      }
    }
  } catch (_err) {
    erroAnvisa = 'fonte fora do ar'
    falhasAnvisa = 1
  }
  resumos.push({
    fonte: 'anvisa',
    encontradas: candAnvisa.length,
    falhas: falhasAnvisa,
    cota: 0,
    erro: erroAnvisa,
    inicio: inicioAnvisa,
  })

  // ---------- Juntar sem duplicar e gravar ----------
  const candidatos = candApollo.concat(candAnvisa)
  const porChave = {}
  for (let i = 0; i < candidatos.length; i++) {
    const c = candidatos[i]
    const chave = normalizarChave(c.cnpj, c.dominio, c.empresa)
    if (porChave[chave]) {
      for (let f = 0; f < c.fontes.length; f++) {
        const fonte = c.fontes[f]
        if (porChave[chave].fontes.indexOf(fonte) < 0) porChave[chave].fontes.push(fonte)
      }
    } else {
      porChave[chave] = {
        empresa: c.empresa,
        cnpj: c.cnpj,
        dominio: c.dominio,
        fontes: c.fontes.slice(),
        chave: chave,
      }
    }
  }

  const colecaoContas = $app.findCollectionByNameOrId('contas')
  const colecaoBuscas = $app.findCollectionByNameOrId('buscas')
  let novas = 0
  let repetidas = 0
  const inicioFim = new Date().toISOString()

  const chaves = Object.keys(porChave)
  for (let i = 0; i < chaves.length; i++) {
    const cand = porChave[chaves[i]]
    let existente = null
    try {
      existente = $app.findFirstRecordByData('contas', 'chave', cand.chave)
      if (existente.getString('cliente') !== clienteId) existente = null
    } catch (_) {
      existente = null
    }
    if (existente) {
      repetidas++
      const fontesAtuais = (function () {
        try {
          const v = JSON.parse(existente.getString('fontes') || '[]')
          return v == null ? [] : v
        } catch (_) {
          return []
        }
      })()
      let mudou = false
      for (let f = 0; f < cand.fontes.length; f++) {
        if (fontesAtuais.indexOf(cand.fontes[f]) < 0) {
          fontesAtuais.push(cand.fontes[f])
          mudou = true
        }
      }
      if (mudou) {
        existente.set('fontes', JSON.stringify(fontesAtuais))
        $app.save(existente)
      }
      continue
    }

    const registro = new Record(colecaoContas)
    registro.set('cliente', clienteId)
    registro.set('empresa', cand.empresa)
    registro.set('chave', cand.chave)
    registro.set('cnpj', cand.cnpj)
    registro.set('dominio', cand.dominio)
    registro.set('fontes', JSON.stringify(cand.fontes))
    registro.set('perfil_versao', perfilVersao)
    registro.set('etapa', 'nova')
    registro.set('situacao_triagem', 'pendente_dados')
    registro.set('origem_carga', gatilho)
    $app.save(registro)
    novas++
  }

  for (let r = 0; r < resumos.length; r++) {
    const resumo = resumos[r]
    const busca = new Record(colecaoBuscas)
    busca.set('cliente', clienteId)
    busca.set('perfil_versao', perfilVersao)
    busca.set('gatilho', gatilho)
    busca.set('fonte', resumo.fonte)
    busca.set('encontradas', resumo.encontradas)
    busca.set('novas', novas)
    busca.set('repetidas', repetidas)
    busca.set('falhas', resumo.falhas)
    busca.set('cota_usada', resumo.cota)
    busca.set('inicio', resumo.inicio)
    busca.set('fim', inicioFim)
    busca.set('erro', resumo.erro)
    $app.save(busca)
  }

  return e.json(200, { novas: novas, repetidas: repetidas, fontes: resumos })
})

// Importa a planilha do José (CL-004) pelo mesmo caminho de gravação.
routerAdd('POST', '/backend/v1/contas/planilha', (e) => {
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
  const clienteId = String(corpo.cliente || '').trim()
  const linhas = corpo.linhas || []
  if (!clienteId) throw new BadRequestError('Informe a carteira.')
  try {
    $app.findRecordById('clientes_atendidos', clienteId)
  } catch (_) {
    throw new BadRequestError('Carteira não encontrada.')
  }

  const colecaoContas = $app.findCollectionByNameOrId('contas')
  let novas = 0
  let repetidas = 0
  const erros = []

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i] || {}
    const empresa = String(linha.empresa || '').trim()
    if (!empresa) {
      erros.push({ linha: i + 1, motivo: 'empresa vazia' })
      continue
    }
    const digitos = String(linha.cnpj || '').replace(/[^0-9]/g, '')
    if (linha.cnpj && digitos.length !== 14) {
      erros.push({ linha: i + 1, motivo: 'CNPJ inválido' })
      continue
    }
    const dominio = String(linha.site || '').trim()
    const chave =
      digitos ||
      (dominio
        ? 'dominio:' +
          dominio
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .split('/')[0]
        : 'nome:' + empresa.toLowerCase().replace(/\s+/g, ' '))

    let existente = null
    try {
      existente = $app.findFirstRecordByData('contas', 'chave', chave)
      if (existente && existente.getString('cliente') !== clienteId) existente = null
    } catch (_) {
      existente = null
    }
    if (existente) {
      repetidas++
      continue
    }

    const registro = new Record(colecaoContas)
    registro.set('cliente', clienteId)
    registro.set('empresa', empresa)
    registro.set('chave', chave)
    registro.set('cnpj', digitos)
    registro.set('dominio', dominio)
    registro.set('fontes', JSON.stringify(['planilha']))
    registro.set('municipio', String(linha.cidade || ''))
    registro.set(
      'uf',
      String(linha.uf || '')
        .toUpperCase()
        .slice(0, 2),
    )
    registro.set('etapa', 'nova')
    registro.set('situacao_triagem', 'pendente_dados')
    registro.set('origem_carga', 'planilha')
    $app.save(registro)
    novas++
  }

  return e.json(200, { novas: novas, repetidas: repetidas, erros: erros })
})

// Lista as contas de uma carteira, por aba (RN-05: a carteira vem no pedido).
routerAdd('GET', '/backend/v1/contas', (e) => {
  if (!e.hasSuperuserAuth()) {
    const email = e.auth ? String(e.auth.getString('email') || '').toLowerCase() : ''
    if (!email) throw new ForbiddenError('Acesso não liberado.')
    try {
      $app.findFirstRecordByFilter('acessos', 'email = {:email} && ativo = true', { email: email })
    } catch (_) {
      throw new ForbiddenError('Acesso não liberado.')
    }
  }

  const cliente = String(e.request.url.query().get('cliente') || '').trim()
  const aba = String(e.request.url.query().get('aba') || '').trim()
  if (!cliente) throw new BadRequestError('Informe a carteira.')

  let filtro = 'cliente = {:c}'
  if (aba === 'prioridade') filtro += ' && situacao_triagem = "prioridade"'
  else if (aba === 'fora_do_perfil') filtro += ' && situacao_triagem = "fora_do_perfil"'
  else if (aba === 'pendentes') filtro += ' && situacao_triagem = "pendente_dados"'

  const registros = $app.findRecordsByFilter('contas', filtro, '-nota,-created', 100, 0, {
    c: cliente,
  })

  const itens = []
  for (let i = 0; i < registros.length; i++) {
    const r = registros[i]
    const ler = (campo) => {
      const bruto = r.getString(campo)
      if (!bruto) return []
      try {
        const v = JSON.parse(bruto)
        return v == null ? [] : v
      } catch (_) {
        return []
      }
    }
    itens.push({
      id: r.id,
      empresa: r.getString('empresa'),
      cnpj: r.getString('cnpj'),
      dominio: r.getString('dominio'),
      fontes: ler('fontes'),
      porte: r.getString('porte'),
      cnae: r.getString('cnae'),
      situacao: r.getString('situacao'),
      municipio: r.getString('municipio'),
      uf: r.getString('uf'),
      consultado_em: r.getString('consultado_em'),
      nota: r.getInt('nota'),
      faixa: r.getString('faixa'),
      motivos: ler('motivos'),
      situacao_triagem: r.getString('situacao_triagem'),
      perfil_versao: r.getInt('perfil_versao'),
      created: r.getString('created'),
    })
  }
  return e.json(200, { items: itens })
})

// Uma conta pelo id (ficha da conta).
routerAdd('GET', '/backend/v1/contas/{id}', (e) => {
  if (!e.hasSuperuserAuth()) {
    const email = e.auth ? String(e.auth.getString('email') || '').toLowerCase() : ''
    if (!email) throw new ForbiddenError('Acesso não liberado.')
    try {
      $app.findFirstRecordByFilter('acessos', 'email = {:email} && ativo = true', { email: email })
    } catch (_) {
      throw new ForbiddenError('Acesso não liberado.')
    }
  }
  const id = String(e.request.pathValue('id') || '').trim()
  let r
  try {
    r = $app.findRecordById('contas', id)
  } catch (_) {
    throw new NotFoundError('Conta não encontrada.')
  }
  const ler = (campo) => {
    const bruto = r.getString(campo)
    if (!bruto) return []
    try {
      const v = JSON.parse(bruto)
      return v == null ? [] : v
    } catch (_) {
      return []
    }
  }
  return e.json(200, {
    conta: {
      id: r.id,
      empresa: r.getString('empresa'),
      cnpj: r.getString('cnpj'),
      dominio: r.getString('dominio'),
      fontes: ler('fontes'),
      porte: r.getString('porte'),
      cnae: r.getString('cnae'),
      situacao: r.getString('situacao'),
      municipio: r.getString('municipio'),
      uf: r.getString('uf'),
      consultado_em: r.getString('consultado_em'),
      nota: r.getInt('nota'),
      faixa: r.getString('faixa'),
      motivos: ler('motivos'),
      situacao_triagem: r.getString('situacao_triagem'),
      perfil_versao: r.getInt('perfil_versao'),
      created: r.getString('created'),
    },
  })
})

// Histórico das buscas da carteira.
routerAdd('GET', '/backend/v1/contas/buscas', (e) => {
  if (!e.hasSuperuserAuth()) {
    const email = e.auth ? String(e.auth.getString('email') || '').toLowerCase() : ''
    if (!email) throw new ForbiddenError('Acesso não liberado.')
    try {
      $app.findFirstRecordByFilter('acessos', 'email = {:email} && ativo = true', { email: email })
    } catch (_) {
      throw new ForbiddenError('Acesso não liberado.')
    }
  }
  const cliente = String(e.request.url.query().get('cliente') || '').trim()
  if (!cliente) throw new BadRequestError('Informe a carteira.')
  const registros = $app.findRecordsByFilter('buscas', 'cliente = {:c}', '-created', 50, 0, {
    c: cliente,
  })
  const itens = []
  for (let i = 0; i < registros.length; i++) {
    const r = registros[i]
    itens.push({
      id: r.id,
      fonte: r.getString('fonte'),
      gatilho: r.getString('gatilho'),
      encontradas: r.getInt('encontradas'),
      novas: r.getInt('novas'),
      repetidas: r.getInt('repetidas'),
      falhas: r.getInt('falhas'),
      cota_usada: r.getInt('cota_usada'),
      erro: r.getString('erro'),
      fim: r.getString('fim'),
      created: r.getString('created'),
    })
  }
  return e.json(200, { items: itens })
})
