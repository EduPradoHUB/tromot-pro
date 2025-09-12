-- Adicionar constraint única na coluna section se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'editable_content_section_key'
    ) THEN
        ALTER TABLE editable_content 
        ADD CONSTRAINT editable_content_section_key UNIQUE (section);
    END IF;
END $$;