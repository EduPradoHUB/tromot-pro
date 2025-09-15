UPDATE editable_content 
SET title = 'Busca Rápida', 
    description = 'Pesquise produtos, veículos e categorias em todo o app',
    updated_at = NOW()
WHERE section = 'quick-search';