# IA de Suporte Técnico via WhatsApp — Arquitetura

Esta é a primeira versão da IA de suporte técnico da TROMOT no WhatsApp. Ela atende instaladores e clientes, usando o catálogo de produtos, os manuais já cadastrados e uma base de conhecimento que você alimenta manualmente com sua experiência de instalação automotiva.

## Visão geral do fluxo

```
Cliente no WhatsApp
      │
      ▼
   uazapi.dev  (número de Suporte Técnico da TROMOT)
      │  webhook (mensagem recebida)
      ▼
Edge Function: whatsapp-webhook  (Supabase)
      │
      ├─ salva a mensagem em whatsapp_messages
      ├─ monta o histórico da conversa (whatsapp_conversations)
      ├─ chama a Claude API com um conjunto de ferramentas:
      │     buscar_produto, buscar_manual, buscar_base_conhecimento,
      │     buscar_distribuidor, link_de_compra, escalar_para_humano,
      │     registrar_avaliacao
      │
      ├─ cada ferramenta consulta o Supabase (produtos, manuais,
      │  knowledge_base via busca semântica/pgvector, distributors,
      │  service_ratings)
      │
      ├─ se escalar_para_humano for chamada, também manda um aviso
      │  curto pra você no WhatsApp (SUPPORT_ADMIN_WHATSAPP)
      │
      └─ envia a resposta final (texto e/ou mídia) de volta via uazapi
```

## Como a IA conversa (objetiva, sem emoji, com encerramento e avaliação)

A partir desta versão, o prompt da IA foi reescrito para ser bem mais direto — sem emojis e sem textos longos para perguntas curtas (ex: um "Olá" recebe só "Olá! Em que posso ajudar?", não um parágrafo). Ela segue este roteiro:

1. Saudação curta → resposta curta, e espera a pergunta real do cliente.
2. Identifica o que o cliente quer (manual, foto do produto, comprar, falar com representante, dúvida de instalação) e usa a ferramenta certa direto, sem rodeio.
3. Depois de resolver, pergunta: "Posso ajudar em algo mais?"
4. Se o cliente disser que não precisa de mais nada, pergunta a nota de 1 a 5 do atendimento e salva com `registrar_avaliacao` (tabela `service_ratings`, migration `20260903120000_whatsapp_service_ratings.sql`). Isso também marca a conversa como `resolved`.

## Aviso automático pro seu WhatsApp quando a IA escala

Quando a IA chama `escalar_para_humano` (não conseguiu resolver, o cliente pediu uma pessoa, ou é uma situação de risco), além de marcar a conversa como `needs_human = true`, ela manda uma mensagem curta pelo WhatsApp para o número configurado no secret `SUPPORT_ADMIN_WHATSAPP` — algo como:

```
5516999998888 está precisando da sua ajuda!
Motivo: cliente pediu para falar com um técnico
```

Assim você não precisa ficar olhando o WhatsApp de Suporte Técnico o dia todo — só quando for chamado. Esse secret é opcional: se não for configurado, a IA continua escalando normalmente (só não manda o aviso).

A base de conhecimento (`knowledge_base`) é alimentada por você (ou por um Técnico Tromot) na página **IA Suporte** dentro do app (`/admin/base-conhecimento`). Cada entrada tem uma situação, uma solução e uma foto opcional. Ao salvar, o app chama a edge function `kb-embed`, que transforma o texto em um vetor numérico (embedding) e grava na coluna `knowledge_base.embedding`. A IA do WhatsApp usa esse vetor para achar, por significado (não só por palavra-chave), o caso mais parecido com o que o cliente está perguntando — inclusive instalações que não estão em nenhum manual oficial.

## Por que um provedor de embeddings além do Claude

O Claude é ótimo para conversar e decidir o que fazer, mas a Anthropic não oferece um modelo de embeddings (o número que representa o "significado" de um texto, usado para a busca semântica). Por isso a base de conhecimento usa a **Voyage AI** (voyage-3, recomendada pela própria Anthropic para uso com Claude, com bom suporte a português) só para essa etapa de indexação e busca. É uma chamada de API separada, barata, e só acontece: (1) quando você salva uma entrada na base de conhecimento, e (2) uma vez por mensagem recebida no WhatsApp (para buscar o caso mais parecido).

## Tabelas novas (migration `20260902120000_whatsapp_ai_knowledge_base.sql`)

- **`knowledge_base`** — seus casos ensinados: `title`, `situation`, `solution`, `category`, `image_url`, `embedding` (vetor). RLS: só ADM e Técnico Tromot podem ler/escrever pelo app; a IA lê via service role (não passa pela RLS).
- **`whatsapp_conversations`** — uma linha por número de telefone: nome, tipo de cliente, cidade/estado (aprendidos durante a conversa), distribuidor associado, status (`open` / `escalated` / `resolved`) e `needs_human` para a fila de atendimento humano.
- **`whatsapp_messages`** — histórico completo de mensagens (cliente e IA), para auditoria e para você revisar conversas na página **Conversas**.
- **`products.store_url`** — novo campo por produto com o link direto da página em `tromotstore.com.br`, editável no formulário de produto do admin. Se vazio, a IA manda o link da loja em geral.
- **`service_ratings`** (migration `20260903120000_whatsapp_service_ratings.sql`) — uma linha por avaliação de 1 a 5 dada pelo cliente ao final de um atendimento (nota + comentário opcional + data), em qualquer canal (WhatsApp ou chat do app). Como as tabelas de conversa são uma linha por cliente reaproveitada com o tempo, é esta tabela separada que dá o **histórico** de avaliações, não só a última.
- **`email_notification_settings`** e **`product_notifications`** (migration `20260903180000_product_email_notifications.sql`) — configuração automático/manual e fila/histórico dos emails de novidade de produto. Ver seção "Notificações de produto por email".
- **`app_chat_conversations`** e **`app_chat_messages`** (migration `20260903200000_app_chat.sql`) — espelham as tabelas do WhatsApp, mas identificadas por `session_id` (gerado no navegador) em vez de telefone, pra dar suporte ao chat dentro do app. Ver seção "Chat com a IA dentro do app".
- Bucket de storage **`knowledge-base`** — fotos anexadas aos casos da base de conhecimento.
- Função `match_knowledge_base(...)` — a busca semântica (cosine similarity) usada pela IA.

## Edge Functions novas

- **`_shared/supportAgent.ts`** — o "cérebro" da IA de Suporte: system prompt, as 7 ferramentas e a lógica de decisão. É o mesmo código pros dois canais (WhatsApp e chat do app) — só muda como o manual é entregue e como o cliente é identificado pra escalar, através de um pequeno adaptador (`SupportChannel`) que cada função monta.
- **`whatsapp-webhook`** — recebe as mensagens da uazapi, chama `runConversationTurn` de `supportAgent.ts`, envia a resposta de volta pelo WhatsApp.
- **`app-chat`** — o mesmo, mas para o botão de chat dentro do app; funciona logado ou anônimo.
- **`kb-embed`** — gera/atualiza o embedding de uma entrada da base de conhecimento. Chamada pelo app quando você salva um caso.
- **`product-change-webhook`** — chamada por um Database Webhook do Supabase quando a tabela `products` muda; decide o tipo de evento e dispara (ou enfileira) o email.
- **`send-pending-notification`** — chamada pelo botão "Enviar agora" no painel, quando o modo do evento está manual.
- **`unsubscribe`** — chamada pela página pública `/descadastro`, sem login.
- `_shared/uazapi.ts`, `_shared/claude.ts`, `_shared/embeddings.ts`, `_shared/cors.ts`, `_shared/resend.ts`, `_shared/productEmail.ts` — código compartilhado entre as funções acima.

## Páginas novas no app

- **`/admin/base-conhecimento`** (ADM e Técnico Tromot) — formulário para adicionar/editar/remover casos da base de conhecimento, com foto opcional.
- **`/admin/conversas`** (ADM) — lista de conversas do WhatsApp, com destaque para as que a IA escalou para atendimento humano (`needs_human`), um botão para marcar como resolvida, a última nota do cliente (badge com estrela) e, ao expandir a conversa, o histórico completo de avaliações dele.
- **`/admin/notificacoes-produto`** (ADM e Técnico Tromot) — os 3 switches automático/manual e a fila/histórico de emails de novidade de produto.
- **`/descadastro`** (pública) — página do link de descadastro que vai em todo email de novidade.
- Formulário de produto (`/admin`) — novo campo "Link de compra (tromotstore.com.br)".
- Perfil do cliente (`/perfil`) — novo switch "Novidades de produto" (liga/desliga o email, mesma preferência do link de descadastro).
- Botão flutuante de chat (aparece em qualquer página do app, para clientes logados ou não) — conversa direto com a IA sem precisar abrir o WhatsApp.

## Segredos que você precisa configurar no Supabase

No painel do projeto Supabase: **Project Settings → Edge Functions → Secrets** (ou via `supabase secrets set`):

| Secret | Para quê | Onde conseguir |
|---|---|---|
| `ANTHROPIC_API_KEY` | A IA que conversa com o cliente | console.anthropic.com |
| `VOYAGE_API_KEY` | Embeddings da base de conhecimento | dash.voyageai.com |
| `UAZAPI_BASE_URL` | URL da sua instância uazapi | painel da sua instância uazapi |
| `UAZAPI_TOKEN` | Token de autenticação da instância | painel da sua instância uazapi |
| `WHATSAPP_WEBHOOK_SECRET` | Segredo compartilhado para validar que o webhook realmente veio da uazapi (invente uma string longa e aleatória) | você mesmo define |
| `SUPPORT_ADMIN_WHATSAPP` (opcional) | Seu número de WhatsApp, para receber o aviso "fulano está precisando da sua ajuda!" sempre que a IA escalar um atendimento (WhatsApp ou chat do app) | você mesmo define — use o mesmo formato de número que a uazapi espera (ex: `5516999998888`) |
| `RESEND_API_KEY` | Envio dos emails de novidade de produto | dashboard da Resend (resend.com) → API Keys |
| `RESEND_FROM_EMAIL` (opcional) | Remetente que aparece nos emails, ex: `TROMOT PRO <novidades@tromot.com>` — se não definir, usa esse valor como padrão | você mesmo define, precisa ser um domínio verificado na Resend |
| `APP_BASE_URL` (opcional) | Base para montar os links dentro do email (produto, descadastro) — se não definir, usa `https://tromotpro.com.br` como padrão | você mesmo define |
| `PRODUCT_NOTIFICATIONS_SECRET` | Segredo compartilhado para validar que a chamada em `product-change-webhook` realmente veio do Database Webhook do Supabase (invente uma string longa e aleatória) | você mesmo define |

## Configurando o webhook na uazapi

Aponte o webhook de "mensagem recebida" da sua instância para:

```
https://<seu-projeto>.supabase.co/functions/v1/whatsapp-webhook?secret=<WHATSAPP_WEBHOOK_SECRET>
```

(o segredo também pode ir num header `x-webhook-secret` em vez da query string, se a uazapi permitir configurar headers customizados).

> **Importante:** eu não tive acesso à documentação atual/paga da sua instância uazapi para confirmar 100% o formato exato do payload de entrada e dos endpoints de envio. Deixei tudo isolado em `supabase/functions/_shared/uazapi.ts` — são só ~60 linhas. Antes de ativar de verdade: mande uma mensagem de teste, veja no log da função (`supabase functions logs whatsapp-webhook`) o payload bruto que chegou, e ajuste `parseInboundWebhook` se os nomes dos campos forem diferentes. O mesmo vale para `sendText`/`sendMedia` se os endpoints `/send/text` e `/send/media` não baterem com a sua versão.

## Como a IA decide o que fazer (system prompt)

O prompt (em `whatsapp-webhook/index.ts`) instrui a IA a:

1. Responder **somente** sobre produtos/instalação TROMOT — qualquer outro assunto, ela recusa educadamente.
2. Primeiro tentar achar a resposta no catálogo de produtos, manuais e na base de conhecimento.
3. Se não encontrar nada pronto, **perguntar ao cliente para medir e descrever** a situação (fios, cores, tensão), como um técnico faria por telefone — em vez de inventar uma instrução elétrica sem base.
4. Nunca inventar orientação de instalação elétrica arriscada; se não tiver certeza, escalar para um humano.
5. Perguntar cidade/estado quando o cliente quiser comprar ou falar com um representante, e então buscar o distribuidor mais próximo.
6. Mandar o link de `tromotstore.com.br` quando o cliente quiser comprar.

## Como a base de conhecimento cresce com o tempo (v1 — supervisionada)

Hoje, quando a IA resolve um caso novo que não estava documentado (orientando o cliente a medir/testar), **isso não vira uma entrada automática** na base de conhecimento — fica só registrado no histórico da conversa (`/admin/conversas`). A ideia é você revisar essas conversas de vez em quando e, para os casos que valeram a pena, adicionar manualmente em `/admin/base-conhecimento` com suas palavras. Isso evita que a IA aprenda algo errado sozinha e passe a ensinar isso para outros clientes.

**Evolução natural (v2, não implementada ainda):** a IA poderia gerar um rascunho de entrada da base de conhecimento a partir da conversa resolvida, e você só aprovaria/editaria antes de publicar — reduzindo seu trabalho de digitar do zero. Se quiser, implementamos isso depois que a v1 estiver rodando e você tiver visto como as conversas reais se parecem.

## Custos (ordem de grandeza, para você dimensionar)

- **Claude**: cobrado por token de entrada/saída a cada mensagem processada (inclui o histórico da conversa e as ferramentas). Uma conversa típica de suporte deve ficar na faixa de centavos.
- **Voyage AI**: muito barato — cobrado por embedding gerado (1 por caso salvo na base de conhecimento, 1 por mensagem recebida no WhatsApp).
- **uazapi**: geralmente um plano fixo mensal por instância/número conectado (confirme com o provedor).

## Login com Google

Foi adicionado um botão "Entrar com o Google" na tela de login (`/login`), que funciona tanto para quem já tem conta quanto para quem nunca usou o app — o Supabase cria a conta automaticamente no primeiro acesso, com o mesmo padrão de perfil (`role = 'Cliente'`) que já existia para cadastro por email.

Isso só funciona depois de você habilitar o provedor Google no projeto Supabase — é uma configuração de conta, não de código:

1. No **Google Cloud Console** (console.cloud.google.com): crie um projeto (ou use um existente) → **APIs e Serviços → Credenciais** → **Criar credenciais → ID do cliente OAuth** → tipo "Aplicativo da Web".
2. Em "URIs de redirecionamento autorizados", adicione: `https://<seu-projeto>.supabase.co/auth/v1/callback`.
3. Copie o **Client ID** e o **Client Secret** gerados.
4. No painel do Supabase: **Authentication → Providers → Google** → habilite e cole o Client ID e Client Secret do passo anterior → salve.
5. Pronto — o botão já funciona sem precisar mudar nada no código.

> Se o provedor não estiver habilitado, o botão mostra uma mensagem de erro ao ser clicado (não quebra o app) — é só voltar aqui e completar os passos acima.

## Notificações de produto por email

Quando um produto novo é criado, um manual é atualizado, ou dados de um produto existente mudam (nome, descrição, categoria, foto, compatibilidade ou link de compra), o sistema pode avisar por email os clientes que optaram por receber novidades. Para cada um desses 3 tipos de evento, você escolhe (na página **`/admin/notificacoes-produto`**) se o envio é:

- **Automático** — assim que a mudança acontece no banco, o email já sai sozinho.
- **Manual** — a mudança fica registrada como "pendente" na mesma página, e você clica em **"Enviar agora"** quando quiser (ex: depois de revisar o texto/foto do produto).

Só recebem o email os clientes com `email_notifications_opt_in = true` (ligado por padrão, mas o cliente pode desligar a qualquer momento no switch "Novidades de produto" em `/perfil`, ou clicando no link de descadastro que vai em todo email — página pública `/descadastro`).

### Como a mudança no produto chega até o email (Database Webhook)

Diferente da IA do WhatsApp (que é chamada diretamente pela uazapi), aqui quem avisa o sistema que um produto mudou é o próprio Supabase, através de um **Database Webhook** — um recurso do painel que dispara uma chamada HTTP toda vez que uma tabela é alterada. Isso evita colocar segredos ou URLs dentro de uma migration (que fica versionada no GitHub) e é a forma que o próprio Supabase recomenda para esse tipo de integração.

Depois que a migration `20260903180000_product_email_notifications.sql` rodar e você configurar o secret `PRODUCT_NOTIFICATIONS_SECRET`, configure o webhook assim:

1. No painel do Supabase: **Database → Webhooks → Create a new hook**.
2. Nome: algo como `product-change-notify`.
3. Tabela: `products`.
4. Eventos: marque **Insert** e **Update** (não precisa de Delete).
5. Tipo: **HTTP Request**.
6. Método: `POST`.
7. URL: `https://<seu-projeto>.supabase.co/functions/v1/product-change-webhook`.
8. Headers: adicione um header `x-webhook-secret` com o mesmo valor do secret `PRODUCT_NOTIFICATIONS_SECRET`.
9. Salvar.

A partir daí, toda vez que um produto for criado ou editado, o Supabase chama `product-change-webhook`, que descobre o tipo de evento (produto novo, manual trocado, ou outro campo alterado), confere se o modo está automático ou manual para aquele tipo, e ou já dispara o envio (automático) ou só deixa registrado como pendente (manual) na tabela `product_notifications`, visível em `/admin/notificacoes-produto`.

### Configurando a Resend

1. Crie uma conta em resend.com (tem plano gratuito para volumes pequenos/médios).
2. Em **Domains**, adicione o domínio que você quer usar para enviar (ex: `tromot.com`) e cadastre no seu provedor de DNS os registros **SPF/DKIM** que a Resend mostrar na tela — sem isso, os emails tendem a cair em spam ou nem serem entregues.
3. Espere o domínio aparecer como "Verified" (geralmente rápido, pode levar até algumas horas dependendo do DNS).
4. Em **API Keys**, crie uma chave e configure como o secret `RESEND_API_KEY`.
5. Defina `RESEND_FROM_EMAIL` com um endereço desse domínio verificado, ex: `TROMOT PRO <novidades@tromot.com>`.

> Sem o domínio verificado, a Resend recusa o envio (ou só permite mandar para o próprio email cadastrado na conta, dependendo do plano) — é o primeiro lugar para checar se um envio falhar.

## Chat com a IA dentro do app

Além do WhatsApp, agora existe um botão de chat flutuante (bolha no canto da tela, em qualquer página do app) para o cliente conversar direto com a mesma IA de Suporte, sem precisar sair do app nem abrir o WhatsApp. Funciona para cliente logado ou visitante anônimo.

Para isso, a lógica da IA (prompt, ferramentas, decisões) foi extraída do `whatsapp-webhook` para um módulo compartilhado, `_shared/supportAgent.ts` — é o mesmo "cérebro" para os dois canais, então uma pergunta sobre manual, produto, compra ou instalação é respondida da mesma forma seja pelo WhatsApp ou pelo chat do app. O que muda entre os dois canais:

- **Como o manual é entregue**: no WhatsApp, a IA manda o arquivo direto na conversa; no chat do app, ela manda o link e o front-end pode mostrar um botão.
- **Como o cliente é identificado para escalar**: no WhatsApp já existe o número de telefone; no chat do app, se o cliente estiver logado, usa o WhatsApp/email do perfil dele automaticamente — se estiver anônimo e a IA precisar escalar (`escalar_para_humano`) sem ter nenhum contato, **ela pergunta um WhatsApp ou email antes de escalar**, do mesmo jeito que já pergunta cidade/estado para achar um distribuidor. Assim você sempre recebe um contato junto com o aviso de que alguém precisa de ajuda.

Cada conversa do chat do app é identificada por um `session_id` gerado no navegador do cliente (guardado no `localStorage`, tabela `app_chat_conversations`) — funciona mesmo sem login, e se o cliente logar depois, a conversa é automaticamente associada à conta dele. O histórico de conversas do chat do app pode ser adicionado à página **Conversas** do admin futuramente (hoje ela mostra só o WhatsApp); por enquanto, as tabelas `app_chat_conversations`/`app_chat_messages` já guardam tudo, caso queira consultar direto no banco.

## O que falta para ativar

1. Rodar as migrations (`20260902120000_whatsapp_ai_knowledge_base.sql`, `20260903120000_whatsapp_service_ratings.sql`, `20260903180000_product_email_notifications.sql` e `20260903200000_app_chat.sql`) no projeto — o Lovable faz isso automaticamente ao sincronizar com o GitHub, ou via `supabase db push`.
2. Configurar os secrets listados acima: os 5 originais do WhatsApp + `SUPPORT_ADMIN_WHATSAPP` (opcional) + os 4 novos de email (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_BASE_URL`, `PRODUCT_NOTIFICATIONS_SECRET`).
3. Fazer o deploy das edge functions (`whatsapp-webhook`, `app-chat`, `kb-embed`, `product-change-webhook`, `send-pending-notification`, `unsubscribe`) — o Lovable faz isso automaticamente a partir do GitHub também.
4. Apontar o webhook da uazapi (ver seção acima) e confirmar o formato do payload no primeiro teste real.
5. Verificar o domínio de envio na Resend (SPF/DKIM) e configurar o Database Webhook no Supabase apontando para `product-change-webhook` (ver seção "Notificações de produto por email" acima) — sem isso, os emails de novidade não saem.
6. Cadastrar alguns casos iniciais em `/admin/base-conhecimento` para a IA já começar com alguma bagagem.
7. Preencher `store_url` nos produtos mais vendidos (não precisa ser todos de uma vez).
8. Habilitar o provedor Google no Supabase (ver seção "Login com Google" acima), se quiser usar esse botão.
9. Testar o chat dentro do app (bolha flutuante no canto da tela) como visitante anônimo e como cliente logado, e testar o fluxo de um produto/manual sendo alterado (automático e manual) em `/admin/notificacoes-produto`.
10. Rodar a geração de tipos do Supabase (`supabase gen types typescript`) para que todas as tabelas novas (`knowledge_base`, `whatsapp_conversations`, `whatsapp_messages`, `service_ratings`, `products.store_url`, `email_notification_settings`, `product_notifications`, `app_chat_conversations`, `app_chat_messages`) fiquem tipadas no app (hoje usam `as any`, seguindo o mesmo padrão já existente no projeto para `clientes`/`bling_tokens`/`pedidos`).
