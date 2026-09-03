import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, MailX, CheckCircle2, XCircle } from 'lucide-react'

export default function Unsubscribe() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('Link inválido — falta o token de descadastro.')
      return
    }

    supabase.functions
      .invoke('unsubscribe', { body: { token } })
      .then(({ data, error }) => {
        if (error || data?.error) {
          setStatus('error')
          setErrorMsg(data?.error || error?.message || 'Não foi possível processar o descadastro.')
        } else {
          setStatus('success')
        }
      })
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err.message)
      })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-card text-center">
        <CardHeader>
          <CardTitle className="text-xl">TROMOT PRO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Processando seu descadastro...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="w-10 h-10 mx-auto text-green-600" />
              <p>Você não vai mais receber emails de novidade de produto da TROMOT.</p>
              <p className="text-sm text-muted-foreground">
                Mudou de ideia? Você pode reativar a qualquer momento no seu perfil dentro do app.
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="w-10 h-10 mx-auto text-destructive" />
              <p className="text-destructive">{errorMsg}</p>
            </>
          )}
          <Button variant="outline" className="w-full mt-2" asChild>
            <Link to="/">
              <MailX className="w-4 h-4 mr-2" />
              Voltar para o app
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
