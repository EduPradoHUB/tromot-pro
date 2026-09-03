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
- **`service_ratings`** (migration `20260903120000_whatsapp_service_ratings.sql`) — uma linha por avaliação de 1 a 5 dada pelo cliente ao final de um atendimento (nota + comentário opcional + data). Como `whatsapp_conversations` é uma linha por telefone reaproveitada com o tempo, é esta tabela separada que dá o **histórico** de avaliações de cada cliente, não só a última.
- Bucket de storage **`knowledge-base`** — fotos anexadas aos casos da base de conhecimento.
- Função `match_knowledge_base(...)` — a busca semântica (cosine similarity) usada pela IA.

## Edge Functions novas

- **`whatsapp-webhook`** — recebe as mensagens da uazapi, roda o loop de ferramentas com a Claude API, envia a resposta de volta. É a única peça que fala tanto com a uazapi quanto com a Claude.
- **`kb-embed`** — gera/atualiza o embedding de uma entrada da base de conhecimento. Chamada pelo app quando você salva um caso.
- `_shared/uazapi.ts`, `_shared/claude.ts`, `_shared/embeddings.ts`, `_shared/cors.ts` — código compartilhado entre as duas funções acima.

## Páginas novas no app

- **`/admin/base-conhecimento`** (ADM e Técnico Tromot) — formulário para adicionar/editar/remover casos da base de conhecimento, com foto opcional.
- **`/admin/conversas`** (ADM) — lista de conversas do WhatsApp, com destaque para as que a IA escalou para atendimento humano (`needs_human`), um botão para marcar como resolvida, a última nota do cliente (badge com estrela) e, ao expandir a conversa, o histórico completo de avaliações dele.
- Formulário de produto (`/admin`) — novo campo "Link de compra (tromotstore.com.br)".

## Segredos que você precisa configurar no Supabase

No painel do projeto Supabase: **Project Settings → Edge Functions → Secrets** (ou via `supabase secrets set`):

| Secret | Para quê | Onde conseguir |
|---|---|---|
| `ANTHROPIC_API_KEY` | A IA que conversa com o cliente | console.anthropic.com |
| `VOYAGE_API_KEY` | Embeddings da base de conhecimento | dash.voyageai.com |
| `UAZAPI_BASE_URL` | URL da sua instância uazapi | painel da sua instância uazapi |
| `UAZAPI_TOKEN` | Token de autenticação da instância | painel da sua instância uazapi |
| `WHATSAPP_WEBHOOK_SECRET` | Segredo compartilhado para validar que o webhook realmente veio da uazapi (invente uma string longa e aleatória) | você mesmo define |
| `SUPPORT_ADMIN_WHATSAPP` (opcional) | Seu número de WhatsApp, para receber o aviso "fulano está precisando da sua ajuda!" sempre que a IA escalar um atendimento | você mesmo define — use o mesmo formato de número que a uazapi espera (ex: `5516999998888`) |

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

## O que falta para ativar

1. Rodar as migrations (`20260902120000_whatsapp_ai_knowledge_base.sql` e `20260903120000_whatsapp_service_ratings.sql`) no projeto — o Lovable faz isso automaticamente ao sincronizar com o GitHub, ou via `supabase db push`.
2. Configurar os secrets listados acima (os 5 originais + `SUPPORT_ADMIN_WHATSAPP` opcional).
3. Fazer o deploy das edge functions (`whatsapp-webhook`, `kb-embed`) — o Lovable faz isso automaticamente a partir do GitHub também.
4. Apontar o webhook da uazapi (ver seção acima) e confirmar o formato do payload no primeiro teste real.
5. Cadastrar alguns casos iniciais em `/admin/base-conhecimento` para a IA já começar com alguma bagagem.
6. Preencher `store_url` nos produtos mais vendidos (não precisa ser todos de uma vez).
7. Habilitar o provedor Google no Supabase (ver seção "Login com Google" acima), se quiser usar esse botão.
8. Rodar a geração de tipos do Supabase (`supabase gen types typescript`) para que `knowledge_base`, `whatsapp_conversations`, `whatsapp_messages`, `service_ratings` e `products.store_url` fiquem tipados no app (hoje usam `as any`, seguindo o mesmo padrão já existente no projeto para `clientes`/`bling_tokens`/`pedidos`).
