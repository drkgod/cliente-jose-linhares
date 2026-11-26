import { useCallback, useEffect, useState } from 'react'
import { History, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TelaContas } from '@/components/contas/TelaContas'
import { formatarDataHora } from '@/lib/formatos'
import { mensagemDeErro } from '@/lib/mensagens-erro'
import { listarClientes, type ClienteAtendido } from '@/services/clientesAtendidos'
import {
  buscarAgora,
  listarBuscas,
  listarContas,
  type AbaContas,
  type Busca,
  type Conta,
} from '@/services/contas'

const ABAS: Array<{ valor: AbaContas; rotulo: string }> = [
  { valor: 'prioridade', rotulo: 'Prioridade' },
  { valor: 'em_avaliacao', rotulo: 'Em avaliação' },
  { valor: 'fora_do_perfil', rotulo: 'Fora do perfil' },
  { valor: 'pendentes', rotulo: 'Pendentes' },
]

const VAZIOS: Record<string, { titulo: string; descricao: string }> = {
  prioridade: {
    titulo: 'Nenhuma conta na prioridade',
    descricao:
      'A busca roda ao aprovar o perfil ideal e toda segunda. Use "Buscar agora" para rodar na hora.',
  },
  em_avaliacao: {
    titulo: 'Nenhuma conta em avaliação',
    descricao:
      'Contas que pontuaram mas ficaram abaixo de 70 (a regra do perfil) aparecem aqui, com nota e motivo, sem entrar na fila ativa.',
  },
  fora_do_perfil: {
    titulo: 'Nenhuma conta fora do perfil',
    descricao: 'Contas com CNPJ inativo ou com exclusão do perfil aparecem aqui.',
  },
  pendentes: {
    titulo: 'Nenhuma conta pendente',
    descricao: 'Contas sem CNPJ ou sem retorno da consulta ficam aqui, sem serem descartadas.',
  },
}

export default function Contas() {
  const [clientes, setClientes] = useState<ClienteAtendido[]>([])
  const [clienteId, setClienteId] = useState('')
  const [aba, setAba] = useState<AbaContas>('prioridade')
  const [porAba, setPorAba] = useState<Record<string, Conta[]>>({})
  const [carregando, setCarregando] = useState(true)
  const [emBusca, setEmBusca] = useState(false)
  const [erro, setErro] = useState('')
  const [buscas, setBuscas] = useState<Busca[]>([])
  const [historicoAberto, setHistoricoAberto] = useState(false)

  useEffect(() => {
    listarClientes(1, 50)
      .then((pagina) => {
        setClientes(pagina.items)
        if (pagina.items.length > 0) setClienteId(pagina.items[0].id)
        else setCarregando(false)
      })
      .catch((e) => {
        setErro(mensagemDeErro(e, 'carregar os clientes'))
        setCarregando(false)
      })
  }, [])

  const carregar = useCallback(async () => {
    if (!clienteId) return
    setCarregando(true)
    try {
      const resultados = []
      for (const item of ABAS) {
        resultados.push({ valor: item.valor, itens: await listarContas(clienteId, item.valor) })
      }
      const mapa: Record<string, Conta[]> = {}
      for (const resultado of resultados) mapa[resultado.valor] = resultado.itens
      setPorAba(mapa)
      setErro('')
    } catch (e) {
      setErro(mensagemDeErro(e, 'carregar as contas'))
    } finally {
      setCarregando(false)
    }
  }, [clienteId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const buscar = async () => {
    if (!clienteId) return
    setEmBusca(true)
    try {
      const resultado = await buscarAgora(clienteId)
      toast.success(
        resultado.novas > 0
          ? `${resultado.novas} conta(s) nova(s). ${resultado.repetidas} já existiam.`
          : 'Busca concluída: nenhuma conta nova.',
      )
      await carregar()
    } catch (e) {
      toast.error(mensagemDeErro(e, 'buscar as contas'))
    } finally {
      setEmBusca(false)
    }
  }

  const abrirHistorico = async () => {
    if (!clienteId) return
    setHistoricoAberto(true)
    try {
      setBuscas(await listarBuscas(clienteId))
    } catch (e) {
      toast.error(mensagemDeErro(e, 'carregar o histórico'))
    }
  }

  const totalPrioridade = porAba.prioridade?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contas</h1>
          <p className="text-sm text-muted-foreground">
            {totalPrioridade === 1
              ? '1 conta na prioridade'
              : `${totalPrioridade} contas na prioridade`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {clientes.length > 1 ? (
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger className="w-56" aria-label="Cliente atendido">
                <SelectValue placeholder="Escolha o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Sheet open={historicoAberto} onOpenChange={setHistoricoAberto}>
            <SheetTrigger asChild>
              <Button variant="outline" onClick={() => void abrirHistorico()}>
                <History className="h-4 w-4" aria-hidden="true" />
                Histórico
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Histórico das buscas</SheetTitle>
                <SheetDescription>Cada fonte de cada execução, com o que falhou.</SheetDescription>
              </SheetHeader>
              <ul className="mt-4 space-y-3">
                {buscas.length === 0 ? (
                  <li className="text-sm text-muted-foreground">Nenhuma busca registrada ainda.</li>
                ) : null}
                {buscas.map((busca) => (
                  <li key={busca.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{busca.fonte}</span>
                      <Badge variant={busca.falhas > 0 ? 'destructive' : 'secondary'}>
                        {busca.falhas > 0 ? 'com falha' : 'ok'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatarDataHora(busca.created)} · {busca.gatilho} · encontradas{' '}
                      {busca.encontradas} · novas {busca.novas} · repetidas {busca.repetidas}
                    </p>
                    {busca.erro ? (
                      <p className="mt-1 text-xs text-destructive">{busca.erro}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
          <Button onClick={() => void buscar()} disabled={emBusca || !clienteId}>
            {emBusca ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            {emBusca ? 'Buscando…' : 'Buscar agora'}
          </Button>
        </div>
      </div>

      {clientes.length === 0 && !carregando ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Cadastre um cliente atendido e aprove o perfil ideal para o sistema buscar contas.
          </p>
        </div>
      ) : (
        <Tabs value={aba} onValueChange={(valor) => setAba(valor as AbaContas)}>
          <TabsList>
            {ABAS.map((item) => (
              <TabsTrigger key={item.valor} value={item.valor}>
                {item.rotulo}
                <span className="ml-2 text-xs text-muted-foreground">
                  {porAba[item.valor]?.length ?? 0}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {ABAS.map((item) => (
            <TabsContent key={item.valor} value={item.valor} className="mt-4">
              <TelaContas
                itens={porAba[item.valor] ?? []}
                emBusca={emBusca}
                aoBuscar={() => void buscar()}
                carregando={carregando}
                erro={erro}
                aoTentarDeNovo={() => void carregar()}
                vazio={VAZIOS[item.valor]}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
