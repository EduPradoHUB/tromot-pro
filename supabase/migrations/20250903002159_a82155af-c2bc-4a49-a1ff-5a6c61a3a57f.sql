-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "ADMs podem gerenciar categorias" 
ON public.categories 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'ADM'::user_role
));

CREATE POLICY "Todos podem ver categorias ativas" 
ON public.categories 
FOR SELECT 
USING (active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add some default categories
INSERT INTO public.categories (name, description) VALUES 
('Som e Multimídia', 'Sistemas de som, centrais multimídia e acessórios relacionados'),
('Acessórios Externos', 'Acessórios para a parte externa do veículo'),
('Acessórios Internos', 'Acessórios para o interior do veículo'),
('Elétrica', 'Componentes e acessórios elétricos'),
('Segurança', 'Dispositivos de segurança e proteção');