-- Create a table for editable content
CREATE TABLE public.editable_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL UNIQUE,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.editable_content ENABLE ROW LEVEL SECURITY;

-- Create policies for reading (everyone can read)
CREATE POLICY "Everyone can view editable content" 
ON public.editable_content 
FOR SELECT 
USING (true);

-- Create policies for admin access
CREATE POLICY "Admins can manage editable content" 
ON public.editable_content 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'ADM'
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'ADM'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_editable_content_updated_at
BEFORE UPDATE ON public.editable_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default hero content
INSERT INTO public.editable_content (section, title, subtitle, description) VALUES 
('hero', 'Soluções Eletrônicas', 'para Instaladores', 'Acesse manuais, compartilhe instalações e encontre suporte técnico especializado.');