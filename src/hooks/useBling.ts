import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

const PROXY_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/bling-proxy'

// Funcao base: faz chamadas autenticadas ao proxy Bling
async function blingRequest(path: string, method = 'GET', payload?: unknown) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sessao expirada')

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + session.access_token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path, method, payload }),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erro na API Bling')
  return json
}

// Hook principal
export function useBling() {

  // Busca clientes ao vivo no Bling (para busca rapida/fallback)
  const buscarClientesBling = useCallback(async (pesquisa: string) => {
    if (pesquisa.length < 2) return []
    const data = await blingRequest(
      '/contatos?pesquisa=' + encodeURIComponent(pesquisa) + '&situacao=A'
    )
    return data.data || []
  }, [])

  // Busca clientes no cache local do Supabase (com vinculo ao vendedor)
  const buscarClientesLocais = useCallback(async (pesquisa: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await (supabase as any)
      .from('clientes')
      .select('*')
      .ilike('nome', '%' + pesquisa + '%')
      .order('nome')
      .limit(20)

    return data || []
  }, [])

  // Busca produtos do Bling
  const buscarProdutos = useCallback(async (pesquisa?: string) => {
    const query = pesquisa
      ? '/produtos?pesquisa=' + encodeURIComponent(pesquisa) + '&criterio=1'
      : '/produtos?criterio=1&limite=100'
    const data = await blingRequest(query)
    return data.data || []
  }, [])

  // Cria pedido de venda no Bling
  const criarPedido = useCallback(async (pedido: {
    clienteBlingId: number
    itens: Array<{
      produtoBlingId: number
      quantidade: number
      valor: number
      desconto?: number
    }>
    observacoes?: string
    vendedorNome?: string
  }) => {
    const payload = {
      contato: { id: pedido.clienteBlingId },
      itens: pedido.itens.map(item => ({
        produto: { id: item.produtoBlingId },
        quantidade: item.quantidade,
        valor: item.valor,
        desconto: item.desconto || 0,
      })),
      observacoes: pedido.observacoes || '',
      situacao: { id: 6 }, // Em aberto
    }
    return blingRequest('/pedidos/vendas', 'POST', payload)
  }, [])

  // Consulta status de um pedido
  const consultarPedido = useCallback(async (blingPedidoId: number) => {
    return blingRequest('/pedidos/vendas/' + blingPedidoId)
  }, [])

  // Lista pedidos com filtro opcional de data
  const listarPedidos = useCallback(async (dataInicio?: string, dataFim?: string) => {
    let query = '/pedidos/vendas?limite=100'
    if (dataInicio) query += '&dataInicial=' + dataInicio
    if (dataFim) query += '&dataFinal=' + dataFim
    const data = await blingRequest(query)
    return data.data || []
  }, [])

  // Consulta estoque de um produto
  const consultarEstoque = useCallback(async (produtoBlingId: number) => {
    return blingRequest('/estoques/' + produtoBlingId)
  }, [])

  return {
    buscarClientesBling,
    buscarClientesLocais,
    buscarProdutos,
    criarPedido,
    consultarPedido,
    listarPedidos,
    consultarEstoque,
  }
}
