import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, RefreshCw, Link, Users } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export default function BlingConfig() {
  const { toast } = useToast()
  const [status, setStatus] = useState<'loading' | 'conectado' | 'desconectado'>('loading')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const [totalClientes, setTotalClientes] = useState<number | null>(null)

  useEffect(() => {
    verificarConexao()
    contarClientes()
  }, [])

  async function verificarConexao() {
    const { data } = await (supabase as any)
      .from('bling_tokens')
      .select('expires_at')
      .eq('id', 1)
      .single()

    if (data?.expires_at) {
      setStatus('conectado')
      setExpiresAt(data.expires_at)
    } else {
      setStatus('desconectado')
    }
  }

  async function contarClientes() {
    const { count } = await (supabase as any)
      .from('clientes')
      .select('*', { count: 'exact', head: true })
    setTotalClientes(count || 0)
  }

  function iniciarAutorizacao() {
    const clientId = import.meta.env.VITE_BLING_CLIENT_ID
    if (!clientId) {
      toast({ title: 'Erro', description: 'VITE_BLING_CLIENT_ID nao configurado.', variant: 'destructive' })
      return
    }
    const callbackUrl = SUPABASE_URL + '/functions/v1/bling-callback'
    const authUrl =
      'https://www.bling.com.br/Api/v3/oauth/authorize' +
      '?response_type=code' +
      '&client_id=' + clientId +
      '&redirect_uri=' + encodeURIComponent(callbackUrl)
    window.open(authUrl, '_blank', 'width=800,height=600')
  }

  async function sincronizarAgora() {
    setSincronizando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(SUPABASE_URL + '/functions/v1/sync-clientes-bling', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + session?.access_token },
      })
      const json = await res.json()
      if (json.success) {
        toast({ title: 'Sincronizacao concluida!', description: json.total + ' clientes importados.' })
        contarClientes()
      } else {
        throw new Error(json.error)
      }
    } catch (err: any) {
      toast({ title: 'Erro na sincronizacao', description: err.message, variant: 'destructive' })
    } finally {
      setSincronizando(false)
    }
  }

  const expirado = expiresAt ? new Date(expiresAt) < new Date() : false

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Integracao Bling</h1>
        <p className="text-gray-400 mt-1">Conecte o TROMOT PRO ao seu ERP para sincronizar clientes e enviar pedidos.</p>
      </div>

      {/* Status da Conexao */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {status === 'loading' && <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />}
            {status === 'conectado' && !expirado && <CheckCircle className="w-5 h-5 text-green-400" />}
            {(status === 'desconectado' || expirado) && <XCircle className="w-5 h-5 text-red-400" />}
            Status da Conexao
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && <p className="text-gray-400">Verificando conexao...</p>}

          {status === 'conectado' && !expirado && (
            <div className="space-y-2">
              <Badge className="bg-green-900 text-green-300">Conectado</Badge>
              <p className="text-gray-400 text-sm">
                Token valido ate: {new Date(expiresAt!).toLocaleString('pt-BR')}
              </p>
              <p className="text-gray-400 text-sm">
                O token e renovado automaticamente a cada 6 horas.
              </p>
            </div>
          )}

          {(status === 'desconectado' || expirado) && (
            <div className="space-y-3">
              <Badge variant="destructive">
                {expirado ? 'Token expirado' : 'Nao conectado'}
              </Badge>
              <p className="text-gray-400 text-sm">
                Clique em "Autorizar Bling" para conectar sua conta. Voce sera redirecionado para o Bling para autorizar o acesso.
              </p>
              <Button onClick={iniciarAutorizacao} className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Link className="w-4 h-4" />
                Autorizar Bling
              </Button>
            </div>
          )}

          {status === 'conectado' && (
            <Button variant="outline" onClick={iniciarAutorizacao} className="border-gray-600 text-gray-300 gap-2">
              <RefreshCw className="w-4 h-4" />
              Reautorizar
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Sincronizacao de Clientes */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Clientes Sincronizados
          </CardTitle>
          <CardDescription className="text-gray-400">
            Clientes importados do Bling para o TROMOT PRO
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{totalClientes ?? '...'}</p>
              <p className="text-gray-400 text-sm">clientes no banco</p>
            </div>
            <Button
              onClick={sincronizarAgora}
              disabled={sincronizando || status !== 'conectado'}
              className="bg-red-700 hover:bg-red-800 gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
              {sincronizando ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Button>
          </div>
          <p className="text-gray-500 text-xs">
            A sincronizacao automatica ocorre a cada 6 horas. Use o botao para forcar uma atualizacao imediata.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
