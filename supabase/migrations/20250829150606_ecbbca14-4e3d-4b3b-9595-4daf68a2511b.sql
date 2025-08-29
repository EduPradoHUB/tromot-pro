-- Corrigir as funções com search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    'Cliente'
  );
  RETURN NEW;
END;
$$;

-- Habilitar RLS na tabela vehicles que estava faltando
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Policies para vehicles
CREATE POLICY "Todos podem ver veículos" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "ADMs e Técnicos podem gerenciar veículos" ON public.vehicles FOR ALL USING (
  EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('ADM', 'Técnico Tromot'))
);