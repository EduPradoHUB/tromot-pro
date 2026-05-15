import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useBling } from '@/hooks/useBling'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Search, UserCheck, Package, Plus, Minus, Trash2,
  ShoppingCart, Send, ChevronDown, X, Loader2
} from 'lucide-react'

interface Cliente { id?: string; bling_id: number; nome: string; documento?: string; cidade?: string; uf?: string }
interface Produto { id: number; nome: string; codigo?: string; preco: number; estoque?: number; unidade?: string }
interface ItemPedido { produto: Produto; quantidade: number; desconto: number; valorUnitario: number }

const MAX_DESCONTO = 10 // % maximo permitido (futuro: vir do perfil do vendedor)

export default function NovoPedido() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { buscarClientesBling, buscarClientesLocais, buscarProdutos, criarPedido } = useBling()

  // Cliente
  const [buscaCliente, setBuscaCliente] = useState('')
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [buscandoCliente, setBuscandoCliente] = useState(false)

  // Produtos
  const [buscaProduto, setBuscaProduto] = useState('')
  const [produtosEncontrados, setProdutosEncontrados] = useState<Produto[]>([])
  const [buscandoProduto, setBuscandoProduto] = useState(false)
  const [mostrarProdutos, setMostrarProdutos] = useState(false)

  // Carrinho
  const [itens, setItens] = useState<ItemPedido[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Busca cliente com debounce
  useEffect(() => {
    if (buscaCliente.length < 2) { setClientesEncontrados([]); return }
    const t = setTimeout(async () => {
      setBuscandoCliente(true)
      try {
        // Primeiro busca no cache local
        const locais = await buscarClientesLocais(buscaCliente)
        if (locais.length > 0) {
          setClientesEncontrados(locais)
        } else {
          // Fallback: busca ao vivo no Bling
          const vivos = await buscarClientesBling(buscaCliente)
          setClientesEncontrados(vivos)
        }
      } catch { setClientesEncontrados([]) }
      finally { setBuscandoCliente(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [buscaCliente])

  // Busca produto com debounce
  useEffect(() => {
    if (buscaProduto.length < 2) { setProdutosEncontrados([]); return }
    const t = setTimeout(async () => {
      setBuscandoProduto(true)
      try {
        const prods = await buscarProdutos(buscaProduto)
        setProdutosEncontrados(prods.map((p: any) => ({
          id: p.id,
          nome: p.nome,
          codigo: p.codigo,
          preco: p.preco || 0,
          unidade: p.unidade || 'UN',
        })))
        setMostrarProdutos(true)
      } catch { setProdutosEncontrados([]) }
      finally { setBuscandoProduto(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [buscaProduto])

  function adicionarProduto(produto: Produto) {
    setItens(prev => {
      const existente = prev.findIndex(i => i.produto.id === produto.id)
      if (existente >= 0) {
        const novo = [...prev]
        novo[existente].quantidade += 1
        return novo
      }
      return [...prev, { produto, quantidade: 1, desconto: 0, valorUnitario: produto.preco }]
    })
    setBuscaProduto('')
    setProdutosEncontrados([])
    setMostrarProdutos(false)
  }

  function atualizarQuantidade(idx: number, delta: number) {
    setItens(prev => {
      const novo = [...prev]
      novo[idx].quantidade = Math.max(1, novo[idx].quantidade + delta)
      return novo
    })
  }

  function atualizarDesconto(idx: number, valor: string) {
    const desc = Math.min(MAX_DESCONTO, Math.max(0, parseFloat(valor) || 0))
    setItens(prev => {
      const novo = [...prev]
      novo[idx].desconto = desc
      return novo
    })
  }

  function removerItem(idx: number) {
    setItens(prev => prev.filter((_, i) => i !== idx))
  }

  function calcularTotal() {
    return itens.reduce((acc, item) => {
      const valor = item.valorUnitario * item.quantidade * (1 - item.desconto / 100)
      return acc + valor
    }, 0)
  }

  async function enviarPedido() {
    if (!clienteSelecionado) { toast({ title: 'Selecione um cliente', variant: 'destructive' }); return }
    if (itens.length === 0) { toast({ title: 'Adicione produtos ao pedido', variant: 'destructive' }); return }

    setEnviando(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Envia ao Bling
      const resultado = await criarPedido({
        clienteBlingId: clienteSelecionado.bling_id,
        itens: itens.map(i => ({
          produtoBlingId: i.produto.id,
          quantidade: i.quantidade,
          valor: i.valorUnitario,
          desconto: i.desconto,
        })),
        observacoes,
        vendedorNome: user?.email || '',
      })

      // Salva localmente para relatório de comissão
      await (supabase as any).from('pedidos').insert({
        bling_id: resultado?.data?.id || null,
        vendedor_id: user?.id,
        cliente_bling_id: clienteSelecionado.bling_id,
        cliente_nome: clienteSelecionado.nome,
        valor_total: calcularTotal(),
        observacoes,
        status: 'enviado',
        itens_json: JSON.stringify(itens),
      })

      toast({ title: 'Pedido enviado com sucesso!', description: 'Registrado no Bling.' })
      navigate('/pedidos')
    } catch (err: any) {
      toast({ title: 'Erro ao enviar pedido', description: err.message, variant: 'destructive' })
    } finally {
      setEnviando(false)
    }
  }

  const total = calcularTotal()

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Novo Pedido</h1>
        <Badge className="bg-gray-800 text-gray-300">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</Badge>
      </div>

      {/* CLIENTE */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-red-400" /> Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clienteSelecionado ? (
            <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
              <div>
                <p className="text-white font-medium">{clienteSelecionado.nome}</p>
                <p className="text-gray-400 text-xs">{clienteSelecionado.documento} {clienteSelecionado.cidade ? '· ' + clienteSelecionado.cidade + '/' + clienteSelecionado.uf : ''}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setClienteSelecionado(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente por nome ou CNPJ..."
                  value={buscaCliente}
                  onChange={e => setBuscaCliente(e.target.value)}
                  className="pl-9 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                />
                {buscandoCliente && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
              </div>
              {clientesEncontrados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {clientesEncontrados.map(c => (
                    <button key={c.bling_id} onClick={() => { setClienteSelecionado(c); setBuscaCliente(''); setClientesEncontrados([]) }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-700 border-b border-gray-700 last:border-0">
                      <p className="text-white text-sm font-medium">{c.nome}</p>
                      <p className="text-gray-400 text-xs">{c.documento} {c.cidade ? '· ' + c.cidade : ''}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PRODUTOS */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-red-400" /> Produtos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar produto por nome ou código..."
                value={buscaProduto}
                onChange={e => setBuscaProduto(e.target.value)}
                className="pl-9 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
              />
              {buscandoProduto && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
            </div>
            {mostrarProdutos && produtosEncontrados.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {produtosEncontrados.map(p => (
                  <button key={p.id} onClick={() => adicionarProduto(p)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-700 border-b border-gray-700 last:border-0 flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm font-medium">{p.nome}</p>
                      <p className="text-gray-400 text-xs">{p.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 text-sm font-medium">
                        {p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Itens do carrinho */}
          {itens.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nenhum produto adicionado
            </div>
          ) : (
            <div className="space-y-2">
              {itens.map((item, idx) => (
                <div key={item.produto.id} className="bg-gray-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.produto.nome}</p>
                      <p className="text-gray-400 text-xs">
                        {item.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {item.produto.unidade || 'UN'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removerItem(idx)} className="text-gray-500 hover:text-red-400 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Quantidade */}
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7 border-gray-600" onClick={() => atualizarQuantidade(idx, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-white w-8 text-center text-sm">{item.quantidade}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7 border-gray-600" onClick={() => atualizarQuantidade(idx, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    {/* Desconto */}
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-xs">Desc.</span>
                      <Input
                        type="number" min="0" max={MAX_DESCONTO} step="0.5"
                        value={item.desconto}
                        onChange={e => atualizarDesconto(idx, e.target.value)}
                        className="h-7 w-16 bg-gray-700 border-gray-600 text-white text-xs text-center px-1"
                      />
                      <span className="text-gray-400 text-xs">%</span>
                    </div>
                    {/* Subtotal */}
                    <div className="ml-auto">
                      <p className="text-green-400 text-sm font-medium">
                        {(item.valorUnitario * item.quantidade * (1 - item.desconto / 100))
                          .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* OBSERVACOES + TOTAL */}
      {itens.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-4 space-y-3">
            <Input
              placeholder="Observações do pedido (opcional)"
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
            />
            <div className="flex items-center justify-between pt-2 border-t border-gray-700">
              <span className="text-gray-400">Total do pedido</span>
              <span className="text-2xl font-bold text-white">
                {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BOTAO ENVIAR */}
      <Button
        onClick={enviarPedido}
        disabled={enviando || !clienteSelecionado || itens.length === 0}
        className="w-full bg-red-700 hover:bg-red-800 text-white h-12 text-base font-semibold gap-2"
      >
        {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        {enviando ? 'Enviando ao Bling...' : 'Enviar Pedido'}
      </Button>
    </div>
  )
}
