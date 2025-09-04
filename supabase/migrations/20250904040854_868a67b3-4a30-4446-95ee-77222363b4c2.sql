-- Add city and state to profiles table
ALTER TABLE public.profiles 
ADD COLUMN city TEXT,
ADD COLUMN state TEXT;

-- Create distributors table
CREATE TABLE public.distributors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  state TEXT NOT NULL,
  city TEXT,
  cover_entire_state BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for distributors
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;

-- RLS policies for distributors
CREATE POLICY "ADMs podem gerenciar distribuidores" 
ON public.distributors 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'ADM'::user_role
));

CREATE POLICY "Todos podem ver distribuidores ativos" 
ON public.distributors 
FOR SELECT 
USING (active = true);

-- Create trigger for distributors updated_at
CREATE TRIGGER update_distributors_updated_at
BEFORE UPDATE ON public.distributors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance on distributor queries
CREATE INDEX idx_distributors_state_city ON public.distributors(state, city) WHERE active = true;
CREATE INDEX idx_distributors_state ON public.distributors(state) WHERE active = true AND cover_entire_state = true;