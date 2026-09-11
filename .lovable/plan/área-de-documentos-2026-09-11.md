# Área de Documentos

## Objetivo
Substituir o compartilhamento de arquivos pelo Google Drive com uma área interna do TROMOT PRO para documentos comerciais.

## O que será criado
- Tabela `documents` com título, categoria controlada, descrição, endereço do arquivo, tipo, responsável e datas.
- Regras de acesso: ADM e Técnico Tromot gerenciam; ADM, Técnico Tromot e Vendedor consultam.
- Bucket público `documentos`, com leitura pública do arquivo e envio/alteração/remoção restritos a ADM e Técnico Tromot.
- Página `/admin/documentos` com formulário de upload, edição, exclusão e listagem.
- Página `/documentos` com documentos agrupados por categoria e “Tabela de Preços” em destaque no topo.
- Links “Gerenciar Documentos” e “Documentos” nos menus dos papéis correspondentes.

## Interface
- Upload com título, categoria, descrição opcional e seleção de arquivo.
- Ícones adequados para PDF, planilha, imagem, Word e outros formatos.
- Estados de carregamento, lista vazia, confirmação de exclusão e mensagens de sucesso/erro.
- Ações “Abrir” para formatos visualizáveis e “Baixar” para os demais.
- Layout responsivo usando os componentes e cores já existentes no TROMOT PRO.

## Detalhes técnicos
- A categoria será validada no banco entre: tabela de preços, política comercial, política de frete, política de trocas, ficha cadastral, catálogo e outro.
- O responsável pelo upload será associado ao identificador do perfil autenticado, evitando dependência direta da tabela interna de autenticação.
- A atualização automática de `updated_at` reutilizará a função existente.
- As páginas usarão as proteções de rota já existentes e consultas diretas ao Supabase com RLS.
- Ao substituir ou excluir um documento, o arquivo anterior também será removido do bucket para evitar arquivos órfãos.

## Validação
- Confirmar criação, edição, exclusão, upload e abertura/download.
- Confirmar que Vendedor acessa somente a consulta.
- Confirmar que Cliente e demais papéis não acessam nenhuma das duas páginas.
- Verificar desktop e celular, além de erros de compilação e execução.
