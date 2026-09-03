// product-change-webhook
//
// Recebe o Database Webhook do Supabase (Dashboard → Database →
// Webhooks) configurado na tabela "products" para os eventos INSERT e
// UPDATE. Decide se a mudança é relevante pro cliente (produto novo,
// manual novo/atualizado, ou alteração geral), registra em
// product_notifications e, se o modo daquele tipo de evento estiver
// como "automático" (email_notification_settings), já dispara o envio.
//
// Configuração necessária:
//  1. Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL (opcional), APP_BASE_URL,
//     PRODUCT_NOTIFICATIONS_SECRET
//  2. supabase/config.toml marca esta função com verify_jwt = false
//     (quem chama é o Database Webhook do Supabase, não um usuário logado)
//  3. Dashboard → Database → Webhooks → Create a new webhook:
//       Table: products | Events: Insert, Update
//       Type: HTTP Request | URL: .../functions/v1/product-change-webhook
//       Header: x-webhook-secret: <PRODUCT_NOTIFICATIONS_SECRET>
//
// Veja ARCHITECTURE_WHATSAPP_IA.md para o passo a passo completo.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendProductNotification } from '../_shared/productEmail.ts'

// Colunas que, se mudarem, contam como "produto alterado" pro cliente.
// Mudanças em campos só-internos (rating, barcode, timestamps etc.) não
// disparam notificação.
const RELEVANT_FIELDS = ['name', 'description', 'category', 'image_url', 'compatibility', 'store_url']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const expectedSecret = Deno.env.get('PRODUCT_NOTIFICATIONS_SECRET')
    const providedSecret = req.headers.get('x-webhook-secret')
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return new Response('Não autorizado', { status: 401, headers: corsHeaders })
    }

    const payload = await req.json()
    const { type, record, old_record } = payload as {
      type: 'INSERT' | 'UPDATE' | 'DELETE'
      record: any
      old_record: any | null
    }

    if (!record || record.status !== 'active') {
      return new Response(JSON.stringify({ ignored: true, reason: 'produto não ativo' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let eventType: 'novo_produto' | 'manual_atualizado' | 'produto_alterado' | null = null

    if (type === 'INSERT') {
      eventType = 'novo_produto'
    } else if (type === 'UPDATE' && old_record) {
      if (record.manual_url && record.manual_url !== old_record.manual_url) {
        eventType = 'manual_atualizado'
      } else if (RELEVANT_FIELDS.some((f) => JSON.stringify(record[f]) !== JSON.stringify(old_record[f]))) {
        eventType = 'produto_alterado'
      }
    }

    if (!eventType) {
      return new Response(JSON.stringify({ ignored: true, reason: 'sem mudança relevante' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: settings } = await supabase
      .from('email_notification_settings')
      .select('novo_produto_modo, manual_atualizado_modo, produto_alterado_modo')
      .eq('id', true)
      .single()

    const modo =
      eventType === 'novo_produto'
        ? settings?.novo_produto_modo
        : eventType === 'manual_atualizado'
        ? settings?.manual_atualizado_modo
        : settings?.produto_alterado_modo

    const { data: notification, error } = await supabase
      .from('product_notifications')
      .insert({ event_type: eventType, product_id: record.id, status: 'pending' })
      .select()
      .single()

    if (error) throw error

    if (modo === 'automatico') {
      await sendProductNotification(supabase, notification.id)
    }

    return new Response(JSON.stringify({ success: true, event_type: eventType, modo }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erro em product-change-webhook:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
