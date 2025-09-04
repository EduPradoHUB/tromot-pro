-- Inserir conteúdo padrão para o footer
INSERT INTO public.editable_content (section, title, subtitle, description) VALUES
('footer-description', NULL, NULL, 'App para instaladores e técnicos de produtos eletrônicos automotivos.'),
('footer-support-title', 'Suporte', NULL, NULL),
('footer-legal-title', 'Legal', NULL, NULL),
('footer-copyright', NULL, NULL, '© 2025 Tromot Indústria Eletrônica. Todos os direitos reservados.')
ON CONFLICT (section) DO NOTHING;