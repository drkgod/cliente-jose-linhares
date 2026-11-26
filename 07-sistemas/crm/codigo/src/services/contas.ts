import type { RecordModel } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export type Faixa = 'A' | 'B' | 'C'
export type SituacaoTriagem = 'prioridade' | 'em_avaliacao' | 'fora_do_perfil' | 'pendente_dados'
export type AbaContas = 'prioridade' | 'em_avaliacao' | 'fora_do_perfil' | 'pendentes'

export interface Motivo {
  regra: string
  pontos: number
}

export interface Conta {
  id: string
  empresa: string
  cnpj?: string
  dominio?: string
  fontes?: string[]
  porte?: string
  cnae?: string
  situacao?: string
  municipio?: string
  uf?: string
  consultado_em?: string
  nota?: number
  faixa?: Faixa
  motivos?: Motivo[]
  situacao_triagem?: SituacaoTriagem
  perfil_versao?: number
  created: string
}

export interface Busca extends RecordModel {
  fonte: string
  gatilho: string
  encontradas: number
  novas: number
  repetidas: number
  falhas: number
  cota_usada: number
  erro?: string
  fim?: string
  created: string
}

export interface ResultadoBusca {
  novas: number
  repetidas: number
  fontes: Array<{ fonte: string; encontradas: number; falhas: number; erro?: string }>
}

export interface LinhaPlanilha {
  empresa: string
  cnpj?: string
  cidade?: string
  uf?: string
  site?: string
  observacao?: string
}

export async function listarContas(cliente: string, aba?: AbaContas): Promise<Conta[]> {
  const parametros = new URLSearchParams({ cliente })
  if (aba) parametros.set('aba', aba)
  const resposta = await pb.send<{ items: Conta[] }>(`/backend/v1/contas?${parametros}`, {
    method: 'GET',
  })
  return resposta.items ?? []
}

export async function obterConta(id: string): Promise<Conta> {
  const resposta = await pb.send<{ conta: Conta }>(`/backend/v1/contas/${encodeURIComponent(id)}`, {
    method: 'GET',
  })
  return resposta.conta
}

export async function buscarAgora(cliente: string): Promise<ResultadoBusca> {
  return pb.send<ResultadoBusca>('/backend/v1/contas/buscar', {
    method: 'POST',
    body: JSON.stringify({ cliente, gatilho: 'botao' }),
  })
}

export async function importarPlanilha(
  cliente: string,
  linhas: LinhaPlanilha[],
): Promise<{ novas: number; repetidas: number; erros: Array<{ linha: number; motivo: string }> }> {
  return pb.send('/backend/v1/contas/planilha', {
    method: 'POST',
    body: JSON.stringify({ cliente, linhas }),
  })
}

export async function listarBuscas(cliente: string): Promise<Busca[]> {
  const resposta = await pb.send<{ items: Busca[] }>(
    `/backend/v1/contas/buscas?cliente=${encodeURIComponent(cliente)}`,
    { method: 'GET' },
  )
  return resposta.items ?? []
}
